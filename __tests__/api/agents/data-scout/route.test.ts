
import { POST } from '../../../../app/api/agents/data-scout/route';
import { NextRequest } from 'next/server';

// Mock the environment variables
process.env.EPD_INTERNATIONAL_API_KEY = 'test-key';

// Mock the global fetch
global.fetch = jest.fn();

describe('POST /api/agents/data-scout', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    process.env.EPD_INTERNATIONAL_API_KEY = 'test-key';
  });

  it('should fetch data from EPD International API when key is present', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{
          product: { name: 'Test Product' },
          manufacturer: { name: 'Test Manufacturer' },
          registrationNumber: 'S-P-12345',
          indicators: { gwp: { a1a3: 100 } },
          publicationDate: '2023-01-01',
          validUntil: '2028-01-01',
          url: 'http://example.com/epd.pdf'
        }]
      })
    });

    const request = new NextRequest('http://localhost:3000/api/agents/data-scout', {
      method: 'POST',
      body: JSON.stringify({ productName: 'Test Product' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.source).toBe('epd_international_api');
    expect(body.data.productName).toBe('Test Product');
    expect(body.data.gwpFossilA1A3).toBe(100);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://epd-apim.azure-api.net/api/v1/epds'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Ocp-Apim-Subscription-Key': 'test-key'
        })
      })
    );
  });

  it('should fallback to mock data if API key is missing', async () => {
    delete process.env.EPD_INTERNATIONAL_API_KEY;

    const request = new NextRequest('http://localhost:3000/api/agents/data-scout', {
      method: 'POST',
      body: JSON.stringify({ productName: 'Fallback Product' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.source).toBe('mock');
    expect(body.data.productName).toBe('Fallback Product');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fallback to mock data if API call fails', async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const request = new NextRequest('http://localhost:3000/api/agents/data-scout', {
      method: 'POST',
      body: JSON.stringify({ productName: 'Fail Product' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.source).toBe('mock'); // Should fallback
    expect(global.fetch).toHaveBeenCalled();
  });
});
