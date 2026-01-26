
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user) return unauthorizedResponse();

        const result = await query(
            `SELECT verification_status, updated_at
             FROM suppliers
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Get Verification Status Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

