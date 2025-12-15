import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GET /api/rfqs/[id]/status', () => {
  let mockSupabase: any;
  const mockUser = { id: 'test-architect-id' };
  const mockRfqId = 'test-rfq-id';

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: jest.fn((table) => {
        if (table === 'rfqs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: mockRfqId,
                    status: 'pending',
                    project_name: 'Test Project',
                    created_at: '2023-01-01',
                    architect_id: mockUser.id
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'rfq_responses') {
            return {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        count: 5,
                        data: null,
                        error: null
                    })
                })
            }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
        };
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return RFQ status for architect', async () => {
    const request = new NextRequest(`http://localhost:3000/api/rfqs/${mockRfqId}/status`, {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ id: mockRfqId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('pending');
    expect(data.quote_count).toBe(5);
    expect(data.user_role).toBe('architect');
  });
});
