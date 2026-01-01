import { NextRequest, NextResponse } from "next/server";
import { getAzureOpenAIConfig } from "@/lib/config/azure-openai";
import { AzureOpenAI } from "openai";

export async function POST(req: NextRequest) {
  try {
    const { url, type } = await req.json();

    const config = getAzureOpenAIConfig();
    const azureOpenAI = config ? new AzureOpenAI({
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      apiVersion: config.apiVersion,
      deployment: config.deployment,
    }) : null;

    // Check if configured
    if (!config || !azureOpenAI) {
      return NextResponse.json({
        audit: {
            score: 75,
            details: "Mock audit (AI not configured)",
            recommendations: ["Configure Azure OpenAI credentials to get real audits."]
        }
      });
    }

    const response = await azureOpenAI.chat.completions.create({
      model: config.deployment,
      messages: [
        {
          role: "system",
          content: "You are a sustainability auditor. Analyze the provided URL/content."
        },
        {
          role: "user",
          content: `Audit this ${type}: ${url}`
        }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({
        audit: {
            score: 85, // Mock score from AI content if we parsed it
            details: response.choices[0].message.content,
            recommendations: ["Check certifications", "Verify EPDs"]
        }
    });

  } catch (error) {
    console.error("Audit error:", error);
    return NextResponse.json({ error: "Audit failed" }, { status: 500 });
  }
}
