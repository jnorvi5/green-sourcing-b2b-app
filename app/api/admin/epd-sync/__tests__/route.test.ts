import { POST } from '../route';
import { describe, it, expect, jest } from '@jest/globals';

// Mock Supabase to bypass Auth (simulate Admin)
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: () => ({ data: { user: { id: 'admin' } }, error: null }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: { role: 'admin' } }) }) })
    })
  })
}));

describe('EPD Sync Route', () => {
  it('should return 200 Mock Success if API key is missing', async () => {
    delete process.env.EPD_INTERNATIONAL_API_KEY;
    
    const req = new Request('http://localhost/api/admin/epd-sync', { method: 'POST' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Mock Mode');
  });
});
