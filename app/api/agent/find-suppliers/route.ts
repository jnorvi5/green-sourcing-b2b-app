import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { calculateDistance, calculateTransportCarbon, calculateTier } from '@/lib/carbon'
import { getEPDData } from '@/lib/autodesk-sda'

interface Product {
  id: string
  name: string
  material_type: string
}

interface Supplier {
  id: string
  company_name: string
  location: string
  lat: number
  lng: number
  verification_status: string
  products: Product[]
}

interface SupplierPlan {
  plan_name: string
}

interface SubscriptionData {
  supplier_id: string
  plan_id: string
  supplier_plans?: SupplierPlan | SupplierPlan[] | null
}

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
        process.env['NEXT_PUBLIC_SUPABASE_URL']! as string,
        process.env['SUPABASE_SERVICE_ROLE_KEY']! as string,
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
    const { data: rfq, error: rfqErr } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfq_id)
        .single()

    if (rfqErr || !rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })

    // Get all suppliers
    const { data: suppliers } = await supabase
        .from('suppliers')
        .select(`
      id, company_name, location, lat, lng, verification_status,
      products (id, name, material_type)
    `)

    if (!suppliers) return NextResponse.json({ suppliers: [] })

    // Get premium supplier IDs
    const { data: subscriptions } = await supabase
        .from('supplier_subscriptions')
        .select('supplier_id, plan_id, supplier_plans:plan_id(plan_name)')
        .eq('status', 'active')

    const premiumIds = (subscriptions || [])
        .filter((s: SubscriptionData) => {
            const planName = Array.isArray(s.supplier_plans) 
                ? s.supplier_plans[0]?.plan_name 
                : s.supplier_plans?.plan_name
            return ['Basic', 'Enterprise', 'Premium'].includes(planName || '')
        })
        .map((s: SubscriptionData) => s.supplier_id)

    // Calculate distance, carbon, tier for each supplier
    const ranked = await Promise.all(
        suppliers.map(async (supplier: Supplier) => {
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

            const isPremium = premiumIds.includes(supplier.id)
            const tier = calculateTier(
                supplier.verification_status as 'verified' | 'unverified', 
                isPremium, 
                distance
            )

            // Match score (AI-based)
            const matchScore = await calculateMatchScore(rfq.materials || [], supplier.products || [])

            return {
                ...supplier,
                distance_miles: Math.round(distance),
                transport_carbon_kg: Math.round(transportCarbon),
                embodied_carbon_kg: Math.round(embodiedCarbon),
                total_carbon_kg: Math.round(totalCarbon),
                is_premium: isPremium,
                tier,
                match_score: matchScore,
            }
        })
    )

    // Sort: Tier 1 → Tier 2 → Tier 3 → Tier 4, then by match score
    ranked.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier
        return b.match_score - a.match_score
    })

    // Log AI usage
    await supabase.from('ai_agent_logs').insert({
        user_id: session.user.id,
        rfq_id,
        agent_type: 'architect_find',
        input_data: { materials: rfq.materials, location: rfq.job_site_location },
        output_data: { suppliers_found: ranked.length, tiers: { 1: ranked.filter(s => s.tier === 1).length } },
        model_used: 'gpt-4o',
    })

    // Save/Update carbon calcs in DB
    for (const s of ranked) {
        await supabase.from('rfq_carbon_calc').upsert({
            rfq_id,
            supplier_id: s.id,
            distance_miles: s.distance_miles,
            transport_carbon_kg: s.transport_carbon_kg,
            embodied_carbon_kg: s.embodied_carbon_kg,
            total_carbon_kg: s.total_carbon_kg,
            tier: s.tier,
        }, { onConflict: 'rfq_id,supplier_id' })
    }

    return NextResponse.json({ suppliers: ranked })
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import {
  calculateDistance,
  calculateTransportCarbon,
  calculateTier,
} from "@/lib/carbon";
import { getEPDData } from "@/lib/autodesk-sda";

interface Product {
  id: string;
  name: string;
  material_type: string;
}

interface Supplier {
  id: string;
  company_name: string;
  location: string;
  lat: number;
  lng: number;
  verification_status: string;
  products: Product[];
}

interface SupplierPlan {
  plan_name: string;
}

interface SubscriptionData {
  supplier_id: string;
  plan_id: string;
  supplier_plans?: SupplierPlan | SupplierPlan[] | null;
}

// Lazy initialization of OpenAI client to avoid build-time errors
let client: OpenAI | null = null;

