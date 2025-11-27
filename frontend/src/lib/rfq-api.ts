/**
 * RFQ (Request for Quote) API Client
 *
 * Connects frontend to MongoDB-backed /api/rfq endpoints
 */

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * RFQ type matching MongoDB schema
 */
export interface MongoRFQ {
  _id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany?: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unit: string;
  message?: string;
  deliveryLocation?: string;
  deliveryDate?: string;
  status: 'pending' | 'responded' | 'accepted' | 'declined' | 'expired';
  response?: {
    message: string;
    quotedPrice?: number;
    leadTime?: number;
    respondedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * API Response types
 */
interface RFQsResponse {
  success: boolean;
  data: MongoRFQ[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}

interface SingleRFQResponse {
  success: boolean;
  data: MongoRFQ;
  error?: string;
}

/**
 * Filter options for RFQ queries
 */
export interface RFQFilters {
  buyerId?: string;
  supplierId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch RFQs from MongoDB API with filters
 */
export async function fetchRFQs(filters: RFQFilters = {}): Promise<RFQsResponse> {
  const params = new URLSearchParams();

  if (filters.buyerId) {
    params.set('buyerId', filters.buyerId);
  }
  if (filters.supplierId) {
    params.set('supplierId', filters.supplierId);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.limit) {
    params.set('limit', filters.limit.toString());
  }
  if (filters.offset) {
    params.set('offset', filters.offset.toString());
  }

  const url = `${API_BASE}/api/rfq?${params.toString()}`;

  try {
    const token = localStorage.getItem('greenchainz-token');
    
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch RFQs:', error);
    return {
      success: false,
      data: [],
      pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a new RFQ
 */
export interface CreateRFQData {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany?: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unit?: string;
  message?: string;
  deliveryLocation?: string;
  deliveryDate?: string;
}

export async function createRFQ(data: CreateRFQData): Promise<SingleRFQResponse> {
  const url = `${API_BASE}/api/rfq`;

  try {
    const token = localStorage.getItem('greenchainz-token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create RFQ:', error);
    return {
      success: false,
      data: {} as MongoRFQ,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Respond to an RFQ (for suppliers)
 */
export interface RFQResponseData {
  message: string;
  quotedPrice?: number;
  leadTime?: number;
}

export async function respondToRFQ(rfqId: string, response: RFQResponseData): Promise<SingleRFQResponse> {
  const url = `${API_BASE}/api/rfq/${rfqId}/respond`;

  try {
    const token = localStorage.getItem('greenchainz-token');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(response),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `API error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to respond to RFQ:', error);
    return {
      success: false,
      data: {} as MongoRFQ,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Accept or decline an RFQ response (for buyers)
 */
export async function updateRFQStatus(rfqId: string, status: 'accepted' | 'declined'): Promise<SingleRFQResponse> {
  const url = `${API_BASE}/api/rfq/${rfqId}/status`;

  try {
    const token = localStorage.getItem('greenchainz-token');

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update RFQ status:', error);
    return {
      success: false,
      data: {} as MongoRFQ,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get status display info
 */
export function getRFQStatusInfo(status: MongoRFQ['status']) {
  const statusMap = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    responded: { label: 'Quoted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    declined: { label: 'Declined', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
  };
  return statusMap[status] || statusMap.pending;
}
