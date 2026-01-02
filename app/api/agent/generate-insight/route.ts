import { NextRequest, NextResponse } from "next/server";
import { azureOpenAI, isAIEnabled } from "@/lib/azure-openai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { stats } = await req.json();

    if (!isAIEnabled || !azureOpenAI) {
      // Mock fallback if AI is not configured
      return NextResponse.json({
        insight:
          "AI agents are currently offline. Based on your stats, we recommend responding to pending RFQs within 24 hours to improve your win rate.",
      });
    }

    const prompt = `
      You are an AI business analyst for a B2B construction material marketplace.
      Analyze the following supplier stats and provide a single, concise, actionable insight (max 2 sentences) to help them improve their revenue or win rate.

      Stats:
      - Total RFQ Matches: ${stats.totalRfqMatches}
      - Pending Quotes: ${stats.pendingQuotes}
      - Accepted Quotes: ${stats.acceptedQuotes}
      - Profile Completeness: ${stats.profileCompleteness}%
      - Average Response Time: ${stats.averageResponseTime} hours
      - Win Rate: ${stats.winRate}%
      - Monthly Revenue: $${stats.monthlyRevenue}

      Tone: Professional, encouraging, and data-driven.
    `;

    const response = await azureOpenAI.chat.completions.create({
      model: process.env["AZURE_OPENAI_DEPLOYMENT"] || "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant providing business insights for suppliers.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const insight =
      response.choices[0].message.content?.trim() ||
      "Keep your profile updated and respond quickly to new RFQs to maximize your opportunities.";

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("AI Insight Error:", error);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 }
    );
  }
}
