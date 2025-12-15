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

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: credits } = await supabase
        .from('rfq_credits')
        .select('balance_cents')
        .eq('user_id', session.user.id)
        .single()

    return NextResponse.json({
        balance_cents: credits?.balance_cents || 0
    })
}
