// Get Autodesk access token
async function getAutodeskToken() {
    const clientId = process.env['AUTODESK_CLIENT_ID'];
    const clientSecret = process.env['AUTODESK_CLIENT_SECRET'];

    if (!clientId || !clientSecret) {
        throw new Error('Missing Autodesk Credentials');
    }

    const res = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
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
        const apiUrl = process.env['AUTODESK_SDA_API_URL'];

        if (!apiUrl) throw new Error('Missing Autodesk SDA API URL');

        // Search SDA API for material EPD
        const res = await fetch(
            `${apiUrl}/epd?search=${encodeURIComponent(materialName)}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        )

        const data = await res.json()

        // Return embodied carbon (kg CO2 per unit)
        if (data.results && data.results[0]) {
            return {
                material: materialName,
                embodied_carbon_kg: data.results[0].gwp_per_unit || 0,
                source: 'Autodesk SDA',
            }
        }
    } catch (error) {
        console.error('Autodesk SDA Error:', error);
    }

    // Fallback: mock data if API unavailable
    return {
        material: materialName,
        embodied_carbon_kg: 500, // Default estimate
        source: 'Estimated',
    }
}
