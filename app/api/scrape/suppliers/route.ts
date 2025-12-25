import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { z } from 'zod'
import { AZURE_DEPLOYMENT_CHEAP } from '@/lib/constants'

const RequestSchema = z.object({
    urls: z.array(z.string().url()),
})

export async function POST(req: Request) {
    const client = new OpenAI({
        apiKey: process.env['AZURE_OPENAI_API_KEY'],
        baseURL: process.env['AZURE_OPENAI_ENDPOINT'],
    })

    const supabase = createServerClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['SUPABASE_SERVICE_ROLE_KEY']!,
        {
            cookies: {
                get: (name: string) => cookies().get(name)?.value,
                set: () => { },
                remove: () => { },
            },
        }
    )

    let body
    try {
        body = await req.json()
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
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

