export interface Product {
    id: string;
    name: string;
    description: string;
    material_type: string;
    category: string;
    unit_price: number;
    currency: string;
    sustainability_data: {
        gwp_fossil?: number;
        certifications?: string[];
        recycled_content?: number;
        renewable?: boolean;
    };
}

export interface FilterState {
    material_type?: string[];
    certifications?: string[];
    recycled_content_pct?: number;
}

export interface RFQ {
    product_id: string;
    supplier_id: string;
    buyer_id: string;
    quantity: number;
    message: string;
}
