import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Valid email is required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Insert email into subscribers table
        const { data, error } = await supabase
            .from('subscribers')
            .insert([
                {
                    email,
                    subscribed_at: new Date().toISOString(),
                    source: 'landing_page',
                    status: 'active'
                }
            ])
            .select();

        if (error) {
            // Check if it's a duplicate email error
            if (error.code === '23505') {
                return NextResponse.json(
                    { message: 'You are already subscribed!' },
                    { status: 200 }
                );
            }
            console.error('Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to subscribe' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Successfully subscribed!', data },
            { status: 200 }
        );
    } catch (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}