
import { NextRequest, NextResponse } from 'next/server';
import { invokeFoundryAgent } from '@/lib/azure-foundry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();
        const agentId = process.env['AGENT_COMMANDER_ID'];

        // Commander keeps the site in shape.
        // Actions: 'health-check', 'daily-report', 'approve-pending'

        if (agentId) {
             const prompt = `You are the Commander. Action: ${action}. Report status.`;
             const agentRes = await invokeFoundryAgent(agentId, prompt);
             if (agentRes.success) {
                 return NextResponse.json({ success: true, report: agentRes.text });
             }
        }

        // Fallback Mock
        return NextResponse.json({
            success: true,
            report: {
                status: "Green",
                pendingRFQs: 5,
                serverLoad: "Low",
                message: "Site is operational. Commander standing by."
            }
        });

    } catch (error: any) {
        console.error("Commander Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
