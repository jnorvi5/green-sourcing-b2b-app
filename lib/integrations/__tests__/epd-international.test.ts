/**
 * Tests for EPD International API Client
 */

import { EPDInternationalClient, normalizeEPD } from '../epd-international';
import type { EPDApiResponse } from '@/lib/validations/epd-sync';

// Mock fetch
global.fetch = jest.fn();

describe('EPDInternationalClient', () => {
  let client: EPDInternationalClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new EPDInternationalClient({
      apiKey: 'test-api-key',
    });
  });

  describe('fetchEPDs', () => {
    it('should fetch EPDs with correct headers', async () => {
      const mockResponse = {
        data: [
          {
            uuid: 'test-uuid-1',
            name: 'Test Product 1',
            manufacturer: { name: 'Test Manufacturer' },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      await client.fetchEPDs({ page: 1, perPage: 50 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/epds?page=1&per_page=50'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should handle JSON response', async () => {
      const mockData = [
        {
          uuid: 'test-uuid-1',
          name: 'Test Product 1',
          manufacturer: { name: 'Test Manufacturer' },
          gwp_a1a3: 10.5,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ data: mockData }),
      });

      const result = await client.fetchEPDs();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.uuid).toBe('test-uuid-1');
    });

    it('should handle array response format', async () => {
      const mockData = [
        {
          uuid: 'test-uuid-1',
          name: 'Test Product 1',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockData,
      });

      const result = await client.fetchEPDs();

      expect(result.data).toHaveLength(1);
    });

    it('should handle pagination metadata', async () => {
      const mockResponse = {
        data: [{ uuid: 'test-uuid-1', name: 'Test Product 1' }],
        meta: {
          total: 100,
          page: 1,
          perPage: 50,
          totalPages: 2,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse,
      });

      const result = await client.fetchEPDs();

      expect(result.meta?.total).toBe(100);
      expect(result.meta?.totalPages).toBe(2);
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(client.fetchEPDs()).rejects.toThrow('EPD API error (500)');
    });

    it('should handle timeout', async () => {
      const shortTimeoutClient = new EPDInternationalClient({
        apiKey: 'test-api-key',
        timeout: 100,
      });

      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(shortTimeoutClient.fetchEPDs()).rejects.toThrow();
    });
  });

  describe('fetchAllEPDs', () => {
    it('should fetch multiple pages', async () => {
      const page1 = {
        data: Array.from({ length: 50 }, (_, i) => ({
          uuid: `uuid-${i}`,
          name: `Product ${i}`,
        })),
        meta: { totalPages: 2, page: 1 },
      };

      const page2 = {
        data: Array.from({ length: 30 }, (_, i) => ({
          uuid: `uuid-${i + 50}`,
          name: `Product ${i + 50}`,
        })),
        meta: { totalPages: 2, page: 2 },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => page1,
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => page2,
        });

      const result = await client.fetchAllEPDs();

      expect(result).toHaveLength(80);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should respect limit parameter', async () => {
      const mockData = Array.from({ length: 50 }, (_, i) => ({
        uuid: `uuid-${i}`,
        name: `Product ${i}`,
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ data: mockData }),
      });

      const result = await client.fetchAllEPDs({ limit: 10 });

      expect(result).toHaveLength(10);
    });

    it('should stop fetching when no more pages', async () => {
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        uuid: `uuid-${i}`,
        name: `Product ${i}`,
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ data: mockData }),
      });

      const result = await client.fetchAllEPDs({ perPage: 50 });

      expect(result).toHaveLength(30);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});

