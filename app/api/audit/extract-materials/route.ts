import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/audit/extract-materials
 * Extract building materials from Revit/model file using Perplexity API
 * 
 * Body: {
 *   fileContent: string,  // Decoded file content or description
 *   fileName: string,
 *   description: string // Building material description
 * }
 * 
 * Returns: {
 *   materials: Array<{
 *     name: string,
 *     quantity: number,
 *     unit: string,
 *     specifications: object,
 *     sustainability_score: number (0-100),
 *     certifications: string[],
 *     estimated_carbon_footprint: string
 *   }>,
 *   summary: string,
 *   audit_score: number (0-100)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { fileContent, fileName, description } = await request.json();

    if (!fileContent && !description) {
      return NextResponse.json(
        { error: 'Provide fileContent (base64) or description of building materials' },
        { status: 400 }
      );
    }

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Build the prompt for Perplexity
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
${description || `File: ${fileName}`}

Respond ONLY with the JSON, nothing else.`;

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/openai/deployments/llm/chat/completions?api-version=2024-02-15-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
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
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Perplexity API error:', error);
      return NextResponse.json(
        { error: 'Perplexity API error', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    let auditResult;
    try {
      // Remove markdown code blocks if present
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
        error: 'Response parsing issue',
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
 * GET /api/audit/extract-materials?fileName=test.rvt
 * Health check + example response
 */
export async function GET(request: NextRequest) {
  const hasKey = !!process.env.PERPLEXITY_API_KEY;
  
  return NextResponse.json({
    service: 'GreenChainZ Material Extraction Audit',
    status: hasKey ? 'active' : 'unconfigured',
    api_configured: hasKey,
    capabilities: [
      'Extract materials from building models',
      'Assess sustainability scores',
      'Identify certifications',
      'Estimate carbon footprint',
      'Recommend alternatives',
    ],
    usage: {
      method: 'POST',
      endpoint: '/api/audit/extract-materials',
      body: {
        description: 'String describing building materials',
        fileContent: 'Base64 encoded file content (future)',
        fileName: 'model.rvt',
      },
    },
    example_response: {
      success: true,
      audit: {
        materials: [
          {
            name: 'FSC Bamboo Flooring',
            quantity: 500,
            unit: 'sq ft',
            specifications: {
              type: 'hardwood flooring',
              grade: 'premium',
              finish: 'matte',
            },
            sustainability_score: 92,
            certifications: ['FSC', 'LEED approved'],
            estimated_carbon_footprint_kg_co2: 750,
            alternatives: ['Recycled wood composite', 'Cork flooring'],
          },
        ],
        summary: 'High-sustainability material profile',
        overall_audit_score: 88,
        recommendations: [
          'Excellent choice for green building',
          'Verify FSC certification with supplier',
        ],
      },
    },
  });
}
