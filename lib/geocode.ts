export async function geocodeAddress(address: string) {
    const apiKey = process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'];
    if (!apiKey) {
        console.error('Missing Google Maps API Key');
        // Fallback for demo if no key
        return { lat: 34.0522, lng: -118.2437, formatted_address: address };
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
    )}&key=${apiKey}`

    try {
        const res = await fetch(url)
        const data = await res.json()

        if (data.status === 'OK' && data.results[0]) {
            const { lat, lng } = data.results[0].geometry.location
            return { lat, lng, formatted_address: data.results[0].formatted_address }
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }

    throw new Error('Geocoding failed')
}
