export * from './schema';

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
