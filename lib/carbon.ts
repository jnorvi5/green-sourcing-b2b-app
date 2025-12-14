// Calculate distance between two lat/lng points (Haversine formula)
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 3959 // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

// Calculate transport carbon (distance × weight × emission factor)
export function calculateTransportCarbon(
    distanceMiles: number,
    weightTons: number
): number {
    const EMISSION_FACTOR = 0.35 // kg CO2 per ton-mile (truck transport)
    return distanceMiles * weightTons * EMISSION_FACTOR
}

// Determine tier based on verification, premium status, and distance
export function calculateTier(
    isVerified: boolean,
    isPremium: boolean,
    distanceMiles: number
): number {
    const isLocal = distanceMiles <= 100

    if (!isVerified) return 4 // Tier 4: Unverified (bottom)
    if (isPremium && isLocal) return 1 // Tier 1: Verified + Premium + Local
    if (isPremium || isLocal) return 2 // Tier 2: Verified + (Premium OR Local)
    return 3 // Tier 3: Verified only
}
