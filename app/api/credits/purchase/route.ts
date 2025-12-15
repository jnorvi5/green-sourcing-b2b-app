import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
    apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['SUPABASE_SERVICE_ROLE_KEY']!,
        {
            cookies: {
                get: (name: string) => cookieStore.get(name)?.value,
                set: () => { },
                remove: () => { },
            },
        }
    )

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { amount_cents, purchase_type } = body // purchase_type: 'deposit' | 'credits'

    let description = ''
    if (purchase_type === 'deposit') {
        description = 'GreenChainz $50 Architect Deposit'
    } else {
        description = `GreenChainz RFQ Credits - $${(amount_cents / 100).toFixed(2)}`
    }

    try {
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount_cents,
            currency: 'usd',
            description,
            metadata: {
                user_id: session.user.id,
                purchase_type,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        })

        return NextResponse.json({
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
        })
    } catch (error) {
        console.error('Stripe error:', error)
        return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
    }
}
