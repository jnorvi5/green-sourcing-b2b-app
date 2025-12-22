import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { materialName, specifications, targetCertifications } = await req.json();

    try {
        const response = await fetch(process.env.AGENT_COMPLIANCE_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Validate this material in JSON format: ${JSON.stringify({
                    materialName,
                    specifications,
                    targetCertifications,
                })}`
            }),
        });

        const compliance = await response.json();
        return NextResponse.json(compliance);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
