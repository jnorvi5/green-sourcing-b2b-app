import { NextRequest, NextResponse } from 'next/server';
import { supplierPerformanceService } from '../../../lib/supplierPerformanceService';

// GET /api/leaderboard - Get supplier leaderboard
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'overall';
        const tier = searchParams.get('tier');
        const limit = parseInt(searchParams.get('limit') || '10');
        const category = searchParams.get('category') || undefined;

        let suppliers;

        if (tier) {
            // Get suppliers by tier
            suppliers = await supplierPerformanceService.getSuppliersByTier(
                tier as 'platinum' | 'gold' | 'silver' | 'bronze' | 'new'
            );
        } else {
            // Get top suppliers overall
            suppliers = await supplierPerformanceService.getTopSuppliers(limit, category);
        }

        // Calculate rankings
        const ranked = suppliers.map((supplier, index) => ({
            rank: index + 1,
            ...supplier,
        }));

        // Get tier distribution
        const tierCounts = suppliers.reduce((acc, s) => {
            acc[s.tier] = (acc[s.tier] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
            success: true,
            data: {
                suppliers: ranked,
                meta: {
                    total: suppliers.length,
                    tierDistribution: tierCounts,
                    type,
                    limit,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
