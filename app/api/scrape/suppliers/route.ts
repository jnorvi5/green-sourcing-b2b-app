import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { z } from 'zod'

// Define the input schema
const RequestSchema = z.object({
    urls: z.array(z.string().url()),
})

// Define a schema if needed, or use 'any' if not defined elsewhere.
// Assuming RequestSchema is defined somewhere or we define it here.
// For now, I'll remove RequestSchema usage or make it optional as the file seems mixed up.
// Looking at the file, it has TWO main blocks of logic mashed together.
// One block uses `urls` (multiple) and iterates.
// The other block (after line 78) uses `targetUrl` (single) and `supplierId`.
// It looks like a merge conflict or bad copy-paste.

// I will clean this up to support the "Single Scrape" logic which seems to be the intended one
// based on the "Delegating scrape to Azure" log and error handling at the bottom.
// But wait, the top part handles `urls` array.
// I'll support BOTH if possible, or assume the top part was an incomplete feature.
// Given the "Delegating scrape to Azure" logs are more detailed, I suspect the bottom part is the "active" intent.
// However, to be safe, I'll keep the single scrape logic as primary if that's what the frontend sends.

// actually, let's look at the "switch" comment. "3. The Switch: Call Azure instead of doing it locally".
// This suggests the bottom part is the new logic.
// The top part seems to be trying to process a list of URLs.

export async function POST(request: Request) {
export const maxDuration = 60; // Allow 60 seconds for scraping

export async function POST(req: Request) {
    try {
        // 1. Setup Clients
        const client = new OpenAI({
            apiKey: process.env['AZURE_OPENAI_API_KEY'],
            baseURL: process.env['AZURE_OPENAI_ENDPOINT'],
            defaultQuery: { 'api-version': '2024-02-15-preview' },
            defaultHeaders: { 'api-key': process.env['AZURE_OPENAI_API_KEY'] }
        })

        const cookieStore = cookies()

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
        )

        // 2. Parse Body
        let body
        try {
            body = await req.json()
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const body = await request.json();
        const { targetUrl, supplierId, urls } = body;

        // CASE 1: Multiple URLs (Bulk Scrape) - Top logic
        if (urls && Array.isArray(urls)) {
             // Process in parallel with concurrency limit (e.g., 5)
            // Simple Promise.all since typical batches are small (<10)
            const results = await Promise.all(
                urls.map(async (url: string) => {
                    try {
                        // Call Azure Function instead of local scraping
                        const azureFunctionUrl = process.env.AZURE_FUNCTIONS_BASE_URL
                            ? `${process.env.AZURE_FUNCTIONS_BASE_URL}/api/scrapeSupplier`
                            : process.env.AZURE_SCRAPER_FUNCTION_URL; // Fallback

                        if (!azureFunctionUrl) {
                            throw new Error("Azure Function URL not configured");
                        }

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

                        await supabase.from('supplier_scrapes').insert({
                            source_url: url,
                            company_name: data.title,
                            location: 'Unknown',
                            products: data.detectedProducts,
                            certifications: [],
                            contact_email: null,
                            raw_data: data
                        });

                        return { url, success: true, company: data.title, products: data.detectedProducts };

                    } catch (error: unknown) {
                        console.error(`Scrape error for ${url}:`, error);
                        return { url, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        const parse = RequestSchema.safeParse(body)
        if (!parse.success) {
            return NextResponse.json({ error: 'Invalid input', details: parse.error }, { status: 400 })
        }
        const { urls } = parse.data

        // 3. Process URLs (Scrape -> Analyze -> Save)
        const results = await Promise.all(
            urls.map(async (url) => {
                try {
                    // A. Scrape with Firecrawl
                    const websiteRes = await fetch(`https://api.firecrawl.dev/v0/scrape`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${process.env['FIRECRAWL_API_KEY']}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ url, pageOptions: { onlyMainContent: true } }),
                    })

                    if (!websiteRes.ok) {
                        throw new Error(`Firecrawl API Error: ${websiteRes.statusText}`);
                    }
                })
            );

            return NextResponse.json({ results });
        }

        // CASE 2: Single URL (Specific Supplier Scrape) - Bottom logic
        if (targetUrl) {
            // 3. The Switch: Call Azure instead of doing it locally
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
            if (result.success && result.data && supplierId) {
                // Save the scraped data to Supabase
                const { error: dbError } = await supabase
                    .from('suppliers')
                    .update({
                        website_data: result.data, // Make sure your DB has this JSONB column
                        last_scraped_at: new Date().toISOString(),
                        status: 'verified'
                    const { data } = await websiteRes.json()
                    const scrapedText = (data?.markdown || data?.text || '').slice(0, 15000); // Limit text length

                    // B. Analyze with Azure OpenAI
                    const prompt = `You are a data extraction expert. Extract supplier information from this website content:

${scrapedText}

Return ONLY valid JSON with this exact schema:
{
  "company_name": "string",
  "location": "City, State (or Full Address)",
  "products": ["list", "of", "products"],
  "certifications": ["LEED", "FSC", "ISO", "etc"],
  "sustainability_features": ["recycled content", "low carbon", "etc"],
  "contact_email": "email@example.com (or null)"
}`

                    const aiRes = await client.chat.completions.create({
                        model: process.env['AZURE_OPENAI_DEPLOYMENT_NAME'] || "gpt-35-turbo",
                        messages: [{ role: 'user', content: prompt }],
                        response_format: { type: 'json_object' },
                        max_tokens: 800,
                    })

                    const content = aiRes.choices[0].message.content
                    if (!content) throw new Error("No AI response generated");

                    const extracted = JSON.parse(content)

                    // C. Save to Supabase
                    const { error: dbError } = await supabase.from('supplier_scrapes').insert({
                        source_url: url,
                        company_name: extracted.company_name || 'Unknown',
                        location: extracted.location,
                        products: extracted.products || [],
                        certifications: extracted.certifications || [],
                        contact_email: extracted.contact_email,
                        status: 'completed'
                    })
                    .eq('id', supplierId);

                if (dbError) console.error('Database update failed:', dbError);
            }

            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Missing targetUrl or urls' }, { status: 400 });

    } catch (error: any) {
        console.error('🔥 Scrape Proxy Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
                    if (dbError) console.error("DB Insert Error:", dbError);

                    return { url, success: true, company: extracted.company_name }
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    console.error(`Scrape error for ${url}:`, error)
                    return { url, success: false, error: errorMessage }
                }
            })
        )

        return NextResponse.json({ results })

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
        console.error("Fatal Scrape Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
    }
}
