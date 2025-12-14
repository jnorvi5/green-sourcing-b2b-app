import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { calculateDistance, calculateTransportCarbon, calculateTier } from '@/lib/carbon'
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
        .eq('architect_id', session.user.id)
        .single()

    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })

    // Get all suppliers
    const { data: suppliers } = await supabase
        .from('suppliers')
        .select(`
      id, name, location, lat, lng, verification_status, certifications, description,
      products (id, name, category, epd_data)
    `)

    // Get premium supplier IDs
    const { data: subscriptions } = await supabase
        .from('supplier_subscriptions')
        .select('supplier_id, plan_id, supplier_plans:plan_id(plan_name)')
        .eq('status', 'active')

    const premiumIds = subscriptions
        ?.filter((s: any) => ['Basic', 'Enterprise'].includes(s.supplier_plans?.plan_name))
        .map((s: any) => s.supplier_id) || []

    // Calculate distance, carbon, tier for each supplier
    const ranked = await Promise.all(
        suppliers!.map(async (supplier: any) => {
            const distance = calculateDistance(
                rfq.job_site_lat,
                rfq.job_site_lng,
                supplier.lat,
                supplier.lng
            )

            // Get embodied carbon from EPD
            const epdData = await getEPDData(rfq.materials?.[0] || 'steel')
            const embodiedCarbon = epdData.embodied_carbon_kg * (rfq.material_weight_tons || 1)
            const transportCarbon = calculateTransportCarbon(distance, rfq.material_weight_tons || 1)
            const totalCarbon = embodiedCarbon + transportCarbon

            const isVerified = supplier.verification_status === 'verified'
            const isPremium = premiumIds.includes(supplier.id)
            const tier = calculateTier(isVerified, isPremium, distance)

            // AI match score
            const matchScore = await calculateMatchScore(rfq.materials, supplier.products)

            return {
                ...supplier,
                distance_miles: Math.round(distance),
                transport_carbon_kg: Math.round(transportCarbon),
                embodied_carbon_kg: Math.round(embodiedCarbon),
                total_carbon_kg: Math.round(totalCarbon),
                is_verified: isVerified,
                is_premium: isPremium,
                tier,
                match_score: matchScore,
            }
        })
    )

    // Sort: Tier 1 → 2 → 3 → 4, then by match score
    ranked.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier
        return b.match_score - a.match_score
    })

    // Log AI usage
    const tokensUsed = 500 // Estimate
    const costUsd = (tokensUsed / 1000) * 0.03 // GPT-4o pricing

    await supabase.from('ai_agent_logs').insert({
        user_id: session.user.id,
        rfq_id,
        agent_type: 'architect_find',
        input_data: { materials: rfq.materials, location: rfq.job_site_location },
        output_data: {
            suppliers_found: ranked.length,
            tier_breakdown: {
                tier1: ranked.filter(s => s.tier === 1).length,
                tier2: ranked.filter(s => s.tier === 2).length,
                tier3: ranked.filter(s => s.tier === 3).length,
                tier4: ranked.filter(s => s.tier === 4).length,
            }
        },
        model_used: 'gpt-4o',
        tokens_used: tokensUsed,
        cost_usd: costUsd,
    })

    // Save carbon calcs
    await Promise.all(
        ranked.map(s =>
            supabase.from('rfq_carbon_calc').insert({
                rfq_id,
                supplier_id: s.id,
                distance_miles: s.distance_miles,
                transport_carbon_kg: s.transport_carbon_kg,
                embodied_carbon_kg: s.embodied_carbon_kg,
                total_carbon_kg: s.total_carbon_kg,
                tier: s.tier,
            })
        )
    )

    return NextResponse.json({ suppliers: ranked })
}

// AI match scoring
async function calculateMatchScore(materials: string[], products: any[]) {
    if (!materials || materials.length === 0) return 50

    const prompt = `Materials needed: ${materials.join(', ')}
Products available: ${products.map(p => p.name).join(', ')}

Score 0-100 how well these products match the materials needed.
Return ONLY a JSON object: {"match_score": 85}`

    try {
        const response = await client.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            max_tokens: 50,
        })

        const result = JSON.parse(response.choices[0].message.content!)
        return result.match_score || 50
    } catch (error) {
        console.error('AI match score error:', error)
        return 50 // Fallback
    }
}
