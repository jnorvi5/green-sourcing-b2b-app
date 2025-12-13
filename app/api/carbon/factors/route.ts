/**
 * Carbon Factors API
 * 
 * Serves cached regional carbon emission factors
 * (electricity grid, transport, fuel)
 */
import { NextRequest, NextResponse } from 'next/server';

interface CarbonFactor {
    id: string;
    type: 'electricity' | 'transport' | 'fuel';
    region: string;
    factor: number;
    unit: string;
}

export async function GET() {
    // Mock data for factors - MongoDB removed
    // In a real app, this would come from a static JSON file or external API
    const factors: CarbonFactor[] = []; 
    const grouped = {
        electricity: [],
        transport: [],
        fuel: [],
    };

    return NextResponse.json({
        success: true,
        data: factors,
        grouped,
        meta: {
            total: 0,
            source: 'mock',
            timestamp: new Date().toISOString(),
        },
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=59',
        }
    });
}

// Calculate transport emissions
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mode, distanceKm, weightTons } = body;

        if (!mode || !distanceKm || !weightTons) {
            return NextResponse.json(
                { success: false, error: 'mode, distanceKm, and weightTons required' },
                { status: 400 }
            );
        }

        // Mock calculation since DB is gone
        // Standard factors could be hardcoded here if needed
        const mockFactor = 0.05; // kg CO2e / ton-km
        const emissions = mockFactor * distanceKm * weightTons;

        return NextResponse.json({
            success: true,
            data: {
                mode,
                distanceKm,
                weightTons,
                factor: mockFactor,
                factorUnit: 'kg CO2e / ton-km',
                emissions: Math.round(emissions * 100) / 100,
                emissionsUnit: 'kg CO2e',
                source: 'mock',
            },
            meta: {
                source: 'mock',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to calculate transport emissions' },
            { status: 500 }
        );
    }
}
