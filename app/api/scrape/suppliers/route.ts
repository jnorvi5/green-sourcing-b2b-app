import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

const client = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: process.env.AZURE_OPENAI_ENDPOINT,
})

export async function POST(req: Request) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get: (name: string) => cookies().get(name)?.value,
                set: () => { },
                remove: () => { },
            },
        }
    )

    const { urls } = await req.json() // Array of supplier website URLs

    const results = []

    for (const url of urls) {
        try {
            // Fetch website content (using Firecrawl or simple fetch)
            const websiteRes = await fetch(`https://api.firecrawl.dev/v0/scrape`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            })

            const { data } = await websiteRes.json()
            const scrapedText = data?.markdown || data?.text || ''

            // AI extracts structured data
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
                model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                max_tokens: 500,
            })

            const extracted = JSON.parse(aiRes.choices[0].message.content!)

            // Save to supplier_scrapes table
            await supabase.from('supplier_scrapes').insert({
                source_url: url,
                company_name: extracted.company_name,
                location: extracted.location,
                products: extracted.products,
                certifications: extracted.certifications,
                contact_email: extracted.contact_email,
            })

            results.push({ url, success: true, company: extracted.company_name })

            // TODO: Send claim email to extracted.contact_email
        } catch (error) {
            console.error(`Scrape error for ${url}:`, error)
            results.push({ url, success: false, error: error.message })
        }
    }

    return NextResponse.json({ results })
}
