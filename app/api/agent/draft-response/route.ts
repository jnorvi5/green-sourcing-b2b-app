import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getEPDData } from '@/lib/autodesk-sda'

const client = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: process.env.AZURE_OPENAI_ENDPOINT,
})

export async function POST(req: Request) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    const body = await req.json()
    const { rfq_id } = body

    // Get RFQ
    const { data: rfq } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfq_id)
        .single()

    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })

    // Get supplier's products
    const { data: products } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', session.user.id)

    // Get supplier info
    const { data: supplier } = await supabase
        .from('suppliers')
        .select('name, certifications')
        .eq('id', session.user.id)
        .single()

    // Get EPD data for materials
    const epdPromises = rfq.materials?.map((m: string) => getEPDData(m)) || []
    const epdResults = await Promise.all(epdPromises)

    // AI draft response
    const prompt = `You are drafting a professional supplier quote response for sustainable building materials.

RFQ Details:
- Materials requested: ${rfq.materials?.join(', ')}
- Budget: $${rfq.budget}
- Timeline: ${rfq.timeline}
- Project location: ${rfq.job_site_location}

Your Company: ${supplier?.name}
Your Certifications: ${supplier?.certifications?.join(', ') || 'None listed'}

Your Available Products:
${products?.map(p => `- ${p.name}: ${p.description} (Category: ${p.category})`).join('\n') || 'No products listed'}

Environmental Data (from EPDs):
${epdResults.map(e => `- ${e.material}: ${e.embodied_carbon_kg} kg CO2 per unit`).join('\n')}

Task: Draft a quote response that includes:
1. Matched products from your inventory that meet their materials request
2. Estimated pricing (stay within or slightly below their budget, be realistic)
3. Environmental impact summary (LCA data, carbon footprint)
4. Compliance notes (certifications, LEED credits if applicable)
5. Professional message they can edit

Return ONLY valid JSON in this exact format:
{
  "matched_products": [
    {"product_id": "uuid-here", "product_name": "Product Name", "quantity": 10, "unit_price": 500}
  ],
  "estimated_total": 50000,
  "lca_summary": "Our recycled steel reduces embodied carbon by 40% compared to virgin steel. Total project carbon footprint: 1,200 kg CO2.",
  "compliance_notes": "LEED v4.1 certified. Qualifies for Materials & Resources credits MR1 (EPD) and MR2 (Regional Materials if <100mi).",
  "draft_message": "Dear [Architect Name],\n\nThank you for your RFQ..."
}`

    try {
        const response = await client.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            max_tokens: 1000,
        })

        const draft = JSON.parse(response.choices[0].message.content!)

        // Log AI usage
        const tokensUsed = response.usage?.total_tokens || 800
        const costUsd = (tokensUsed / 1000) * 0.03

        await supabase.from('ai_agent_logs').insert({
            user_id: session.user.id,
            rfq_id,
            agent_type: 'supplier_draft',
            input_data: { rfq_materials: rfq.materials, budget: rfq.budget },
            output_data: draft,
            model_used: 'gpt-4o',
            tokens_used: tokensUsed,
            cost_usd: costUsd,
        })

        return NextResponse.json(draft)
    } catch (error) {
        console.error('AI draft error:', error)
        return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }
}
