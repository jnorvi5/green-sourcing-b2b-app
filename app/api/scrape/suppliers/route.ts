import { createClient } from '@/utils/supabase/server';
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

        const parse = RequestSchema.safeParse(body)
        if (!parse.success) {
            return NextResponse.json({ error: 'Invalid input', details: parse.error }, { status: 400 })
        }
        const { urls } = parse.data

        // Process in parallel with concurrency limit (e.g., 5)
        // Simple Promise.all since typical batches are small (<10)
        const results = await Promise.all(
            urls.map(async (url) => {
                try {
                    // Call Azure Function instead of local scraping
                    const azureFunctionUrl = process.env.AZURE_FUNCTIONS_BASE_URL
                        ? `${process.env.AZURE_FUNCTIONS_BASE_URL}/api/scrapeSupplier`
                        : 'http://localhost:7071/api/scrapeSupplier'; // Default to local func if env not set

                    const response = await fetch(azureFunctionUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ targetUrl: url }),
                    });

                    if (!response.ok) {
                        throw new Error(`Azure Function failed with status: ${response.status}`);
                    }

                    const result = await response.json();

                    if (!result.success) {
                        throw new Error(result.error || 'Unknown error from Azure Function');
                    }

                    const { data } = result;

                    // Store the scraped data in Supabase
                    // Note: The Azure Function returns basic metadata. 
                    // If we need deeper extraction (OpenAI), we might need to do it here 
                    // or move that logic to the Azure Function as well.
                    // For now, we store what we get.

                    await supabase.from('supplier_scrapes').insert({
                        source_url: url,
                        company_name: data.title, // Fallback to title as company name
                        location: 'Unknown', // Azure func doesn't extract this yet
                        products: data.detectedProducts,
                        certifications: [], // Azure func doesn't extract this yet
                        contact_email: null, // Azure func doesn't extract this yet
                        raw_data: data // Store full raw data for future processing
                    })

                    return { url, success: true, company: data.title, products: data.detectedProducts }

                } catch (error: unknown) {
                    console.error(`Scrape error for ${url}:`, error)
                    return { url, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
                }
            })
        )

        return NextResponse.json({ results })
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
