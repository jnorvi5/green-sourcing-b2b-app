import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { supplierId, epdDocument, materialSpecs, budget } = await req.json();

    try {
        // 1. AUDITOR
        const auditRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/suppliers/audit-epd`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ supplierId, epdDocument }),
        });
        const audit = await auditRes.json();

        // 2. COMPLIANCE
        const complianceRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/materials/compliance-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                materialName: epdDocument.product_name,
                specifications: { ...materialSpecs, certifications: audit.certifications || [] },
                targetCertifications: ["LEED_v4_1", "BREEAM_2018", "IBC_2024"],
            }),
        });
        const compliance = await complianceRes.json();

        // 3. CARBON
        const carbonRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/materials/carbon-alternatives`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currentMaterial: epdDocument.product_name,
                carbonFootprint: { a1a2a3_kg_co2e: audit.carbon_footprint?.value || 0 },
                budget,
                constraints: ["LEED eligible"],
            }),
        });
        const carbon = await carbonRes.json();

        // 4. PRICING
        const pricingRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/suppliers/pricing-recommendation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                materialName: epdDocument.product_name,
                baseCost: 180,
                demandSignals: { rfqsInPast30Days: 127 },
                competitorPrices: { low: 170, avg: 195, high: 220 },
            }),
        });
        const pricing = await pricingRes.json();

        // RETURN COMBINED
        return NextResponse.json({
            supplier: { id: supplierId },
            analysis: {
                epd_audit: audit,
                compliance: compliance,
                carbon_optimization: carbon,
                pricing: pricing,
            },
            status: "complete",
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
