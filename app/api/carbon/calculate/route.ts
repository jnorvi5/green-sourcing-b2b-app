/**
 * Carbon Calculator API
 * 
 * Comprehensive carbon footprint calculator that uses all cached data
 * to compute embodied carbon without external API calls
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Material from '../../../../models/Material';
import CarbonFactor from '../../../../models/CarbonFactor';
import UnitConversion from '../../../../models/UnitConversion';
import CarbonAlternative from '../../../../models/CarbonAlternative';

const MONGODB_URI = process.env.MONGODB_URI || '';

async function connectDB() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI);
    }
}

interface MaterialInput {
    materialId?: string;
    category?: string;
    name?: string;
    quantity: number;
    unit: string;
    transportMode?: string;
    transportDistanceKm?: number;
}

interface CalculationResult {
    material: {
        id: string;
        name: string;
        category: string;
    };
    input: {
        quantity: number;
        unit: string;
        convertedQuantity?: number;
        convertedUnit?: string;
    };
    embodiedCarbon: {
        a1a3: number;
        a4: number;
        a5: number;
        total: number;
        unit: string;
    };
    transport?: {
        mode: string;
        distanceKm: number;
        emissions: number;
        unit: string;
    };
    benchmarks?: {
        percentile: number;
        vsIndustryAvg: number;
        vsBestInClass: number;
    };
    alternatives?: Array<{
        name: string;
        gwp: number;
        reduction: number;
        potentialSavings: number;
    }>;
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        interface CalculatorBody {
            materials: MaterialInput[];
            region?: string;
            country?: string;
            includeAlternatives?: boolean;
            includeBenchmarks?: boolean;
        }

        const body = await request.json() as CalculatorBody;
        const {
            materials,
            region = 'North America',
            country = 'US',
            includeAlternatives = true,
            includeBenchmarks = true,
        } = body;

        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            return NextResponse.json(
                { success: false, error: 'materials array required' },
                { status: 400 }
            );
        }

        // Load all needed data in parallel
        const [materialDocs, factorDocs, conversionDocs, alternativeDocs] = await Promise.all([
            Material.find({ isActive: true }).lean(),
            CarbonFactor.find({ isActive: true }).lean(),
            UnitConversion.find({}).lean(),
            includeAlternatives ? CarbonAlternative.find({ isActive: true }).lean() : [],
        ]);

        // Create lookup maps
        const materialMap = new Map(materialDocs.map(m => [m.materialId, m]));
        const categoryMap = new Map<string, typeof materialDocs[0]>();
        materialDocs.forEach(m => {
            if (!categoryMap.has(m.category.toLowerCase())) {
                categoryMap.set(m.category.toLowerCase(), m);
            }
        });

        // Get transport factor
        const transportFactors = new Map(
            factorDocs
                .filter(f => f.type === 'transport')
                .map(f => [f.factorId.replace('transport-', ''), f.factor])
        );

        const results: CalculationResult[] = [];
        let totalEmbodiedCarbon = 0;
        let totalTransportCarbon = 0;

        for (const input of materials) {
            // Find material
            let material = input.materialId
                ? materialMap.get(input.materialId)
                : input.category
                    ? categoryMap.get(input.category.toLowerCase())
                    : null;

            // Search by name if not found
            if (!material && input.name) {
                material = materialDocs.find(m =>
                    m.name.toLowerCase().includes(input.name!.toLowerCase()) ||
                    input.name!.toLowerCase().includes(m.name.toLowerCase())
                );
            }

            if (!material) {
                results.push({
                    material: {
                        id: input.materialId || 'unknown',
                        name: input.name || input.category || 'Unknown',
                        category: input.category || 'Unknown',
                    },
                    input: {
                        quantity: input.quantity,
                        unit: input.unit,
                    },
                    embodiedCarbon: {
                        a1a3: 0,
                        a4: 0,
                        a5: 0,
                        total: 0,
                        unit: 'kg CO2e',
                    },
                });
                continue;
            }

            // Convert units if needed
            let quantity = input.quantity;
            let unit = input.unit;
            const materialUnit = material.gwpUnit.split('/')[1]?.trim() || 'kg';

            if (unit.toLowerCase() !== materialUnit.toLowerCase()) {
                // Find conversion
                const conversionDoc = conversionDocs.find(c =>
                    c.materialCategory.toLowerCase() === material!.category.toLowerCase()
                );

                if (conversionDoc) {
                    interface ConversionEntry {
                        fromUnit: string;
                        toUnit: string;
                        factor: number;
                    }
                    const conv = conversionDoc.conversions.find(
                        (c: ConversionEntry) => c.fromUnit.toLowerCase() === unit.toLowerCase() &&
                            c.toUnit.toLowerCase() === materialUnit.toLowerCase()
                    );
                    if (conv) {
                        quantity = input.quantity * conv.factor;
                        unit = materialUnit;
                    }
                }
            }

            // Calculate embodied carbon
            const stages = material.lifecycleStages || { a1a3: material.gwp };
            const a1a3 = (stages.a1a3 || material.gwp) * quantity;
            const a4 = (stages.a4 || 0) * quantity;
            const a5 = (stages.a5 || 0) * quantity;
            const embodiedTotal = a1a3 + a4 + a5;

            totalEmbodiedCarbon += embodiedTotal;

            // Calculate transport emissions
            let transportEmissions: CalculationResult['transport'];
            if (input.transportMode && input.transportDistanceKm) {
                const transportFactor = transportFactors.get(input.transportMode.toLowerCase()) || 0.105; // default to truck
                const weight = material.density
                    ? (quantity / (unit === 'kg' ? 1 : material.density)) * material.density / 1000
                    : quantity / 1000; // assume kg if no density

                const emissions = transportFactor * input.transportDistanceKm * weight;
                totalTransportCarbon += emissions;

                transportEmissions = {
                    mode: input.transportMode,
                    distanceKm: input.transportDistanceKm,
                    emissions: Math.round(emissions * 100) / 100,
                    unit: 'kg CO2e',
                };
            }

            // Get benchmarks
            let benchmarks: CalculationResult['benchmarks'];
            if (includeBenchmarks && material.benchmarks) {
                const b = material.benchmarks;
                benchmarks = {
                    percentile: b.percentile,
                    vsIndustryAvg: Math.round(((material.gwp - b.industryAvg) / b.industryAvg) * 100),
                    vsBestInClass: Math.round(((material.gwp - b.bestInClass) / b.bestInClass) * 100),
                };
            }

            // Get alternatives
            let alternatives: CalculationResult['alternatives'];
            if (includeAlternatives) {
                const altDoc = alternativeDocs.find(a =>
                    a.originalMaterial.category.toLowerCase() === material!.category.toLowerCase()
                );
                if (altDoc) {
                    interface AlternativeEntry {
                        name: string;
                        gwp: number;
                        reduction: number;
                    }
                    alternatives = altDoc.alternatives.slice(0, 3).map((alt: AlternativeEntry) => ({
                        name: alt.name,
                        gwp: alt.gwp,
                        reduction: alt.reduction,
                        potentialSavings: Math.round((material!.gwp - alt.gwp) * quantity * 100) / 100,
                    }));
                }
            }

            results.push({
                material: {
                    id: material.materialId,
                    name: material.name,
                    category: material.category,
                },
                input: {
                    quantity: input.quantity,
                    unit: input.unit,
                    convertedQuantity: quantity !== input.quantity ? quantity : undefined,
                    convertedUnit: quantity !== input.quantity ? unit : undefined,
                },
                embodiedCarbon: {
                    a1a3: Math.round(a1a3 * 100) / 100,
                    a4: Math.round(a4 * 100) / 100,
                    a5: Math.round(a5 * 100) / 100,
                    total: Math.round(embodiedTotal * 100) / 100,
                    unit: 'kg CO2e',
                },
                transport: transportEmissions,
                benchmarks,
                alternatives,
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                materials: results,
                summary: {
                    totalEmbodiedCarbon: Math.round(totalEmbodiedCarbon * 100) / 100,
                    totalTransportCarbon: Math.round(totalTransportCarbon * 100) / 100,
                    totalCarbon: Math.round((totalEmbodiedCarbon + totalTransportCarbon) * 100) / 100,
                    unit: 'kg CO2e',
                    materialCount: results.length,
                },
                region,
                country,
            },
            meta: {
                source: 'cached',
                dataVersion: '1.0.0',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Carbon Calculator API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate carbon footprint' },
            { status: 500 }
        );
    }
}

// GET endpoint for API documentation
export async function GET() {
    return NextResponse.json({
        success: true,
        api: 'Carbon Calculator',
        version: '1.0.0',
        description: 'Calculate embodied carbon footprint using cached material data',
        endpoints: {
            'POST /api/carbon/calculate': {
                description: 'Calculate carbon footprint for a list of materials',
                body: {
                    materials: [
                        {
                            materialId: 'string (optional) - Specific material ID',
                            category: 'string (optional) - Material category (e.g., Concrete, Steel)',
                            name: 'string (optional) - Material name for search',
                            quantity: 'number (required) - Amount of material',
                            unit: 'string (required) - Unit (kg, m³, m², etc.)',
                            transportMode: 'string (optional) - truck, rail, ship, air',
                            transportDistanceKm: 'number (optional) - Distance in km',
                        },
                    ],
                    region: 'string (optional) - Region for carbon factors',
                    country: 'string (optional) - Country code',
                    includeAlternatives: 'boolean (optional, default: true)',
                    includeBenchmarks: 'boolean (optional, default: true)',
                },
                response: {
                    materials: 'Array of calculation results',
                    summary: {
                        totalEmbodiedCarbon: 'number - Total A1-A5 emissions',
                        totalTransportCarbon: 'number - Transport emissions',
                        totalCarbon: 'number - Combined total',
                    },
                },
            },
        },
        relatedEndpoints: [
            'GET /api/carbon/materials - List available materials',
            'GET /api/carbon/factors - List carbon factors',
            'GET /api/carbon/alternatives - List low-carbon alternatives',
            'POST /api/carbon/conversions - Convert units',
        ],
    });
}
