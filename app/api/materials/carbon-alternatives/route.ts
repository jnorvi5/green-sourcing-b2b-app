import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { currentMaterial, carbonFootprint, budget, constraints } = await req.json();

    try {
        const response = await fetch(process.env.AGENT_CARBON_OPTIMIZER_URL!, {
        const response = await fetch(process.env['AGENT_CARBON_OPTIMIZER_URL']!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Find alternatives for this material in JSON format: ${JSON.stringify({
                    currentMaterial,
                    epd: carbonFootprint,
                    budget,
                    constraints,
                })}`
            }),
        });

        const alternatives = await response.json();
        return NextResponse.json(alternatives);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
