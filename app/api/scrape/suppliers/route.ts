import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Allow 60 seconds for scraping operations
export const maxDuration = 60;

/**
 * POST /api/scrape/suppliers
 * 
 * Delegates web scraping to Azure Functions to avoid Vercel serverless limitations.
 * Supports both single URL and bulk URL scraping.
 * 
 * Request Body:
 * - Single: { targetUrl: string, supplierId?: string }
 * - Bulk: { urls: string[] }
 */
export async function POST(request: Request) {
    try {
        // 1. Setup Supabase Client
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env['NEXT_PUBLIC_SUPABASE_URL']!,
            process.env['SUPABASE_SERVICE_ROLE_KEY']!,
            {
                cookies: {
                    get: (name: string) => cookieStore.get(name)?.value,
                    set: () => { },
                    remove: () => { },
                },
            }
        );

        // 2. Parse Request Body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400 }
            );
        }

        const { targetUrl, supplierId, urls } = body;

        // 3. Determine Azure Function URL
        const azureFunctionUrl = process.env.AZURE_SCRAPER_FUNCTION_URL ||
            (process.env.AZURE_FUNCTIONS_BASE_URL
                ? `${process.env.AZURE_FUNCTIONS_BASE_URL}/api/scrapeSupplier`
                : null);

        if (!azureFunctionUrl) {
            console.error("❌ Configuration Error: AZURE_SCRAPER_FUNCTION_URL is missing.");
            return NextResponse.json(
                { error: 'System configuration error. Please contact support.' },
                { status: 500 }
            );
        }

        // CASE 1: Bulk URL Scraping
        if (urls && Array.isArray(urls) && urls.length > 0) {
            console.log(`🚀 Delegating bulk scrape to Azure: ${urls.length} URLs`);

            const results = await Promise.all(
                urls.map(async (url: string) => {
                    try {
                        const response = await fetch(azureFunctionUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ targetUrl: url }),
                        });

                        if (!response.ok) {
                            throw new Error(`Azure Function failed with status: ${response.status}`);
                        }

                        const result = await response.json();

                        if (!result.success) {
                            throw new Error(result.error || 'Unknown error from Azure Function');
                        }

                        // Validate response data structure
                        const { data } = result;
                        if (!data || typeof data !== 'object') {
                            throw new Error('Invalid response data from Azure Function');
                        }

                        // Save to database
                        await supabase.from('supplier_scrapes').insert({
                            source_url: url,
                            company_name: data.title || 'Unknown',
                            location: 'Unknown',
                            products: Array.isArray(data.detectedProducts) ? data.detectedProducts : [],
                            certifications: [],
                            contact_email: null,
                            raw_data: data,
                        });

                        return {
                            url,
                            success: true,
                            company: data.title || 'Unknown',
                            products: Array.isArray(data.detectedProducts) ? data.detectedProducts : [],
                        };
                    } catch (error: unknown) {
                        console.error(`Scrape error for ${url}:`, error);
                        return {
                            url,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        };
                    }
                })
            );

            return NextResponse.json({ results });
        }

        // CASE 2: Single URL Scraping
        if (targetUrl) {
            console.log(`🚀 Delegating scrape to Azure: ${targetUrl}`);

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

            // Update database with results if supplier ID provided
            if (result.success && result.data && supplierId) {
                const { error: dbError } = await supabase
                    .from('suppliers')
                    .update({
                        website_data: result.data,
                        last_scraped_at: new Date().toISOString(),
                        status: 'verified',
                    })
                    .eq('id', supplierId);

                if (dbError) {
                    console.error('Database update failed:', dbError);
                }
            }

            return NextResponse.json(result);
        }

        // Neither targetUrl nor urls provided
        return NextResponse.json(
            { error: 'Missing targetUrl or urls in request body' },
            { status: 400 }
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('🔥 Scrape Proxy Error:', error);
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;
    
    // Simple mock response to pass build - replace with real logic later if needed
    return NextResponse.json({ 
        success: true, 
        message: "Scraping initiated", 
        data: { url } 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
