import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { z } from 'zod'
import { calculateDistance, calculateTransportCarbon, calculateTier } from '@/lib/carbon'
import { getEPDData } from '@/lib/autodesk-sda'
import { SUPPLIER_CANDIDATE_LIMIT, AZURE_DEPLOYMENT_EXPENSIVE } from '@/lib/constants'

// Input validation schema
const RequestSchema = z.object({
    rfq_id: z.string().uuid(),
})

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

    // Validate Input
    let body
    try {
        body = await req.json()
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parse = RequestSchema.safeParse(body)
    if (!parse.success) {
        return NextResponse.json({ error: 'Invalid input', details: parse.error }, { status: 400 })
    }
    const { rfq_id } = parse.data

    // Get RFQ
    const { data: rfq } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfq_id)
        .eq('architect_id', session.user.id)
        .single()

    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })

    // 1. Fetch EPD data ONCE for the material (not per supplier)
    // Optimization: Only fetch for the primary material to save time
    const primaryMaterial = rfq.materials?.[0] || 'steel'
    const epdData = await getEPDData(primaryMaterial)
    const embodiedCarbonBase = epdData.embodied_carbon_kg * (rfq.material_weight_tons || 1)

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
        ?.filter((s: { supplier_plans: { plan_name: string }[] }) =>
            s.supplier_plans?.[0] && ['Basic', 'Enterprise'].includes(s.supplier_plans[0].plan_name)
        )
        .map((s: { supplier_id: string }) => s.supplier_id) || []

    // Define the shape of supplier data from our query
    type SupplierQueryResult = {
      id: string;
      name: string;
      location: string;
      lat: number;
      lng: number;
      verification_status: string;
      certifications: unknown[];
      description: string;
      products: { id: string; name: string; category: string; epd_data: unknown }[];
    };

    // 2. Sync Calculation: Calculate Distance, Carbon, and Tier for ALL suppliers locally
    // This is fast and cheap.
    const candidates = (suppliers as SupplierQueryResult[] || []).map((supplier) => {
        const distance = calculateDistance(
            rfq.job_site_lat,
            rfq.job_site_lng,
            supplier.lat,
            supplier.lng
        )

        const transportCarbon = calculateTransportCarbon(distance, rfq.material_weight_tons || 1)
        const totalCarbon = embodiedCarbonBase + transportCarbon

        const isVerified = supplier.verification_status === 'verified'
        const isPremium = premiumIds.includes(supplier.id)
        const tier = calculateTier(isVerified, isPremium, distance)

        return {
            ...supplier,
            distance_miles: Math.round(distance),
            transport_carbon_kg: Math.round(transportCarbon),
            embodied_carbon_kg: Math.round(embodiedCarbonBase),
            total_carbon_kg: Math.round(totalCarbon),
            is_verified: isVerified,
            is_premium: isPremium,
            tier,
            match_score: 50, // Default score before AI
        }
    })

    // 3. Pre-sort by Tier (asc) then Distance (asc)
    // This puts the most promising candidates at the top
    candidates.sort((a, b) => {
        if ((a.tier || 4) !== (b.tier || 4)) return (a.tier || 4) - (b.tier || 4)
        return (a.distance_miles || 0) - (b.distance_miles || 0)
    })

    // 4. Batch AI Optimization: Only run expensive AI match scoring on top 10 candidates
    // The rest get the default score (or a simpler heuristic if we implemented one)
    const topCandidates = candidates.slice(0, SUPPLIER_CANDIDATE_LIMIT)
    const remainingCandidates = candidates.slice(SUPPLIER_CANDIDATE_LIMIT)

    let aiTokensUsed = 0

    const scoredTopCandidates = await Promise.all(
        topCandidates.map(async (candidate) => {
            const { score, tokens } = await calculateMatchScore(rfq.materials, candidate.products)
            aiTokensUsed += tokens
            return { ...candidate, match_score: score }
        })
    )

    // Merge back together
    const ranked = [...scoredTopCandidates, ...remainingCandidates]

    // Final Sort: Tier 1->4, then Match Score desc
    ranked.sort((a, b) => {
        if ((a.tier || 4) !== (b.tier || 4)) return (a.tier || 4) - (b.tier || 4)
        return (b.match_score || 0) - (a.match_score || 0)
    })

    // Log AI usage
    const costUsd = (aiTokensUsed / 1000) * 0.03

    await supabase.from('ai_agent_logs').insert({
        user_id: session.user.id,
        rfq_id,
        agent_type: 'architect_find',
        input_data: { materials: rfq.materials, location: rfq.job_site_location },
        output_data: {
            suppliers_processed: candidates.length,
            ai_scored: topCandidates.length,
            tier_breakdown: {
                tier1: ranked.filter(s => s.tier === 1).length,
                tier2: ranked.filter(s => s.tier === 2).length,
                tier3: ranked.filter(s => s.tier === 3).length,
                tier4: ranked.filter(s => s.tier === 4).length,
            }
        },
        model_used: AZURE_DEPLOYMENT_EXPENSIVE,
        tokens_used: aiTokensUsed,
        cost_usd: costUsd,
    })

    // Save carbon calcs (batch insert)
    const carbonRecords = ranked.map(s => ({
        rfq_id,
        supplier_id: s.id,
        distance_miles: s.distance_miles,
        transport_carbon_kg: s.transport_carbon_kg,
        embodied_carbon_kg: s.embodied_carbon_kg,
        total_carbon_kg: s.total_carbon_kg,
        tier: s.tier,
    }))

    if (carbonRecords.length > 0) {
        await supabase.from('rfq_carbon_calc').insert(carbonRecords)
    }

    return NextResponse.json({ suppliers: ranked })
}

// AI match scoring
async function calculateMatchScore(materials: string[], products: { id: string; name: string; category: string; epd_data: unknown }[]) {
    if (!materials || materials.length === 0) return { score: 50, tokens: 0 }

    const client = new OpenAI({
        apiKey: process.env['AZURE_OPENAI_API_KEY'],
        baseURL: process.env['AZURE_OPENAI_ENDPOINT'],
    })

    const prompt = `Materials needed: ${materials.join(', ')}
Products available: ${products.map(p => p.name).join(', ')}

Score 0-100 how well these products match the materials needed.
Return ONLY a JSON object: {"match_score": 85}`

    try {
        const response = await client.chat.completions.create({
            model: AZURE_DEPLOYMENT_EXPENSIVE, // Use constant
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            max_tokens: 50,
        })

        const result = JSON.parse(response.choices[0].message.content!)
        return {
            score: result.match_score || 50,
            tokens: response.usage?.total_tokens || 0
        }
    } catch (error) {
        console.error('AI match score error:', error)
        return { score: 50, tokens: 0 } // Fallback
    }
}
