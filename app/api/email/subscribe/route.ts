/**
 * Email Subscribers API
 * 
 * POST /api/email/subscribe - Add subscriber
 * DELETE /api/email/subscribe - Remove subscriber
 * GET /api/email/subscribe - Get groups
 */
import { NextRequest, NextResponse } from 'next/server';
import { addSubscriber, removeSubscriber, getGroups } from '../../../../lib/mailerlite';

export async function GET() {
    try {
        const groups = await getGroups();
        return NextResponse.json({ groups });
    } catch (error) {
        console.error('Get groups error:', error);
        return NextResponse.json(
            { error: 'Failed to get groups' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as {
            email: string;
            fields?: {
                name?: string;
                company?: string;
                role?: string;
            };
            groups?: string[];
        };

        if (!body.email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const result = await addSubscriber(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to add subscriber' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            subscriberId: result.subscriberId,
        });

    } catch (error) {
        console.error('Add subscriber error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const result = await removeSubscriber(email);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to remove subscriber' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Remove subscriber error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
