import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { supplierId, epdDocument } = await req.json();

    try {
        const response = await fetch(process.env['AGENT_AUDITOR_URL']!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: `Analyze this EPD in JSON format: ${JSON.stringify({ supplier_name: supplierId, epd_document: epdDocument })}`
            }),
        });

        const auditData = await response.json();
        return NextResponse.json(auditData);
    } catch (error: unknown) {
        const err = error as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
