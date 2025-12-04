import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as cheerio from 'cheerio'
import * as fs from 'fs'

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface ScrapedData {
  supplier_name: string
  description: string
  location?: string
  email?: string
  phone?: string
  products: Array<{
    name: string
    category: string
    description: string
    sustainability_claims?: string[]
    certifications?: string[]
  }>
}

async function scrapeSupplier(url: string) {
  console.log(`\n🕷️  Scraping ${url}...`)
  
  try {
    // 1. Fetch HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GreenChainz/1.0; +https://greenchainz.com)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Remove noise
    $('script, style, nav, footer, iframe').remove()
    const textContent = $('body').text()
      .replace(/\s+/g, ' ')
      .substring(0, 15000) // Limit to 15k chars

    console.log(`📄 Extracted ${textContent.length} characters of text`)

    // 2. AI Extraction
    console.log(`🤖 Running AI extraction...`)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a data extraction agent for GreenChainz, a B2B marketplace for sustainable building materials.
Extract supplier information and products from website text.
Focus on: company name, products, sustainability certifications (FSC, EPD, B Corp, LEED), environmental claims.
If data is missing, use "Unknown" or reasonable defaults.`
        },
        {
          role: 'user',
          content: `Extract structured data from this website:\n\nURL: ${url}\n\nContent: ${textContent}`
        }
      ],
      response_format: { type: 'json_object' },
      functions: [
        {
          name: 'extract_supplier_data',
          description: 'Extract supplier and product information',
          parameters: {
            type: 'object',
            required: ['supplier_name', 'description', 'products'],
            properties: {
              supplier_name: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['name', 'category', 'description'],
                  properties: {
                    name: { type: 'string' },
                    category: { type: 'string' },
                    description: { type: 'string' },
                    sustainability_claims: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    certifications: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      ],
      function_call: { name: 'extract_supplier_data' }
    })

    const functionCall = completion.choices[0].message.function_call
    if (!functionCall) {
      throw new Error('No function call returned from OpenAI')
    }

    const data: ScrapedData = JSON.parse(functionCall.arguments)
    console.log(`✅ Extracted: ${data.supplier_name} with ${data.products.length} products`)

    // 3. Calculate data quality score
    let qualityScore = 30 // Base score for scraped data
    if (data.location) qualityScore += 10
    if (data.email) qualityScore += 10
    if (data.products.length > 0) qualityScore += 20
    if (data.products.some(p => p.certifications && p.certifications.length > 0)) qualityScore += 30

    // 4. Seed Database
    console.log(`💾 Inserting into Supabase...`)
    
    const { data: supplier, error: supplierError } = await supabase
      .from('profiles')
      .insert({
        company_name: data.supplier_name,
        description: data.description,
        location: data.location || 'Unknown',
        email: data.email || null,
        phone: data.phone || null,
        role: 'supplier',
        is_claimed: false,
        scraped_url: url,
        scraped_at: new Date().toISOString(),
        data_quality_score: qualityScore,
        is_verified: false
      })
      .select()
      .single()

    if (supplierError) {
      console.error('❌ Supabase error:', supplierError)
      throw supplierError
    }

    console.log(`✅ Created supplier profile: ${supplier.id}`)

    // 5. Insert Products
    if (data.products.length > 0) {
      const products = data.products.map((p) => ({
        supplier_id: supplier.id,
        name: p.name,
        description: p.description,
        category: p.category,
        certifications: p.certifications || [],
        verification_status: 'unverified',
        data_source: 'scrape',
        risk_flags: [
          p.certifications?.length === 0 ? 'no_certifications' : null,
          !p.sustainability_claims ? 'no_sustainability_claims' : null
        ].filter(Boolean)
      }))

      const { error: productsError } = await supabase
        .from('products')
        .insert(products)

      if (productsError) {
        console.error('❌ Products error:', productsError)
      } else {
        console.log(`✅ Inserted ${products.length} products`)
      }
    }

    // 6. Generate claim link
    const claimUrl = `https://greenchainz.com/claim?token=${supplier.claim_token}`
    console.log(`\n🔗 Claim Link: ${claimUrl}`)
    console.log(`📊 Quality Score: ${qualityScore}/100`)
    console.log(`⚠️  Status: ${qualityScore < 50 ? 'HIGH RISK' : 'MEDIUM RISK'}\n`)

    return { success: true, supplier, claimUrl }

  } catch (error) {
    console.error('❌ Scraping failed:', error)
    return { success: false, error }
  }
}

// Batch scraper for CSV input
async function scrapeBatch(csvPath: string) {
  const urls = fs.readFileSync(csvPath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line.startsWith('http'))

  console.log(`\n📋 Found ${urls.length} URLs to scrape\n`)

  const results = []
  for (const url of urls) {
    const result = await scrapeSupplier(url)
    results.push({ url, ...result })
    // Rate limit: 1 request per 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Save results
  fs.writeFileSync(
    'scrape-results.json',
    JSON.stringify(results, null, 2)
  )

  console.log(`\n✅ Batch complete. Results saved to scrape-results.json`)
  console.log(`📊 Success: ${results.filter(r => r.success).length}/${urls.length}`)
}

// CLI Usage
const args = process.argv.slice(2)
if (args.length === 0) {
  console.log(`
Usage:
  Single: npx ts-node scripts/scrape-supplier.ts <url>
  Batch:  npx ts-node scripts/scrape-supplier.ts batch <csv-file>
`)
  process.exit(1)
}

if (args[0] === 'batch') {
  scrapeBatch(args[1])
} else {
  scrapeSupplier(args[0])
}
