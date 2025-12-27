import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow 60s for Vercel to wait for Azure

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Security Check: Ensure user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get Data from Frontend
        const body = await request.json();
        const { targetUrl, supplierId } = body;

        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing targetUrl' }, { status: 400 });
        }

        // 3. The Switch: Call Azure instead of doing it locally
        // This URL will be in your Vercel Environment Variables
        const azureFunctionUrl = process.env.AZURE_SCRAPER_FUNCTION_URL;

        if (!azureFunctionUrl) {
            console.error("❌ Configuration Error: AZURE_SCRAPER_FUNCTION_URL is missing.");
            return NextResponse.json({
                error: 'System configuration error. Please contact support.'
            }, { status: 500 });
        }

        console.log(`🚀 Delegating scrape to Azure: ${targetUrl}`);

        // Call your Azure Function
        const response = await fetch(azureFunctionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUrl, supplierId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Azure Scraper failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();

        // 4. Update Database with results (if Azure sent data back)
        if (result.success && result.data) {
            // Save the scraped data to Supabase
            const { error: dbError } = await supabase
                .from('suppliers')
                .update({
                    website_data: result.data, // Make sure your DB has this JSONB column
                    last_scraped_at: new Date().toISOString(),
                    status: 'verified'
                })
                .eq('id', supplierId);

            if (dbError) console.error('Database update failed:', dbError);
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('🔥 Scrape Proxy Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
