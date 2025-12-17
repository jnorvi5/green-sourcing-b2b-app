import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/audit/extract-materials
 * Extract building materials from Revit/model file
 * 
 * Body: {
 *   fileUrl: string,  // URL of .rvt file or file upload
 *   fileName: string,
 *   fileContent: string (base64) // Optional: direct file content
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

    // Mock file parsing - in production, parse actual Revit/IFC format
    // For MVP: Accept description or base64 file, extract via Claude
    const prompt = `You are a sustainability expert analyzing building material specifications.

Analyze the following building material data and extract:
1. List of all materials with quantities and units
2. Sustainability scores (0-100, where 100 is most sustainable)
3. Environmental certifications (FSC, LEED, EPD, ISO 14001, etc.)
4. Estimated carbon footprint per unit

Build a JSON response with this structure:
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

Material Data:
${description || `File: ${fileName}`}

Extract and analyze now:`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse Claude's response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let auditResult;

    if (jsonMatch) {
      try {
        auditResult = JSON.parse(jsonMatch[0]);
      } catch (e) {
        auditResult = {
          materials: [],
          summary: responseText,
          overall_audit_score: 0,
          error: 'Could not parse detailed response',
        };
      }
    } else {
      auditResult = {
        materials: [],
        summary: responseText,
        overall_audit_score: 0,
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
  return NextResponse.json({
    service: 'GreenChainZ Material Extraction Audit',
    status: 'active',
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
        description:
          'String describing building materials (for MVP testing)',
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