describe('normalizeEPD', () => {
  it('should normalize EPD with all fields', () => {
    const apiResponse: EPDApiResponse = {
      epd_number: 'EPD-001',
      product_name: 'Test Product',
      manufacturer: 'Test Manufacturer',
      gwp_fossil_a1a3: 10.5,
      recycled_content_pct: 30,
      certifications: ['ISO 14025'],
      valid_from: '2024-01-01',
      valid_until: '2029-12-31',
      declared_unit: '1 kg',
      pcr_reference: 'EN 15804',
      geographic_scope: ['Europe'],
    };

    const normalized = normalizeEPD(apiResponse);

    expect(normalized).not.toBeNull();
    expect(normalized?.epd_number).toBe('EPD-001');
    expect(normalized?.product_name).toBe('Test Product');
    expect(normalized?.manufacturer).toBe('Test Manufacturer');
    expect(normalized?.gwp_fossil_a1a3).toBe(10.5);
    expect(normalized?.recycled_content_pct).toBe(30);
    expect(normalized?.certifications).toEqual(['ISO 14025']);
    expect(normalized?.data_source).toBe('EPD International');
  });

  it('should handle different field name variations', () => {
    const apiResponse: EPDApiResponse = {
      registrationNumber: 'EPD-001',
      productName: 'Test Product',
      manufacturer: { name: 'Test Manufacturer' },
      gwpA1A3: 10.5,
      validFrom: '2024-01-01',
      validUntil: '2029-12-31',
    };

    const normalized = normalizeEPD(apiResponse);

    expect(normalized).not.toBeNull();
    expect(normalized?.epd_number).toBe('EPD-001');
    expect(normalized?.product_name).toBe('Test Product');
    expect(normalized?.manufacturer).toBe('Test Manufacturer');
    expect(normalized?.gwp_fossil_a1a3).toBe(10.5);
  });

  it('should handle nested GWP data', () => {
    const apiResponse: EPDApiResponse = {
      uuid: 'test-uuid',
      name: 'Test Product',
      manufacturer: 'Test Manufacturer',
      impacts: {
        gwp: {
          a1a3: 10.5,
        },
      },
      valid_from: '2024-01-01',
      valid_until: '2029-12-31',
    };

    const normalized = normalizeEPD(apiResponse);

    expect(normalized).not.toBeNull();
    expect(normalized?.gwp_fossil_a1a3).toBe(10.5);
  });

  it('should handle certification objects', () => {
    const apiResponse: EPDApiResponse = {
      epd_number: 'EPD-001',
      product_name: 'Test Product',
      manufacturer: 'Test Manufacturer',
      certifications: [
        { name: 'ISO 14025', level: 'Gold' },
        { name: 'ISO 14040' },
      ],
      valid_from: '2024-01-01',
      valid_until: '2029-12-31',
    };

    const normalized = normalizeEPD(apiResponse);

    expect(normalized).not.toBeNull();
    expect(normalized?.certifications).toEqual(['ISO 14025', 'ISO 14040']);
  });

  it('should return null if EPD number is missing', () => {
    const apiResponse: EPDApiResponse = {
      product_name: 'Test Product',
      manufacturer: 'Test Manufacturer',
      valid_from: '2024-01-01',
      valid_until: '2029-12-31',
    };

    const normalized = normalizeEPD(apiResponse);

    expect(normalized).toBeNull();
  });

  it('should return null if product name is missing', () => {
    const apiResponse: EPDApiResponse = {
      epd_number: 'EPD-001',
      manufacturer: 'Test Manufacturer',
      valid_from: '2024-01-01',
      valid_until: '2029-12-31',
    };

    const normalized = normalizeEPD(apiResponse);

    expect(normalized).toBeNull();
  });

  it('should return null if validity dates are missing', () => {
    const apiResponse: EPDApiResponse = {
      epd_number: 'EPD-001',
      product_name: 'Test Product',
      manufacturer: 'Test Manufacturer',
    };

    const normalized = normalizeEPD(apiResponse);

    expect(normalized).toBeNull();
  });

  it('should handle optional fields as null', () => {
    const apiResponse: EPDApiResponse = {
      epd_number: 'EPD-001',
      product_name: 'Test Product',
      manufacturer: 'Test Manufacturer',
      valid_from: '2024-01-01',
      valid_until: '2029-12-31',
    };

    const normalized = normalizeEPD(apiResponse);

    expect(normalized).not.toBeNull();
    expect(normalized?.gwp_fossil_a1a3).toBeNull();
    expect(normalized?.recycled_content_pct).toBeNull();
    expect(normalized?.declared_unit).toBeNull();
    expect(normalized?.pcr_reference).toBeNull();
    expect(normalized?.certifications).toEqual([]);
    expect(normalized?.geographic_scope).toEqual([]);
  });

  it('should convert string geographic scope to array', () => {
    const apiResponse: EPDApiResponse = {
      epd_number: 'EPD-001',
      product_name: 'Test Product',
      manufacturer: 'Test Manufacturer',
      geographic_scope: 'Europe',
      valid_from: '2024-01-01',
      valid_until: '2029-12-31',
    };

    const normalized = normalizeEPD(apiResponse);

    expect(normalized).not.toBeNull();
    expect(normalized?.geographic_scope).toEqual(['Europe']);
  });
});
