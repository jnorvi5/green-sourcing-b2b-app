import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sendSMS } from '@/lib/quo'

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

    const { rfq_id, supplier_id } = await req.json()

    // Get supplier phone
    const { data: supplier } = await supabase
        .from('suppliers')
        .select('name, phone')
        .eq('id', supplier_id)
        .single()

    if (!supplier?.phone) {
        return NextResponse.json({ error: 'No phone on file' }, { status: 400 })
    }

    // Get RFQ details
    const { data: rfq } = await supabase
        .from('rfqs')
        .select('materials, budget')
        .eq('id', rfq_id)
        .single()

    if (!rfq) {
        return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    // Send SMS
    try {
        await sendSMS(
            supplier.phone,
            `🌿 New RFQ on GreenChainz!\nMaterials: ${rfq.materials.join(', ')}\nBudget: $${rfq.budget}\n\nView & respond: https://greenchainz.com/supplier/rfqs/${rfq_id}`
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('SMS notification error:', error)
        return NextResponse.json({ error: 'SMS failed' }, { status: 500 })
    }
}
