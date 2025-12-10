/**
 * Carbon Alternatives API
 * 
 * Returns low-carbon swap recommendations for materials
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import CarbonAlternative from '../../../../models/CarbonAlternative';

const MONGODB_URI = process.env['MONGODB_URI'] || '';

async function connectDB() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI);
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        // Query parameters
        const category = searchParams.get('category');
        const minReduction = searchParams.get('minReduction');
        const availability = searchParams.get('availability');
        const compatibility = searchParams.get('compatibility');

        // Build query
        const query: Record<string, unknown> = { isActive: true };

        if (category) {
            query['originalMaterial.category'] = { $regex: category, $options: 'i' };
        }

        // Execute query
        let results = await CarbonAlternative.find(query)
            .sort({ 'originalMaterial.category': 1 })
            .lean();

        // Post-filter alternatives if needed
        if (minReduction || availability || compatibility) {
            results = results.map(result => {
                let filteredAlts = result.alternatives;

                if (minReduction) {
                    filteredAlts = filteredAlts.filter(
                        (alt: { reduction?: number }) => (alt.reduction || 0) >= parseFloat(minReduction)
                    );
                }

                if (availability) {
                    filteredAlts = filteredAlts.filter(
                        (alt: { availability?: string }) => alt.availability === availability
                    );
                }

                if (compatibility) {
                    filteredAlts = filteredAlts.filter(
                        (alt: { compatibility?: string }) => alt.compatibility === compatibility
                    );
                }

                return { ...result, alternatives: filteredAlts };
            }).filter(result => result.alternatives.length > 0);
        }

        return NextResponse.json({
            success: true,
            data: results,
            meta: {
                total: results.length,
                source: 'cached',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Carbon Alternatives API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch carbon alternatives' },
            { status: 500 }
        );
    }
}

// Find alternatives for a specific material
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        interface AlternativesBody {
            category: string;
            materialName?: string;
            currentGwp?: number;
            targetReduction?: number;
        }

        const body = await request.json() as AlternativesBody;
        const { category, materialName, currentGwp, targetReduction } = body;

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'category required' },
                { status: 400 }
            );
        }

        // Find alternatives for the category
        const result = await CarbonAlternative.findOne({
            'originalMaterial.category': { $regex: category, $options: 'i' },
            isActive: true,
        }).lean();

        if (!result) {
            return NextResponse.json({
                success: true,
                data: null,
                message: `No alternatives found for category: ${category}`,
            });
        }

        // Filter by target reduction if specified
        let alternatives: any[] = result.alternatives;
        if (targetReduction) {
            alternatives = alternatives.filter(
                (alt: { reduction?: number }) => (alt.reduction || 0) >= targetReduction
            );
        }

        // Calculate actual savings if currentGwp provided
        if (currentGwp) {
            alternatives = alternatives.map((alt: { gwp?: number; unit?: string }) => ({
                ...alt,
                actualSavings: currentGwp - (alt.gwp || 0),
                actualSavingsPercent: Math.round(((currentGwp - (alt.gwp || 0)) / currentGwp) * 100),
            }));
        }

        return NextResponse.json({
            success: true,
            data: {
                originalMaterial: {
                    ...result.originalMaterial,
                    providedName: materialName,
                    providedGwp: currentGwp,
                },
                alternatives,
                applications: result.applications,
                dataQuality: result.dataQuality,
            },
            meta: {
                source: 'cached',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Carbon Alternatives POST Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to find alternatives' },
            { status: 500 }
        );
    }
}
