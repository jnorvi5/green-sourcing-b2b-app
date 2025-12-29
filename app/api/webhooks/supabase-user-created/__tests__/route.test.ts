import { POST } from '../route';
import { describe, it, expect, jest } from '@jest/globals';

// Mock Dependencies
jest.mock('@/lib/email/resend-client', () => ({
  sendEmail: jest.fn(() => Promise.resolve({ success: true, messageId: '123' })),
}));
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ data: [], error: null }), insert: () => ({ error: null }) })
  })
}));

describe('Webhook Test', () => {
  it('should process webhook without crashing', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        type: 'INSERT',
        table: 'users',
        record: { id: '123', email: 'test@example.com', raw_user_meta_data: { role: 'supplier' } }
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
