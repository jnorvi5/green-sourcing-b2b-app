import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('POST /api/rfqs/[id]/quote', () => {
  let mockSupabase: any;
  const mockUser = { id: 'test-supplier-user-id', email: 'supplier@example.com' };
  const mockSupplierId = 'test-supplier-id';
  const mockRfqId = 'test-rfq-id';
  const mockQuoteId = 'test-quote-id';

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'supplier' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'rfqs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: mockRfqId, status: 'pending' },
                  error: null
                })
              })
            }),
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null })
            })
          };
        }
        if (table === 'suppliers') {
            return {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: mockSupplierId },
                            error: null
                        })
                    })
                })
            }
        }
        if (table === 'rfq_responses') {
            return {
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: mockQuoteId, status: 'submitted' },
                            error: null
                        })
                    })
                })
            }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: {}, error: null }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
          update: jest.fn().mockResolvedValue({ error: null }),
        };
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should submit quote successfully', async () => {
    const validQuote = {
      price: 5000,
      lead_time: 14,
      message: 'Here is our quote',
    };

    const request = new NextRequest(`http://localhost:3000/api/rfqs/${mockRfqId}/quote`, {
      method: 'POST',
      body: JSON.stringify(validQuote),
    });

    const response = await POST(request, { params: Promise.resolve({ id: mockRfqId }) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.quote_id).toBe(mockQuoteId);
  });
});
