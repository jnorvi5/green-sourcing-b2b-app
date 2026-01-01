
import { NextRequest, NextResponse } from 'next/server';
import { invokeFoundryAgent } from '@/lib/azure-foundry';
import { AGENT_REGISTRY } from '@/lib/agents-registry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { goal, context } = await request.json();
        const agentId = process.env['AGENT_ORCHESTRATOR_ID'];

        if (!goal) {
            return NextResponse.json({ error: "Missing 'goal'" }, { status: 400 });
        }

        // 1. Try Azure Foundry Agent
        if (agentId) {
            const registryInfo = Object.entries(AGENT_REGISTRY).map(([key, val]) => `${key}: ${val.description}`).join('\n');

            const prompt = `You are the Orchestrator for GreenChainz.
Your goal: "${goal}"
Context: "${context || ''}"

Available Agents:
${registryInfo}

Decide which agent(s) to call to fulfill the goal.
Return JSON plan: { "steps": [ { "agent": "agent-name", "instruction": "..." } ] }`;

            const agentRes = await invokeFoundryAgent(agentId, prompt);

            if (agentRes.success && agentRes.text) {
                 // In a real implementation, we might parse this and actually invoke the other agents here.
                 // For now, we return the plan.
                 return NextResponse.json({ success: true, plan: agentRes.text });
            }
        }

        // 2. Fallback (Mock)
        return NextResponse.json({
            success: true,
            plan: {
                steps: [
                    { agent: "rfq-researcher", instruction: "Research materials matching requirements." },
                    { agent: "legal-guardian", instruction: "Verify compliance of found materials." }
                ],
                note: "Orchestrator mocked response (Configure AGENT_ORCHESTRATOR_ID to enable AI)"
            }
        });

    } catch (error: any) {
        console.error("Orchestrator Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
