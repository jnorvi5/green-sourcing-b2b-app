import { NextRequest, NextResponse } from "next/server";
import { azureOpenAI, isAIEnabled } from "@/lib/azure-openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productData, standards = ["ISO14040", "EN15804"] } = body;

    if (!isAIEnabled || !azureOpenAI) {
      return NextResponse.json({
        message: "AI Audit Agent is currently using mock data (Azure Credentials missing).",
        auditResult: {
            compliance_score: 85,
            flags: ["Mock: Missing EPD verification source"],
            suggestions: ["Upload valid ISO14025 PDF"]
        }
      });
    }

    const systemPrompt = `You are an expert Sustainability Audit Agent. 
    Analyze the provided product data against the following standards: ${standards.join(", ")}.
    Output JSON with: compliance_score (0-100), flags (array of strings), suggestions (array of strings).`;

    const completion = await azureOpenAI.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(productData) }
      ],
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    const result = content ? JSON.parse(content) : {};

    return NextResponse.json(result);

  } catch (error) {
    console.error("AI Audit Error:", error);
    return NextResponse.json({ error: "Failed to process audit" }, { status: 500 });
  }
}
