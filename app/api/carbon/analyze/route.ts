import { NextRequest, NextResponse } from 'next/server';
import { carbonCalculatorService } from '../../../../lib/carbonCalculatorService';

interface MaterialInput {
    name: string;
    gwp: number;
    unit: string;
    quantity: number;
    alternativeGwp?: number;
}

interface AnalyzeRequestBody {
    userId?: string;
    name?: string;
    description?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
    buildingType?: string;
    squareFootage?: number;
    materials: MaterialInput[];
}

// POST /api/carbon/analyze - Analyze carbon footprint of materials
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as AnalyzeRequestBody;
        const {
            userId,
            name,
            description,
            location,
            buildingType,
            squareFootage,
            materials,
        } = body;

        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            return NextResponse.json(
                { error: 'Materials array is required' },
                { status: 400 }
            );
        }

        // Validate materials
        for (const mat of materials) {
            if (!mat.name || mat.gwp === undefined || !mat.unit || mat.quantity === undefined) {
                return NextResponse.json(
                    { error: 'Each material must have name, gwp, unit, and quantity' },
                    { status: 400 }
                );
            }
        }

        const analysis = await carbonCalculatorService.analyzeProject({
            userId: userId || 'anonymous',
            name: name || 'Untitled Project',
            description,
            location,
            buildingType,
            squareFootage,
            materials,
        });

        // Get carbon equivalents for visualization
        const equivalents = carbonCalculatorService.getEquivalents(analysis.summary.totalCarbon);
        const savingsEquivalents = carbonCalculatorService.getEquivalents(analysis.summary.carbonSaved);

        // Get reduction tips
        const tips = carbonCalculatorService.getReductionTips(analysis.materials);

        return NextResponse.json({
            success: true,
            data: {
                ...analysis,
                equivalents,
                savingsEquivalents,
                tips,
            },
        });
    } catch (error) {
        console.error('Error analyzing carbon:', error);
        return NextResponse.json(
            { error: 'Failed to analyze carbon footprint' },
            { status: 500 }
        );
    }
}

// GET /api/carbon/benchmarks - Get industry benchmarks
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const buildingType = searchParams.get('buildingType') || 'default';

        const benchmarks: Record<string, { average: number; bestInClass: number; unit: string }> = {
            office: { average: 35, bestInClass: 18, unit: 'kg CO2e/sqft' },
            residential: { average: 28, bestInClass: 14, unit: 'kg CO2e/sqft' },
            retail: { average: 32, bestInClass: 16, unit: 'kg CO2e/sqft' },
            healthcare: { average: 45, bestInClass: 25, unit: 'kg CO2e/sqft' },
            education: { average: 30, bestInClass: 15, unit: 'kg CO2e/sqft' },
            industrial: { average: 40, bestInClass: 22, unit: 'kg CO2e/sqft' },
            hospitality: { average: 38, bestInClass: 20, unit: 'kg CO2e/sqft' },
        };

        if (buildingType && buildingType !== 'all') {
            const data = benchmarks[buildingType.toLowerCase()] || benchmarks['office'];
            return NextResponse.json({
                success: true,
                data: {
                    buildingType,
                    ...data,
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: benchmarks,
        });
    } catch (error) {
        console.error('Error fetching benchmarks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch benchmarks' },
            { status: 500 }
        );
    }
}
