
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const user = await getAuthUser();
        if (!user) return unauthorizedResponse();

        // Access Control
        const supplierCheck = await query(
            'SELECT id, user_id, verification_status FROM suppliers WHERE id = $1',
            [id]
        );

        if (supplierCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        const supplier = supplierCheck.rows[0];
        const isAdmin = user.role === 'admin';
        const isOwner = supplier.user_id === user.userId;
        const isArchitect = user.role === 'architect';
        const isVerified = supplier.verification_status === 'verified';

        if (!isAdmin && !isOwner) {
             if (!isArchitect || !isVerified) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const result = await query(
            `SELECT * FROM locations WHERE supplier_id = $1`,
            [id]
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('List Locations Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params; // supplier_id
    try {
        const user = await getAuthUser();
        if (!user) return unauthorizedResponse();

        // Ownership Check
        if (user.role !== 'admin') {
            const ownershipCheck = await query(
                'SELECT id FROM suppliers WHERE id = $1 AND user_id = $2',
                [id, user.userId]
            );
            if (ownershipCheck.rows.length === 0) {
                 return NextResponse.json({ error: 'Forbidden: You do not own this supplier profile' }, { status: 403 });
            }
        }

        const body = await req.json();
        const { address, city, state, zip, latitude, longitude } = body;

        if (!address || !city || !state || !zip) {
             return NextResponse.json({ error: 'Address fields are required' }, { status: 400 });
        }

        const result = await query(
            `INSERT INTO locations (supplier_id, address, city, state, zip, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [id, address, city, state, zip, latitude, longitude]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Create Location Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

