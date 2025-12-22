import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { materialName, baseCost, demandSignals, competitorPrices } = await req.json();

    try {
        const response = await fetch(process.env.AGENT_PRICING_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Suggest pricing for this material in JSON format: ${JSON.stringify({
                    material: { name: materialName, baseCost },
                    marketData: { ...demandSignals, ...competitorPrices },
                })}`
            }),
        });

        const pricing = await response.json();
        return NextResponse.json(pricing);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
