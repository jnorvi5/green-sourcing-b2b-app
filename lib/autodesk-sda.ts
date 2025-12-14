// Get Autodesk access token
async function getAutodeskToken() {
    const res = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.AUTODESK_CLIENT_ID!,
            client_secret: process.env.AUTODESK_CLIENT_SECRET!,
            grant_type: 'client_credentials',
            scope: 'data:read',
        }),
    })

    const data = await res.json()
    return data.access_token
}

// Fetch EPD data for material
export async function getEPDData(materialName: string) {
    try {
        const token = await getAutodeskToken()

        const res = await fetch(
            `https://developer.api.autodesk.com/construction/carbon/v1/epd?search=${encodeURIComponent(materialName)}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        )

        const data = await res.json()

        if (data.results && data.results[0]) {
            return {
                material: materialName,
                embodied_carbon_kg: data.results[0].gwp_per_unit || 500,
                source: 'Autodesk SDA',
                epd_url: data.results[0].url,
            }
        }
    } catch (error) {
        console.error('Autodesk SDA error:', error)
    }

    // Fallback: mock data
    return {
        material: materialName,
        embodied_carbon_kg: 500,
        source: 'Estimated',
        epd_url: null,
    }
}
