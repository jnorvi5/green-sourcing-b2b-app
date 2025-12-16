import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const supabase = createServerClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['SUPABASE_SERVICE_ROLE_KEY']!,
        {
            cookies: {
                get: (name: string) => cookies().get(name)?.value,
                set: () => { },
                remove: () => { },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rfq_id, user_role } = await req.json()

    const { data: rfq } = await supabase.from('rfqs').select('*').eq('id', rfq_id).single()
    if (!rfq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check if supplier is premium (if supplier is initiating)
    if (user_role === 'supplier') {
        const { data: subscription } = await supabase
            .from('supplier_subscriptions')
            .select('plan_id, supplier_plans:plan_id(plan_name)')
            .eq('supplier_id', session.user.id)
            .eq('status', 'active')
            .single()

        // supplier_plans is an array due to the join
        const supplierPlans = subscription?.supplier_plans as { plan_name: string }[] | null;
        const isPremium = supplierPlans?.[0] && ['Basic', 'Enterprise'].includes(supplierPlans[0].plan_name)

        // Check existing conversation (architect may have initiated)
        const { data: existing } = await supabase
            .from('rfq_chat_sessions')
            .select('intercom_conversation_id')
            .eq('rfq_id', rfq_id)
            .single()

        // If not premium AND no existing conversation, deny
        if (!isPremium && !existing) {
            return NextResponse.json(
                {
                    error: 'Premium feature',
                    message: 'Upgrade to Basic ($199/mo) or Enterprise to chat with architects.',
                    requires_premium: true
                },
                { status: 403 }
            )
        }
    }

    // Check existing session
    const { data: existingSession } = await supabase
        .from('rfq_chat_sessions')
        .select('intercom_conversation_id')
        .eq('rfq_id', rfq_id)
        .eq('user_id', session.user.id)
        .single()

    if (existingSession) {
        return NextResponse.json({ conversation_id: existingSession.intercom_conversation_id })
    }

    // Create Intercom conversation
    try {
        const conversationId = `rfq_${rfq_id}_${Date.now()}`

        // Save session
        await supabase.from('rfq_chat_sessions').insert({
            rfq_id,
            user_id: session.user.id,
            user_role,
            intercom_conversation_id: conversationId,
        })

        return NextResponse.json({
            conversation_id: conversationId,
            intercom_app_id: process.env['NEXT_PUBLIC_INTERCOM_APP_ID'],
        })
    } catch (error) {
        console.error('Chat init error:', error)
        return NextResponse.json({ error: 'Failed to initialize chat' }, { status: 500 })
    }
}
