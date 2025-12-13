
export interface Product {
  id: string;
  supplier_id: string;
  name: string; // Changed from product_name to match DB schema usually, but I'll support both via mapping
  description: string | null;
  material_type: string;
  application: string | null;
  certifications: string[] | null;
  sustainability_data: {
    gwp?: number;
    recycled_content?: number;
  } | null;
  specs: any;
  images: string[] | null;
  epd_url: string | null;
  verified: boolean;
  views_count?: number; // For analytics
  clicks_count?: number;
  rfq_count?: number;
}
