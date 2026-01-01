
import { NextRequest, NextResponse } from 'next/server';
import { invokeFoundryAgent } from '@/lib/azure-foundry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { query, materialType } = await request.json();
        const agentId = process.env['AGENT_RFQ_RESEARCHER_ID'];

        // If we have a specific AI agent for this
        if (agentId) {
            const prompt = `Research market data for: ${query} (${materialType}). Focus on price benchmarks and availability.`;
            const agentRes = await invokeFoundryAgent(agentId, prompt);
            if (agentRes.success) {
                return NextResponse.json({ success: true, data: agentRes.text });
            }
        }

        // Fallback: Use the Data Scout logic (internal redirect or logic reuse)
        // For simplicity, we'll return a mock or suggest using Data Scout
        return NextResponse.json({
            success: true,
            data: {
                summary: `Research for ${query}`,
                priceRange: "$50 - $80 per unit",
                availability: "High",
                suppliers: ["EcoSteel", "GreenConcrete Co"],
                note: "Using fallback data. Configure AGENT_RFQ_RESEARCHER_ID."
            }
        });

    } catch (error: any) {
        console.error("RFQ Researcher Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
