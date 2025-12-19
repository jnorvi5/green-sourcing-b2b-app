import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from '@azure/openai';

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: '2024-08-01-preview',
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
});

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/audit/extract-materials
 * Extract building materials from Revit/model file using Azure OpenAI
 * Powered by your founder's credits (FREE)
 * 
 * Body: {
 *   description: string // Building material description
 * }
 * 
 * Returns: {
 *   materials: Array<Material>,
 *   summary: string,
 *   audit_score: number (0-100)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Provide description of building materials' },
        { status: 400 }
      );
    }

    // Check env vars
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
      return NextResponse.json(
        { error: 'Azure OpenAI not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a sustainability expert analyzing building material specifications.

Analyze the following building material data and extract:
1. List of all materials with quantities and units
2. Sustainability scores (0-100, where 100 is most sustainable)
3. Environmental certifications (FSC, LEED, EPD, ISO 14001, etc.)
4. Estimated carbon footprint per unit
5. Alternative sustainable materials

Respond ONLY with valid JSON in this structure (no markdown, no extra text):
{
  "materials": [
    {
      "name": "Material name",
      "quantity": 500,
      "unit": "sq ft" or "kg" or "units",
      "specifications": {
        "type": "e.g., hardwood flooring",
        "grade": "e.g., premium",
        "finish": "e.g., matte"
      },
      "sustainability_score": 85,
      "certifications": ["FSC", "LEED approved"],
      "estimated_carbon_footprint_kg_co2": 1500,
      "alternatives": ["Bamboo flooring", "Recycled composite"]
    }
  ],
  "summary": "Overall assessment of material sustainability",
  "overall_audit_score": 75,
  "recommendations": ["Use more recycled content", "Source from certified suppliers"]
}

Material Data to Analyze:
${description}

Respond ONLY with the JSON, nothing else.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a sustainability expert. Respond ONLY with valid JSON, no markdown or extra text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const responseText = response.choices[0]?.message?.content || '';

    // Parse JSON response
    let auditResult;
    try {
      const cleanedText = responseText
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
      auditResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', responseText);
      auditResult = {
        materials: [],
        summary: responseText,
        overall_audit_score: 0,
        recommendations: ['Could not parse detailed analysis'],
      };
    }

    return NextResponse.json(
      {
        success: true,
        audit: auditResult,
        timestamp: new Date().toISOString(),
        next_steps: [
          'Review material sustainability scores',
          'Click on each material to find verified suppliers',
          'Compare pricing and certifications across suppliers',
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Audit extraction error:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract materials',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/audit/extract-materials
 * Health check + example response
 */
export async function GET(request: NextRequest) {
  const configured =
    !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;

  return NextResponse.json({
    service: 'GreenChainZ Material Extraction Audit',
    provider: 'Azure OpenAI (Founder Credits)',
    status: configured ? 'active' : 'unconfigured',
    cost: 'FREE (using your Microsoft Founder credits)',
    capabilities: [
      'Extract materials from building models',
      'Assess sustainability scores',
      'Identify certifications',
      'Estimate carbon footprint',
      'Recommend alternatives',
    ],
    example_response: {
      success: true,
      audit: {
        materials: [
          {
            name: 'FSC Bamboo Flooring',
            quantity: 500,
            unit: 'sq ft',
            specifications: { type: 'hardwood', grade: 'premium' },
            sustainability_score: 92,
            certifications: ['FSC', 'LEED approved'],
            estimated_carbon_footprint_kg_co2: 750,
          },
        ],
        summary: 'High-sustainability material profile',
        overall_audit_score: 88,
      },
    },
  });
}
