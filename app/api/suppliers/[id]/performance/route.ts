import { NextRequest, NextResponse } from 'next/server';
import { supplierPerformanceService } from '../../../../../lib/supplierPerformanceService';

// GET /api/suppliers/[id]/performance - Get supplier performance data
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supplierId = params.id;
        const { searchParams } = new URL(request.url);
        const months = parseInt(searchParams.get('months') || '12');
        const includeHistory = searchParams.get('includeHistory') === 'true';

        // Get scorecard
        const scorecard = await supplierPerformanceService.getScorecard(supplierId);

        // Get performance history if requested
        let history = null;
        if (includeHistory) {
            history = await supplierPerformanceService.getPerformanceHistory(supplierId, months);
        }

        if (!scorecard) {
            // Return empty scorecard for new suppliers
            return NextResponse.json({
                success: true,
                data: {
                    scorecard: {
                        supplierId,
                        overallScore: 0,
                        tier: 'new',
                        scores: { quality: 0, delivery: 0, responsiveness: 0, sustainability: 0, value: 0 },
                        badges: [],
                        achievements: [],
                        warnings: [],
                    },
                    history: history || [],
                },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                scorecard,
                history: history || [],
            },
        });
    } catch (error) {
        console.error('Error fetching supplier performance:', error);
        return NextResponse.json(
            { error: 'Failed to fetch supplier performance' },
            { status: 500 }
        );
    }
}

// POST /api/suppliers/[id]/performance - Recalculate supplier performance
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supplierId = params.id;

        // Trigger scorecard recalculation
        const scorecard = await supplierPerformanceService.updateScorecard(supplierId);

        return NextResponse.json({
            success: true,
            data: scorecard,
        });
    } catch (error) {
        console.error('Error updating supplier performance:', error);
        return NextResponse.json(
            { error: 'Failed to update supplier performance' },
            { status: 500 }
        );
    }
}
