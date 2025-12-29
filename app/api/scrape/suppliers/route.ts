import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { targetUrl, supplierId } = body
        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing targetUrl' }, { status: 400 })
        }

        // Fetch from Azure Function
        const azureFunctionUrl = process.env['AZURE_SCRAPER_FUNCTION_URL']
        if (!azureFunctionUrl) {
            return NextResponse.json(
                { error: 'System configuration error.' },
                { status: 500 }
            )
        }
        const response = await fetch(azureFunctionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUrl, supplierId }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Azure Scraper failed: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        return NextResponse.json(result)
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
