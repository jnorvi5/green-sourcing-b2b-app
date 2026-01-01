import { describe, it, expect, jest } from '@jest/globals';

// Mock next/headers to prevent cookies error
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: { 
      getUser: jest.fn(async () => ({ 
        data: { user: { id: 'admin-123' } }, 
        error: null 
      })) 
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ 
        eq: jest.fn(() => ({ 
          single: jest.fn(async () => ({ 
            data: { role: 'admin' }, 
            error: null 
          })) 
        })) 
      }))
    }))
  }))
}));

describe('EPD Sync Route', () => {
  it('should return 200 Mock Success if API key is missing', async () => {
    delete process.env.EPD_INTERNATIONAL_API_KEY;
    
    // Import after mocks are set up
    const { POST } = await import('../route');
    
    const req = new Request('http://localhost/api/admin/epd-sync', { method: 'POST' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Mock Mode');
  });
});
