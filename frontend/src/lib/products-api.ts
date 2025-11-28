/**
 * Products API Client
 * 
 * Connects frontend to MongoDB-backed /api/products endpoints
 */

// API base URL - uses Next.js API routes in production, local dev server otherwise
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Product type matching MongoDB schema
 */
export interface MongoProduct {
    _id: string;
    title: string;
    description: string;
    price: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
    supplierId: string;
    supplierName?: string;
    category: string;
    subcategory?: string;
    images: string[];
    certificates: string[];
    status: 'draft' | 'active' | 'archived';
    minOrderQuantity: number;
    unitOfMeasure: string;
    leadTimeDays?: number;
    tags: string[];
    greenData?: {
        epdId?: string;
        carbonFootprint?: number;
        recycledContent?: number;
        renewableEnergy?: number;
        waterUsage?: number;
        certifications?: string[];
        lifecycleStage?: string;
    };
    sustainabilityScore?: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * API Response types
 */
interface ProductsResponse {
    success: boolean;
    data: MongoProduct[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    error?: string;
}

interface SingleProductResponse {
    success: boolean;
    data: MongoProduct;
    autodeskCarbon?: {
        id: string;
        gwp: number;
        source: string;
        last_updated: string;
    };
    error?: string;
}

/**
 * Filter options for product search
 */
export interface ProductFilters {
    search?: string;
    category?: string;
    status?: string;
    supplierId?: string;
    minPrice?: number;
    maxPrice?: number;
    certifications?: string[];
    minRecycled?: number;
    maxCarbon?: number;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

/**
 * Fetch products from MongoDB API with filters
 */
export async function fetchProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();

    if (filters.search && filters.search.length >= 2) {
        params.set('search', filters.search);
    }
    if (filters.category) {
        params.set('category', filters.category);
    }
    if (filters.status) {
        params.set('status', filters.status);
    }
    if (filters.supplierId) {
        params.set('supplierId', filters.supplierId);
    }
    if (filters.minPrice !== undefined) {
        params.set('minPrice', filters.minPrice.toString());
    }
    if (filters.maxPrice !== undefined) {
        params.set('maxPrice', filters.maxPrice.toString());
    }
    if (filters.certifications && filters.certifications.length > 0) {
        params.set('certifications', filters.certifications.join(','));
    }
    if (filters.minRecycled !== undefined) {
        params.set('minRecycled', filters.minRecycled.toString());
    }
    if (filters.maxCarbon !== undefined) {
        params.set('maxCarbon', filters.maxCarbon.toString());
    }
    if (filters.limit) {
        params.set('limit', filters.limit.toString());
    }
    if (filters.offset) {
        params.set('offset', filters.offset.toString());
    }
    if (filters.sort) {
        params.set('sort', filters.sort);
    }
    if (filters.order) {
        params.set('order', filters.order);
    }

    const url = `${API_BASE}/api/products?${params.toString()}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return {
            success: false,
            data: [],
            pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Fetch single product by ID
 */
export async function fetchProduct(id: string, enrichCarbon = false): Promise<SingleProductResponse> {
    const params = enrichCarbon ? '?enrichCarbon=true' : '';
    const url = `${API_BASE}/api/products/${id}${params}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch product:', error);
        return {
            success: false,
            data: {} as MongoProduct,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Create a new product
 */
export async function createProduct(product: Partial<MongoProduct>): Promise<SingleProductResponse> {
    const url = `${API_BASE}/api/products`;

    try {
        const token = localStorage.getItem('greenchainz-token');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(product),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to create product:', error);
        return {
            success: false,
            data: {} as MongoProduct,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Update a product
 */
export async function updateProduct(id: string, updates: Partial<MongoProduct>): Promise<SingleProductResponse> {
    const url = `${API_BASE}/api/products/${id}`;

    try {
        const token = localStorage.getItem('greenchainz-token');

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to update product:', error);
        return {
            success: false,
            data: {} as MongoProduct,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Delete/archive a product
 */
export async function deleteProduct(id: string, hard = false): Promise<{ success: boolean; message?: string; error?: string }> {
    const params = hard ? '?hard=true' : '';
    const url = `${API_BASE}/api/products/${id}${params}`;

    try {
        const token = localStorage.getItem('greenchainz-token');

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to delete product:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Convert MongoDB product to frontend Product type for compatibility
 */
export function toFrontendProduct(mongoProduct: MongoProduct) {
    return {
        id: mongoProduct._id,
        supplier_id: mongoProduct.supplierId,
        name: mongoProduct.title,
        description: mongoProduct.description,
        image_url: mongoProduct.images?.[0],
        images: mongoProduct.images,
        certifications: mongoProduct.greenData?.certifications || mongoProduct.certificates,
        sustainability_data: {
            gwp_fossil: mongoProduct.greenData?.carbonFootprint,
            recycled_content: mongoProduct.greenData?.recycledContent,
        },
        gwp: mongoProduct.greenData?.carbonFootprint,
        recycled_content_percent: mongoProduct.greenData?.recycledContent,
        status: mongoProduct.status === 'active' ? 'approved' : 'pending',
        created_at: mongoProduct.createdAt,
        // Additional fields
        price: mongoProduct.price,
        currency: mongoProduct.currency,
        category: mongoProduct.category,
        subcategory: mongoProduct.subcategory,
        supplierName: mongoProduct.supplierName,
        minOrderQuantity: mongoProduct.minOrderQuantity,
        unitOfMeasure: mongoProduct.unitOfMeasure,
        leadTimeDays: mongoProduct.leadTimeDays,
        tags: mongoProduct.tags,
        sustainabilityScore: mongoProduct.sustainabilityScore,
    };
}
