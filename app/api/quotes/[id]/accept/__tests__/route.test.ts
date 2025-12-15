import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('POST /api/quotes/[id]/accept', () => {
  let mockSupabase: any;
  const mockUser = { id: 'test-architect-id' };
  const mockQuoteId = 'test-quote-id';
  const mockRfqId = 'test-rfq-id';

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn((table) => {
        if (table === 'rfq_responses') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: mockQuoteId,
                    rfq_id: mockRfqId,
                    status: 'submitted',
                    rfqs: {
                        id: mockRfqId,
                        architect_id: mockUser.id, // Matching architect
                        status: 'responded'
                    }
                  },
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        }
        if (table === 'rfqs') {
            return {
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
        };
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should accept quote successfully', async () => {
    const request = new NextRequest(`http://localhost:3000/api/quotes/${mockQuoteId}/accept`, {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ id: mockQuoteId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
