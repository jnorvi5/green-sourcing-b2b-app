import { describe, it, expect, jest } from '@jest/globals';

// Mock Dependencies - must be before imports
jest.mock('@/lib/email/resend-client', () => ({
  sendEmail: jest.fn(() => Promise.resolve({ success: true, messageId: '123' })),
  sendBatchEmails: jest.fn(() => Promise.resolve([
    { success: true, messageId: '123-1' },
    { success: true, messageId: '123-2' }
  ])),
}));

describe('Webhook Test', () => {
  it('should process webhook without crashing', async () => {
    // Import after mocks are set
    const { POST } = await import('../route');
    
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        type: 'INSERT',
        table: 'users',
        schema: 'auth',
        record: { 
          id: '123e4567-e89b-12d3-a456-426614174000', 
          email: 'test@example.com', 
          raw_user_meta_data: { role: 'supplier' } 
        }
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
