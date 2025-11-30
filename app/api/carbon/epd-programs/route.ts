/**
 * EPD Programs API
 * 
 * Returns EPD program operators for validation and lookups
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import EPDProgram from '../../../../models/EPDProgram';

const MONGODB_URI = process.env.MONGODB_URI || '';

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
        const region = searchParams.get('region');
        const country = searchParams.get('country');

        // Build query
        const query: Record<string, unknown> = { isActive: true };

        if (region) {
            query.regions = { $in: [region] };
        }

        if (country) {
            query.headquarters = country.toUpperCase();
        }

        const programs = await EPDProgram.find(query)
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: programs,
            meta: {
                total: programs.length,
                source: 'cached',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('EPD Programs API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch EPD programs' },
            { status: 500 }
        );
    }
}

// Validate an EPD number
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        interface ValidateBody {
            epdNumber: string;
            programId?: string;
        }

        const body = await request.json() as ValidateBody;
        const { epdNumber, programId } = body;

        if (!epdNumber) {
            return NextResponse.json(
                { success: false, error: 'epdNumber required' },
                { status: 400 }
            );
        }

        // If programId provided, validate against specific program
        if (programId) {
            const program = await EPDProgram.findOne({ programId, isActive: true }).lean();

            if (!program) {
                return NextResponse.json({
                    success: false,
                    error: `Unknown EPD program: ${programId}`,
                }, { status: 404 });
            }

            // Check prefix match if program has one
            const hasValidPrefix = program.epdPrefix
                ? epdNumber.toUpperCase().startsWith(program.epdPrefix)
                : true;

            return NextResponse.json({
                success: true,
                data: {
                    epdNumber,
                    program: {
                        id: program.programId,
                        name: program.name,
                        shortName: program.shortName,
                        website: program.website,
                        registryUrl: program.registryUrl,
                    },
                    validation: {
                        prefixValid: hasValidPrefix,
                        expectedPrefix: program.epdPrefix,
                        lookupUrl: program.registryUrl
                            ? `${program.registryUrl}?search=${encodeURIComponent(epdNumber)}`
                            : null,
                    },
                },
            });
        }

        // Try to identify program from EPD number prefix
        const programs = await EPDProgram.find({ isActive: true }).lean();

        const matchingProgram = programs.find(p =>
            p.epdPrefix && epdNumber.toUpperCase().startsWith(p.epdPrefix)
        );

        if (matchingProgram) {
            return NextResponse.json({
                success: true,
                data: {
                    epdNumber,
                    program: {
                        id: matchingProgram.programId,
                        name: matchingProgram.name,
                        shortName: matchingProgram.shortName,
                        website: matchingProgram.website,
                        registryUrl: matchingProgram.registryUrl,
                    },
                    validation: {
                        identified: true,
                        confidence: 'high',
                        lookupUrl: matchingProgram.registryUrl
                            ? `${matchingProgram.registryUrl}?search=${encodeURIComponent(epdNumber)}`
                            : null,
                    },
                },
            });
        }

        // Could not identify program
        return NextResponse.json({
            success: true,
            data: {
                epdNumber,
                program: null,
                validation: {
                    identified: false,
                    confidence: 'none',
                    message: 'Could not identify EPD program from number prefix',
                    availablePrograms: programs.map(p => ({
                        id: p.programId,
                        name: p.shortName,
                        prefix: p.epdPrefix,
                    })),
                },
            },
        });

    } catch (error) {
        console.error('EPD Validate POST Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to validate EPD' },
            { status: 500 }
        );
    }
}
