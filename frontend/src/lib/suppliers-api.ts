/**
 * Suppliers API Client
 *
 * Connects frontend to MongoDB-backed /api/suppliers endpoints
 */

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Supplier type matching MongoDB schema
 */
export interface MongoSupplier {
    _id: string;
    userId: string;
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    website?: string;
    description?: string;
    logo?: string;
    coverImage?: string;
    location: {
        address?: string;
        city?: string;
        state?: string;
        country: string;
        zipCode?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    categories: string[];
    certifications: string[];
    sustainabilityScore?: number;
    verified: boolean;
    featured: boolean;
    rating: {
        average: number;
        count: number;
    };
    metrics: {
        totalProducts: number;
        totalRFQs: number;
        responseRate: number;
        avgResponseTime: number;
    };
    socialLinks?: {
        linkedin?: string;
        twitter?: string;
    };
    createdAt: string;
    updatedAt: string;
}

/**
 * API Response types
 */
interface SuppliersResponse {
    success: boolean;
    data: MongoSupplier[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    error?: string;
}

interface SingleSupplierResponse {
    success: boolean;
    data: MongoSupplier;
    products?: Array<{
        _id: string;
        title: string;
        price: number;
        images: string[];
        category: string;
        sustainabilityScore?: number;
    }>;
    error?: string;
}

/**
 * Filter options for supplier search
 */
export interface SupplierFilters {
    search?: string;
    category?: string;
    country?: string;
    verified?: boolean;
    featured?: boolean;
    certifications?: string[];
    minRating?: number;
    lat?: number;
    lng?: number;
    radius?: number; // km
    limit?: number;
    offset?: number;
}

/**
 * Fetch suppliers from MongoDB API with filters
 */
export async function fetchSuppliers(filters: SupplierFilters = {}): Promise<SuppliersResponse> {
    const params = new URLSearchParams();

    if (filters.search) {
        params.set('search', filters.search);
    }
    if (filters.category) {
        params.set('category', filters.category);
    }
    if (filters.country) {
        params.set('country', filters.country);
    }
    if (filters.verified !== undefined) {
        params.set('verified', filters.verified.toString());
    }
    if (filters.featured !== undefined) {
        params.set('featured', filters.featured.toString());
    }
    if (filters.certifications && filters.certifications.length > 0) {
        params.set('certifications', filters.certifications.join(','));
    }
    if (filters.minRating !== undefined) {
        params.set('minRating', filters.minRating.toString());
    }
    if (filters.lat !== undefined && filters.lng !== undefined) {
        params.set('lat', filters.lat.toString());
        params.set('lng', filters.lng.toString());
        if (filters.radius) {
            params.set('radius', filters.radius.toString());
        }
    }
    if (filters.limit) {
        params.set('limit', filters.limit.toString());
    }
    if (filters.offset) {
        params.set('offset', filters.offset.toString());
    }

    const url = `${API_BASE}/api/suppliers?${params.toString()}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch suppliers:', error);
        return {
            success: false,
            data: [],
            pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Fetch single supplier by ID with optional products
 */
export async function fetchSupplier(id: string, includeProducts = false): Promise<SingleSupplierResponse> {
    const params = includeProducts ? '?includeProducts=true' : '';
    const url = `${API_BASE}/api/suppliers/${id}${params}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch supplier:', error);
        return {
            success: false,
            data: {} as MongoSupplier,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get supplier by user ID (for dashboard)
 */
export async function fetchSupplierByUserId(userId: string): Promise<SingleSupplierResponse> {
    const url = `${API_BASE}/api/suppliers?userId=${userId}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok || !result.success || result.data.length === 0) {
            return {
                success: false,
                data: {} as MongoSupplier,
                error: 'Supplier not found',
            };
        }

        return {
            success: true,
            data: result.data[0],
        };
    } catch (error) {
        console.error('Failed to fetch supplier by user ID:', error);
        return {
            success: false,
            data: {} as MongoSupplier,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Create or update supplier profile
 */
export async function upsertSupplier(supplier: Partial<MongoSupplier>): Promise<SingleSupplierResponse> {
    const url = `${API_BASE}/api/suppliers`;

    try {
        const token = localStorage.getItem('greenchainz-token');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify(supplier),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to save supplier:', error);
        return {
            success: false,
            data: {} as MongoSupplier,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Format location for display
 */
export function formatLocation(location: MongoSupplier['location']): string {
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.join(', ') || 'Location not specified';
}

/**
 * Format rating stars
 */
export function formatRating(rating: MongoSupplier['rating']): string {
    if (rating.count === 0) return 'No reviews yet';
    return `${rating.average.toFixed(1)} ⭐ (${rating.count} reviews)`;
}
