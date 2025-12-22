import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getEPDData } from '@/lib/autodesk-sda'

const apiKey = process.env['AZURE_OPENAI_API_KEY'];
const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
const deploymentName = process.env['AZURE_OPENAI_DEPLOYMENT_NAME'];

const client = new OpenAI({
    apiKey: apiKey!,
    baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
    defaultQuery: { 'api-version': '2024-02-15-preview' },
    defaultHeaders: { 'api-key': apiKey! },
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
        .from('products')
        .select('*')
        .eq('supplier_id', session.user.id)

    // Get EPD data for materials
    const epdPromises = rfq.materials?.map((m: string) => getEPDData(m)) || []
    const epdResults = await Promise.all(epdPromises)

    // AI draft response
    const prompt = `You are drafting a supplier quote response.

RFQ Details:
- Materials: ${rfq.materials?.join(', ')}
- Budget: $${rfq.budget}
- Timeline: ${rfq.timeline}

Your Products:
${products?.map(p => `- ${p.name}: ${p.description}`).join('\n')}

EPD Data:
${epdResults.map(e => `- ${e.material}: ${e.embodied_carbon_kg} kg CO2`).join('\n')}

Draft a professional quote response with:
1. Matched products from your inventory
2. Estimated pricing (use budget as guide)
3. Environmental impact summary
4. Compliance notes

Return JSON only:
{
  "matched_products": [{"product_id": "...", "product_name": "...", "quantity": 0}],
  "estimated_total": 0,
  "lca_summary": "...",
  "compliance_notes": "...",
  "draft_message": "..."
}`

    try {
        const response = await client.chat.completions.create({
            model: deploymentName!,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        })

        const draft = JSON.parse(response.choices[0].message.content!)

        // Log AI usage
        await supabase.from('ai_agent_logs').insert({
            user_id: session.user.id,
            rfq_id,
            agent_type: 'supplier_draft',
            input_data: { rfq_materials: rfq.materials },
            output_data: draft,
            model_used: 'gpt-4o',
        })

        return NextResponse.json(draft)
    } catch (e) {
        console.error('AI draft error:', e);
        return NextResponse.json({ error: 'AI drafting failed' }, { status: 500 })
    }
}
