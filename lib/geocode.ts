export async function geocodeAddress(address: string) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
    )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    // Audit Fixed: Handle ZERO_RESULTS specific edge case
    if (data.status === 'ZERO_RESULTS') {
        throw new Error('Address not found. Please verify the location.')
    }

    if (data.status === 'OK' && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location
        return { lat, lng, formatted_address: data.results[0].formatted_address }
    }

    throw new Error(`Geocoding failed: ${data.status}`)
}
