import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { invokeFoundryAgent } from '@/lib/azure-foundry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, regulations = ["General Supply Chain Compliance", "Anti-Greenwashing"] } = body;

        if (!text) {
            return NextResponse.json({ error: "Missing 'text' in request body" }, { status: 400 });
        }

        const agentId = process.env['AGENT_LEGAL_GUARDIAN_ID'];
        let analysisResult: any = null;

        // 1. Try Foundry Agent
        if (agentId) {
            try {
                console.log("Invoking Legal Guardian Agent:", agentId);
                const prompt = `Analyze the following supplier text for legal and compliance risks, specifically regarding: ${regulations.join(', ')}.

Text:
"${text.slice(0, 5000)}"

Return ONLY valid JSON with this schema:
{
  "status": "compliant" | "warning" | "non_compliant",
  "score": number (0-100),
  "flags": [
    { "severity": "high"|"medium"|"low", "issue": "string", "description": "string" }
  ],
  "summary": "string"
}`;

                const agentRes = await invokeFoundryAgent(agentId, prompt);

                if (agentRes.success && agentRes.text) {
                    // Clean markdown if present
                    const cleanText = agentRes.text.replace(/```json\n?|\n?```/g, '').trim();
                    analysisResult = JSON.parse(cleanText);
                    analysisResult.provider = 'foundry-agent';
                } else {
                    console.warn("Legal Guardian Agent failed:", agentRes.error);
                }
            } catch (e) {
                console.error("Legal Guardian Agent error:", e);
            }
        }

        // 2. Fallback to Azure OpenAI
        if (!analysisResult && process.env['AZURE_OPENAI_API_KEY']) {
            try {
                const client = new OpenAI({
                    apiKey: process.env['AZURE_OPENAI_API_KEY'],
                    baseURL: process.env['AZURE_OPENAI_ENDPOINT'],
                    defaultQuery: { 'api-version': '2024-02-15-preview' },
                    defaultHeaders: { 'api-key': process.env['AZURE_OPENAI_API_KEY'] }
                });

                const prompt = `You are a strict legal compliance auditor for a B2B sustainable materials marketplace. 
Analyze the text below for risks related to: ${regulations.join(', ')}.

Text:
"${text.slice(0, 3000)}"

Return ONLY valid JSON:
{
  "status": "compliant" | "warning" | "non_compliant",
  "score": number (0-100),
  "flags": [ { "severity": "high"|"medium"|"low", "issue": "string", "description": "string" } ],
  "summary": "string"
}`;

                const aiRes = await client.chat.completions.create({
                    model: process.env['AZURE_OPENAI_DEPLOYMENT_NAME'] || "gpt-35-turbo",
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: 'json_object' },
                    temperature: 0.1
                });

                const content = aiRes.choices[0].message.content;
                if (content) {
                    analysisResult = JSON.parse(content);
                    analysisResult.provider = 'azure-openai';
                }
            } catch (e) {
                console.error("Azure OpenAI Fallback error:", e);
            }
        }

        // 3. Final Fallback (Mock) if everything fails
        if (!analysisResult) {
            analysisResult = {
                status: "warning",
                score: 50,
                flags: [{ severity: "medium", issue: "Analysis Failed", description: "AI providers unavailable." }],
                summary: "Could not perform automated legal analysis.",
                provider: "mock"
            };
        }

        return NextResponse.json({ success: true, analysis: analysisResult });

    } catch (error) {
        console.error("Legal Guardian Route Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
