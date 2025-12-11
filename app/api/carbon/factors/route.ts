/**
 * Carbon Factors API
 * 
 * Serves cached regional carbon emission factors
 * (electricity grid, transport, fuel)
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import CarbonFactor from '../../../../models/CarbonFactor';

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
        const type = searchParams.get('type'); // electricity, transport, fuel
        const country = searchParams.get('country');
        const region = searchParams.get('region');
        const subregion = searchParams.get('subregion');

        // Build query
        const query: Record<string, unknown> = { isActive: true };

        if (type) {
            query['type'] = type;
        }

        if (country) {
            query['country'] = country.toUpperCase();
        }

        if (region) {
            query['region'] = { $regex: region, $options: 'i' };
        }

        if (subregion) {
            query['subregion'] = subregion.toUpperCase();
        }

        // Execute query
        const factors = await CarbonFactor.find(query)
            .sort({ type: 1, region: 1, country: 1 })
            .lean();

        // Group by type for easier consumption
        const grouped = {
            electricity: factors.filter(f => f.type === 'electricity'),
            transport: factors.filter(f => f.type === 'transport'),
            fuel: factors.filter(f => f.type === 'fuel'),
        };

        return NextResponse.json({
            success: true,
            data: factors,
            grouped,
            meta: {
                total: factors.length,
                source: 'cached',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Carbon Factors API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch carbon factors' },
            { status: 500 }
        );
    }
}

// Calculate transport emissions
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        interface TransportCalcBody {
            mode: string;
            distanceKm: number;
            weightTons: number;
            originCountry?: string;
            destCountry?: string;
        }

        const body = await request.json() as TransportCalcBody;
        const { mode, distanceKm, weightTons } = body;

        if (!mode || !distanceKm || !weightTons) {
            return NextResponse.json(
                { success: false, error: 'mode, distanceKm, and weightTons required' },
                { status: 400 }
            );
        }

        // Map mode to factorId
        const modeMap: Record<string, string> = {
            truck: 'transport-truck',
            rail: 'transport-rail',
            ship: 'transport-ship',
            air: 'transport-air',
            road: 'transport-truck',
            sea: 'transport-ship',
            ocean: 'transport-ship',
        };

        const factorId = modeMap[mode.toLowerCase()];
        if (!factorId) {
            return NextResponse.json(
                { success: false, error: `Unknown transport mode: ${mode}` },
                { status: 400 }
            );
        }

        const factor = await CarbonFactor.findOne({ factorId }).lean();
        if (!factor) {
            return NextResponse.json(
                { success: false, error: 'Carbon factor not found' },
                { status: 404 }
            );
        }

        // Calculate emissions: factor (kg CO2e/ton-km) * distance (km) * weight (tons)
        const emissions = (factor.factor as number) * distanceKm * weightTons;

        return NextResponse.json({
            success: true,
            data: {
                mode,
                distanceKm,
                weightTons,
                factor: factor.factor,
                factorUnit: factor.unit,
                emissions: Math.round(emissions * 100) / 100,
                emissionsUnit: 'kg CO2e',
                source: factor.source,
            },
            meta: {
                source: 'cached',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Transport Calc API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to calculate transport emissions' },
            { status: 500 }
        );
    }
}
