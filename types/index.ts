export interface Product {
    id: string
    name: string
    category: string
    epd_data?: any
    description?: string
}

export interface Supplier {
    id: string
    name: string
    location: string
    lat: number
    lng: number
    verification_status: 'verified' | 'unverified'
    certifications?: string[]
    description?: string
    products: Product[]
    distance_miles?: number
    transport_carbon_kg?: number
    embodied_carbon_kg?: number
    total_carbon_kg?: number
    tier?: number
    match_score?: number
    is_verified?: boolean
    is_premium?: boolean
}

export interface RFQ {
    id: string
    architect_id: string
    materials: string[]
    budget: number
    timeline: string
    job_site_location: string
    job_site_lat: number
    job_site_lng: number
    material_weight_tons?: number
}
