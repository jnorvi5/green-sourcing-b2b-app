/**
 * Tests for EPD sync API route
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EPDInternationalClient } from '@/lib/integrations/epd-international';

// Mock dependencies
jest.mock('@/lib/supabase/server');

// Mock only the EPDInternationalClient class, not the entire module
// This allows normalizeEPD to work correctly
jest.mock('@/lib/integrations/epd-international', () => {
  const actual = jest.requireActual('@/lib/integrations/epd-international');
  return {
    ...actual,
    EPDInternationalClient: jest.fn(),
  };
});

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const MockEPDInternationalClient = EPDInternationalClient as jest.MockedClass<typeof EPDInternationalClient>;

describe('POST /api/admin/epd-sync', () => {
  let mockSupabase: {
    auth: {
      getUser: jest.Mock;
    };
    from: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Supabase mock
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    
    mockCreateClient.mockResolvedValue(mockSupabase as never);
    
    // Set environment variable
    process.env.EPD_INTERNATIONAL_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.EPD_INTERNATIONAL_API_KEY;
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest('http://localhost:3000/api/admin/epd-sync', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 403 if user is not an admin', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@example.com' } },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'architect' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as never);
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const request = new NextRequest('http://localhost:3000/api/admin/epd-sync', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
    });
  });

  describe('API Key Configuration', () => {
    it('should return 500 if API key is not configured', async () => {
      delete process.env.EPD_INTERNATIONAL_API_KEY;

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as never);
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const request = new NextRequest('http://localhost:3000/api/admin/epd-sync', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('EPD API key not configured');
    });
  });

  describe('Limit Parameter', () => {
    it('should accept valid limit parameter', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as never);
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      // Mock EPD client
      const mockFetchAllEPDs = jest.fn().mockResolvedValue([]);
      MockEPDInternationalClient.mockImplementation(() => ({
        fetchAllEPDs: mockFetchAllEPDs,
      } as never));

      const request = new NextRequest('http://localhost:3000/api/admin/epd-sync?limit=10', {
        method: 'POST',
      });

      const response = await POST(request);
      
      expect(mockFetchAllEPDs).toHaveBeenCalledWith({ limit: 10 });
      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid limit parameter', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      } as never);
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const request = new NextRequest('http://localhost:3000/api/admin/epd-sync?limit=-5', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid limit parameter');
    });
  });

  describe('EPD Sync', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@example.com' } },
        error: null,
      });

      const mockUsersQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return mockUsersQuery as never;
        }
        return {} as never;
      });
    });

    it('should handle empty EPD response', async () => {
      const mockFetchAllEPDs = jest.fn().mockResolvedValue([]);
      MockEPDInternationalClient.mockImplementation(() => ({
        fetchAllEPDs: mockFetchAllEPDs,
      } as never));

      const request = new NextRequest('http://localhost:3000/api/admin/epd-sync', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_fetched).toBe(0);
      expect(data.new_inserts).toBe(0);
      expect(data.updates).toBe(0);
      expect(data.errors).toContain('No EPDs fetched from API');
    });

    it('should insert new EPDs', async () => {
      // Complete mock EPD data with all required fields for normalization
      const mockEPDs = [
        {
          epd_number: 'EPD-001',
          product_name: 'Test Product',
          name: 'Test Product',
          manufacturer: 'Test Manufacturer',
          gwp_fossil_a1a3: 10.5,
          recycled_content_pct: 30,
          certifications: ['ISO 14025'],
          valid_from: '2024-01-01',
          valid_until: '2029-12-31',
          declared_unit: '1 kg',
          pcr_reference: 'EN 15804',
        },
      ];

      const mockFetchAllEPDs = jest.fn().mockResolvedValue(mockEPDs);
      MockEPDInternationalClient.mockImplementation(() => ({
        fetchAllEPDs: mockFetchAllEPDs,
      } as never));

      const mockEpdDatabaseQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: jest.fn().mockResolvedValue({
          data: { id: 'new-id' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          } as never;
        }
        if (table === 'epd_database') {
          return mockEpdDatabaseQuery as never;
        }
        return {} as never;
      });

      const request = new NextRequest('http://localhost:3000/api/admin/epd-sync', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_fetched).toBe(1);
      expect(data.new_inserts).toBe(1);
      expect(data.updates).toBe(0);
      expect(mockEpdDatabaseQuery.insert).toHaveBeenCalled();
    });

    it('should update existing EPDs when data changes', async () => {
      const mockEPDs = [
        {
          epd_number: 'EPD-001',
          product_name: 'Test Product Updated',
          name: 'Test Product Updated',
          manufacturer: 'Test Manufacturer',
          gwp_fossil_a1a3: 12.5, // Changed
          recycled_content_pct: 35, // Changed
          certifications: ['ISO 14025', 'ISO 14040'], // Changed
          valid_from: '2024-01-01',
          valid_until: '2029-12-31',
        },
      ];

      const mockFetchAllEPDs = jest.fn().mockResolvedValue(mockEPDs);
      MockEPDInternationalClient.mockImplementation(() => ({
        fetchAllEPDs: mockFetchAllEPDs,
      } as never));

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({
        data: { id: 'existing-id' },
        error: null,
      });

      const mockEpdDatabaseQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: 'existing-id',
            gwp_fossil_a1a3: 10.5,
            recycled_content_pct: 30,
            certifications: ['ISO 14025'],
          },
          error: null,
        }),
        update: mockUpdate,
      };

      mockUpdate.mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          } as never;
        }
        if (table === 'epd_database') {
          return mockEpdDatabaseQuery as never;
        }
        return {} as never;
      });

      const request = new NextRequest('http://localhost:3000/api/admin/epd-sync', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_fetched).toBe(1);
      expect(data.new_inserts).toBe(0);
      expect(data.updates).toBe(1);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should not update EPDs when data has not changed', async () => {
      const mockEPDs = [
        {
          epd_number: 'EPD-001',
          product_name: 'Test Product',
          name: 'Test Product',
          manufacturer: 'Test Manufacturer',
          gwp_fossil_a1a3: 10.5,
          recycled_content_pct: 30,
          certifications: ['ISO 14025'],
          valid_from: '2024-01-01',
          valid_until: '2029-12-31',
        },
      ];

      const mockFetchAllEPDs = jest.fn().mockResolvedValue(mockEPDs);
      MockEPDInternationalClient.mockImplementation(() => ({
        fetchAllEPDs: mockFetchAllEPDs,
      } as never));

      const mockUpdate = jest.fn();

      const mockEpdDatabaseQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: 'existing-id',
            gwp_fossil_a1a3: 10.5,
            recycled_content_pct: 30,
            certifications: ['ISO 14025'],
          },
          error: null,
        }),
        update: mockUpdate,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          } as never;
        }
        if (table === 'epd_database') {
          return mockEpdDatabaseQuery as never;
        }
        return {} as never;
      });

      const request = new NextRequest('http://localhost:3000/api/admin/epd-sync', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_fetched).toBe(1);
      expect(data.new_inserts).toBe(0);
      expect(data.updates).toBe(0);
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
