import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { z } from 'zod'

// Define the input schema
const RequestSchema = z.object({
    urls: z.array(z.string().url()),
})

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
