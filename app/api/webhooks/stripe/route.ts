import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
    apiVersion: '2023-10-16',
})

// This secret should be in your environment variables
const endpointSecret = process.env['STRIPE_WEBHOOK_SECRET']

export async function POST(req: Request) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature') as string

    let event: Stripe.Event

    try {
        if (!endpointSecret) throw new Error('Missing Stripe Webhook Secret')
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`)
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['SUPABASE_SERVICE_ROLE_KEY']!,
        {
            cookies: {
                get: (name: string) => cookieStore.get(name)?.value,
                set: (_name: string, _value: string) => { },
                remove: (_name: string) => { },
            },
        }
    )

    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            const userIdMeta = paymentIntent.metadata?.['user_id']
            const purchaseType = paymentIntent.metadata?.['purchase_type']

            if (userIdMeta && purchaseType) {
                if (purchaseType === 'deposit') {
                    // Record deposit as paid
                    await supabase
                        .from('architect_deposits')
                        .upsert({
                            user_id: userIdMeta,
                            status: 'charged',
                            stripe_payment_intent_id: paymentIntent.id,
                            charged_at: new Date().toISOString(),
                            deposit_amount_cents: paymentIntent.amount
                        }, { onConflict: 'user_id' })

                    // Add $50 credit (5000 cents)
                    const { data: existing } = await supabase
                        .from('rfq_credits')
                        .select('balance_cents, total_purchased_cents')
                        .eq('user_id', userIdMeta)
                        .single()

                    const newBalance = (existing?.balance_cents || 0) + 5000
                    const newTotal = (existing?.total_purchased_cents || 0) + 5000

                    await supabase.from('rfq_credits').upsert({
                        user_id: userIdMeta,
                        balance_cents: newBalance,
                        total_purchased_cents: newTotal,
                        last_refill_date: new Date().toISOString(),
                    }, { onConflict: 'user_id' })

                } else if (purchaseType === 'credits') {
                    // Add credits to account
                    const creditsAmount = paymentIntent.amount // in cents

                    await supabase
                        .from('rfq_charges')
                        .insert({
                            user_id: userIdMeta,
                            amount_cents: creditsAmount,
                            charge_type: 'credits_purchase',
                            stripe_payment_intent_id: paymentIntent.id,
                        })

                    const { data: existing } = await supabase
                        .from('rfq_credits')
                        .select('balance_cents, total_purchased_cents')
                        .eq('user_id', userIdMeta)
                        .single()

                    const newBalance = (existing?.balance_cents || 0) + creditsAmount
                    const newTotal = (existing?.total_purchased_cents || 0) + creditsAmount

                    await supabase.from('rfq_credits').upsert({
                        user_id: userIdMeta,
                        balance_cents: newBalance,
                        total_purchased_cents: newTotal,
                        last_refill_date: new Date().toISOString(),
                    }, { onConflict: 'user_id' })
                }
            }
            break
    }

    return NextResponse.json({ received: true })
}
