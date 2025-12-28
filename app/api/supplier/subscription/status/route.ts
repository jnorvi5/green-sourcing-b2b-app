import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if current user is a supplier and get their plan
    const { data: subscription } = await supabase
        .from('supplier_subscriptions')
        .select('plan_id, supplier_plans:plan_id(plan_name)')
        .eq('supplier_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle()

    const planName = (subscription?.supplier_plans as unknown as { plan_name: string })?.plan_name || 'Free';

    return NextResponse.json({
        plan_name: planName
    })
}
