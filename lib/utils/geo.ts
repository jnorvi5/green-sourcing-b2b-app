/**
 * Calculates the distance between two points in miles using the Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

/**
 * Calculates transport emissions based on weight and distance
 * Average: 0.161 kg CO2e per ton-mile for heavy trucks
 */
export function calculateTransportCarbon(weightKg: number, distanceMiles: number): number {
    const weightTons = weightKg / 907.185; // kg to US tons
    return parseFloat((weightTons * distanceMiles * 0.161).toFixed(2));
}
