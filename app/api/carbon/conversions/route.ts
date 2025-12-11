/**
 * Unit Conversions API
 * 
 * Provides material density and unit conversion data
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import UnitConversion from '../../../../models/UnitConversion';

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
        const materialType = searchParams.get('type');

        // Build query
        const query: Record<string, unknown> = {};

        if (category) {
            query['materialCategory'] = { $regex: category, $options: 'i' };
        }

        if (materialType) {
            query['materialType'] = { $regex: materialType, $options: 'i' };
        }

        const conversions = await UnitConversion.find(query)
            .sort({ materialCategory: 1, materialType: 1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: conversions,
            meta: {
                total: conversions.length,
                source: 'cached',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Unit Conversions API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch unit conversions' },
            { status: 500 }
        );
    }
}

// Perform a conversion calculation
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        interface ConversionBody {
            category: string;
            materialType?: string;
            fromUnit: string;
            toUnit: string;
            value: number;
        }

        const body = await request.json() as ConversionBody;
        const { category, materialType, fromUnit, toUnit, value } = body;

        if (!category || !fromUnit || !toUnit || value === undefined) {
            return NextResponse.json(
                { success: false, error: 'category, fromUnit, toUnit, and value required' },
                { status: 400 }
            );
        }

        // Find the conversion table
        const query: Record<string, unknown> = {
            materialCategory: { $regex: category, $options: 'i' },
        };

        if (materialType) {
            query['materialType'] = { $regex: materialType, $options: 'i' };
        }

        const conversionDoc = await UnitConversion.findOne(query).lean();

        if (!conversionDoc) {
            return NextResponse.json({
                success: false,
                error: `No conversion data found for category: ${category}`,
            }, { status: 404 });
        }

        // Find direct conversion
        interface Conversion {
            fromUnit: string;
            toUnit: string;
            factor: number;
            notes?: string;
        }

        let conversion = conversionDoc.conversions.find(
            (c: Conversion) => c.fromUnit.toLowerCase() === fromUnit.toLowerCase() &&
                c.toUnit.toLowerCase() === toUnit.toLowerCase()
        );

        // Try reverse conversion
        let reversed = false;
        if (!conversion) {
            const reverseConversion = conversionDoc.conversions.find(
                (c: Conversion) => c.fromUnit.toLowerCase() === toUnit.toLowerCase() &&
                    c.toUnit.toLowerCase() === fromUnit.toLowerCase()
            );
            if (reverseConversion) {
                conversion = {
                    fromUnit,
                    toUnit,
                    factor: 1 / reverseConversion.factor,
                    notes: `Reversed from ${reverseConversion.notes || ''}`,
                };
                reversed = true;
            }
        }

        // Try density-based conversion
        if (!conversion && conversionDoc.density) {
            const density = conversionDoc.density;

            // Volume to mass
            if (fromUnit.toLowerCase() === 'm³' && toUnit.toLowerCase() === 'kg') {
                conversion = { fromUnit, toUnit, factor: density, notes: 'Via density' };
            } else if (fromUnit.toLowerCase() === 'kg' && toUnit.toLowerCase() === 'm³') {
                conversion = { fromUnit, toUnit, factor: 1 / density, notes: 'Via density' };
            }
        }

        if (!conversion) {
            return NextResponse.json({
                success: false,
                error: `No conversion found from ${fromUnit} to ${toUnit} for ${category}`,
                availableConversions: conversionDoc.conversions.map((c: Conversion) => ({
                    from: c.fromUnit,
                    to: c.toUnit,
                })),
            }, { status: 400 });
        }

        const result = value * conversion.factor;

        return NextResponse.json({
            success: true,
            data: {
                input: { value, unit: fromUnit },
                output: { value: Math.round(result * 10000) / 10000, unit: toUnit },
                conversion: {
                    factor: conversion.factor,
                    notes: conversion.notes,
                    reversed,
                },
                material: {
                    category: conversionDoc.materialCategory,
                    type: conversionDoc.materialType,
                    density: conversionDoc.density,
                },
            },
            meta: {
                source: 'cached',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Unit Conversion POST Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to perform conversion' },
            { status: 500 }
        );
    }
}
