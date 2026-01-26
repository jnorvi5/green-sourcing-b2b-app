
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/api';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user) return unauthorizedResponse();

        if (user.role !== 'admin') {
             return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        const result = await query(
            `UPDATE suppliers
             SET verification_status = 'verified', updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Verify Supplier Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

