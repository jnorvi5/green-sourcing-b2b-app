import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { z } from 'zod'

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
                const websiteRes = await fetch(`https://api.firecrawl.dev/v0/scrape`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env['FIRECRAWL_API_KEY']}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url }),
                })

                const { data } = await websiteRes.json()
                const scrapedText = data?.markdown || data?.text || ''

                const prompt = `Extract supplier information from this website content:

${scrapedText}

Return ONLY valid JSON:
{
  "company_name": "...",
  "location": "City, State",
  "products": ["Product 1", "Product 2"],
  "certifications": ["LEED", "FSC"],
  "sustainability_features": ["recycled content", "low carbon"],
  "contact_email": "info@company.com"
}`

                const aiRes = await client.chat.completions.create({
                    model: AZURE_DEPLOYMENT_CHEAP,
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: 'json_object' },
                    max_tokens: 500,
                })

                const extracted = JSON.parse(aiRes.choices[0].message.content!)

                await supabase.from('supplier_scrapes').insert({
                    source_url: url,
                    company_name: extracted.company_name,
                    location: extracted.location,
                    products: extracted.products,
                    certifications: extracted.certifications,
                    contact_email: extracted.contact_email,
                })

                return { url, success: true, company: extracted.company_name }
            } catch (error: any) {
                console.error(`Scrape error for ${url}:`, error)
                return { url, success: false, error: error.message || 'Unknown error' }
            }
        })
    )

    return NextResponse.json({ results })
}

