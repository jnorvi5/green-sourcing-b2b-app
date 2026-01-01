import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// 1. MOCK COOKIES (The "Ketch" fix)
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn(),
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

// 2. MOCK SUPABASE
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user', email: 'test@example.com' } }, 
        error: null 
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { role: 'architect' }, error: null }),
      insert: jest.fn().mockResolvedValue({ data: { id: '123' }, error: null })
    }))
  }))
}));

describe('RFQ API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET should return 200/Success (Mock Mode)', async () => {
    // Import after mocks are set up
    const { GET } = await import('../route');
    
    const req = new Request('http://localhost/api/rfqs', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('POST should return 201/Success (Mock Mode)', async () => {
    // Import after mocks are set up
    const { POST } = await import('../route');
    
    const req = new Request('http://localhost/api/rfqs', { 
      method: 'POST',
      body: JSON.stringify({ project_name: "Test Project" })
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});



