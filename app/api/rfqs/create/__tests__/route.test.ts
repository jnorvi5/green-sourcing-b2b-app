import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/email/resend', () => ({
  sendRfqNotificationEmail: jest.fn().mockResolvedValue({ success: true }),
}));

describe('POST /api/rfqs/create', () => {
  let mockSupabase: any;
  let mockRfqInsert: jest.Mock;
  let mockProductsSelect: jest.Mock;
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  const mockRfqId = 'test-rfq-id';

  beforeEach(() => {
    jest.clearAllMocks();

    mockRfqInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: mockRfqId },
          error: null
        })
      })
    });

    mockProductsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
        })
    });

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
                  data: { role: 'architect', first_name: 'Test', last_name: 'User', company_name: 'Test Co' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'rfqs') {
          return {
            insert: mockRfqInsert,
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis()
          };
        }
        if (table === 'products') {
            return {
                select: mockProductsSelect
            }
        }
        if (table === 'rfq_matches') {
            return {
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { id: 'match-id' }, error: null })
                    })
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({})
                })
            }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: {}, error: null }),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        };
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should create RFQ successfully with valid data', async () => {
    const validRfq = {
      project_name: 'Test Project',
      project_location: 'New York, NY',
      material_specs: {
        material_type: 'insulation',
        quantity: 1000,
        unit: 'sqft',
      },
      budget_range: '$10k-50k',
      delivery_deadline: '2023-12-31T00:00:00.000Z',
      message: 'Need urgent quote',
    };

    const request = new NextRequest('http://localhost:3000/api/rfqs/create', {
      method: 'POST',
      body: JSON.stringify(validRfq),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.rfq_id).toBe(mockRfqId);
  });

  it('should return 400 for invalid data', async () => {
    const invalidRfq = {
      project_name: '', // Empty name
    };

    const request = new NextRequest('http://localhost:3000/api/rfqs/create', {
      method: 'POST',
      body: JSON.stringify(invalidRfq),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 403 if user is not architect', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'supplier' }, // Not architect
                  error: null
                })
              })
            })
          };
        }
        return { select: jest.fn() };
      });

    const validRfq = {
      project_name: 'Test Project',
      project_location: 'New York, NY',
      material_specs: { material_type: 'insulation' },
    };

    const request = new NextRequest('http://localhost:3000/api/rfqs/create', {
      method: 'POST',
      body: JSON.stringify(validRfq),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