function getOpenAIClient() {
  if (!client) {
    const apiKey = process.env["AZURE_OPENAI_API_KEY"];
    const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
    const deploymentName = process.env["AZURE_OPENAI_DEPLOYMENT_NAME"];

    if (!apiKey || !endpoint || !deploymentName) {
      throw new Error(
        "Azure OpenAI configuration is missing. Please set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT_NAME environment variables."
      );
    }

    client = new OpenAI({
      apiKey: apiKey,
      baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
      defaultQuery: { "api-version": "2024-02-15-preview" },
      defaultHeaders: { "api-key": apiKey },
    });
  }
  return client;
}

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]! as string,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]! as string,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { rfq_id } = body;

  // Get RFQ
  const { data: rfq, error: rfqErr } = await supabase
    .from("rfqs")
    .select("*")
    .eq("id", rfq_id)
    .single();

  if (rfqErr || !rfq)
    return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

  // Get all suppliers
  const { data: suppliers } = await supabase.from("suppliers").select(`
      id, company_name, location, lat, lng, verification_status,
      products (id, name, material_type)
    `);

  if (!suppliers) return NextResponse.json({ suppliers: [] });

  // Get premium supplier IDs
  const { data: subscriptions } = await supabase
    .from("supplier_subscriptions")
    .select("supplier_id, plan_id, supplier_plans:plan_id(plan_name)")
    .eq("status", "active");

  const premiumIds = (subscriptions || [])
    .filter((s: SubscriptionData) => {
      const planName = Array.isArray(s.supplier_plans)
        ? s.supplier_plans[0]?.plan_name
        : s.supplier_plans?.plan_name;
      return ["Basic", "Enterprise", "Premium"].includes(planName || "");
    })
    .map((s: SubscriptionData) => s.supplier_id);

  // Calculate distance, carbon, tier for each supplier
  const ranked = await Promise.all(
    suppliers.map(async (supplier: Supplier) => {
      const distance = calculateDistance(
        rfq.job_site_lat,
        rfq.job_site_lng,
        supplier.lat,
        supplier.lng
      );

      // Get embodied carbon from EPD
      const epdData = await getEPDData(rfq.materials?.[0] || "steel");
      const embodiedCarbon =
        epdData.embodied_carbon_kg * (rfq.material_weight_tons || 1);
      const transportCarbon = calculateTransportCarbon(
        distance,
        rfq.material_weight_tons || 1
      );
      const totalCarbon = embodiedCarbon + transportCarbon;

      const isPremium = premiumIds.includes(supplier.id);
      const tier = calculateTier(
        supplier.verification_status as "verified" | "unverified",
        isPremium,
        distance
      );

      // Match score (AI-based)
      const matchScore = await calculateMatchScore(
        rfq.materials || [],
        supplier.products || []
      );

      return {
        ...supplier,
        distance_miles: Math.round(distance),
        transport_carbon_kg: Math.round(transportCarbon),
        embodied_carbon_kg: Math.round(embodiedCarbon),
        total_carbon_kg: Math.round(totalCarbon),
        is_premium: isPremium,
        tier,
        match_score: matchScore,
      };
    })
  );

  // Sort: Tier 1 → Tier 2 → Tier 3 → Tier 4, then by match score
  ranked.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.match_score - a.match_score;
  });

  // Log AI usage
  await supabase.from("ai_agent_logs").insert({
    user_id: session.user.id,
    rfq_id,
    agent_type: "architect_find",
    input_data: { materials: rfq.materials, location: rfq.job_site_location },
    output_data: {
      suppliers_found: ranked.length,
      tiers: { 1: ranked.filter((s) => s.tier === 1).length },
    },
    model_used: "gpt-4o",
  });

  // Save/Update carbon calcs in DB
  for (const s of ranked) {
    await supabase.from("rfq_carbon_calc").upsert(
      {
        rfq_id,
        supplier_id: s.id,
        distance_miles: s.distance_miles,
        transport_carbon_kg: s.transport_carbon_kg,
        embodied_carbon_kg: s.embodied_carbon_kg,
        total_carbon_kg: s.total_carbon_kg,
        tier: s.tier,
      },
      { onConflict: "rfq_id,supplier_id" }
    );
  }

  return NextResponse.json({ suppliers: ranked });
}

// AI match scoring
async function calculateMatchScore(materials: string[], products: Product[]) {
    if (materials.length === 0 || products.length === 0) return 30;

    const prompt = `Materials needed: ${materials.join(', ')}
Products available: ${products.map(p => p.name).join(', ')}
Evaluate similarity and return JSON only: {"match_score": 0-100}`

    try {
        const response = await client.chat.completions.create({
            model: deploymentName!,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        })

        const result = JSON.parse(response.choices[0].message.content!)
        return result.match_score
    } catch (e) {
        console.error('Match score AI error:', e);
        return 50;
    }
  if (materials.length === 0 || products.length === 0) return 30;

  const prompt = `Materials needed: ${materials.join(", ")}
Products available: ${products.map((p) => p.name).join(", ")}
Evaluate similarity and return JSON only: {"match_score": 0-100}`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: process.env["AZURE_OPENAI_DEPLOYMENT_NAME"]!,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result.match_score || 50;
  } catch (e) {
    console.error("Match score AI error:", e);
    return 50;
  }
}
