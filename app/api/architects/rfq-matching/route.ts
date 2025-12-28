import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { architectId, projectLocation, materialsNeeded, budget, radius } = await req.json();

    try {
        const response = await fetch(process.env['AGENT_RFQ_MATCHING_URL']!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Analyze this RFQ in JSON format: ${JSON.stringify({
                    architectId,
                    projectLocation,
                    materialsNeeded,
                    budget,
                    searchRadiusMiles: radius,
                })}`
            }),
        });

        const results = await response.json();
        return NextResponse.json(results);
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
