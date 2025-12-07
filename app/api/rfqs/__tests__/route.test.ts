/**
 * Unit tests for POST /api/rfqs route
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/email/resend', () => ({
  sendRfqNotificationEmail: jest.fn(),
}));

describe('POST /api/rfqs', () => {
  let mockAuth: jest.Mock;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockCreateClient: jest.Mock;
  let mockSendEmail: jest.Mock;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockRfqId = '223e4567-e89b-12d3-a456-426614174001';
  const mockSupplierId = '323e4567-e89b-12d3-a456-426614174002';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock email service
    const { sendRfqNotificationEmail } = require('@/lib/email/resend');
    mockSendEmail = sendRfqNotificationEmail as jest.Mock;
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'test-msg-id' });

    // Create mock chain for Supabase
    mockSingle = jest.fn();
    mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq, single: mockSingle });
    mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    });
    mockAuth = jest.fn();

    // Mock Supabase client
    const { createClient } = require('@/lib/supabase/server');
    mockCreateClient = createClient as jest.Mock;
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: mockAuth,
      },
      from: mockFrom,
    });

    // Set required environment variables
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3001';
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.RESEND_API_KEY;
  });

  describe('authentication and authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') });

      const request = new NextRequest('http://localhost:3001/api/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          project_name: 'Test Project',
          project_location: 'Seattle, WA',
          material_specs: { material_type: 'insulation' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 403 if user is not an architect', async () => {
      mockAuth.mockResolvedValue({ data: { user: { id: mockUserId } }, error: null });
      mockSingle.mockResolvedValueOnce({
        data: { role: 'supplier', first_name: 'John', last_name: 'Doe' },
        error: null,
      });

      const request = new NextRequest('http://localhost:3001/api/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          project_name: 'Test Project',
          project_location: 'Seattle, WA',
          material_specs: { material_type: 'insulation' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only architects can create RFQs');
    });
  });

  describe('validation', () => {
    it('should return 400 if project_name is missing', async () => {
      const request = new NextRequest('http://localhost:3001/api/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          project_location: 'Seattle, WA',
          material_specs: { material_type: 'insulation' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.project_name).toBeDefined();
    });

    it('should return 400 if material_type is invalid', async () => {
      const request = new NextRequest('http://localhost:3001/api/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          project_name: 'Test Project',
          project_location: 'Seattle, WA',
          material_specs: { material_type: 'invalid_type' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('RFQ creation', () => {
    it('should create RFQ successfully with valid data', async () => {
      mockAuth.mockResolvedValue({ data: { user: { id: mockUserId } }, error: null });
      
      // Mock profile fetch
      const mockProfileEq = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            role: 'architect',
            first_name: 'John',
            last_name: 'Doe',
            company_name: 'Acme Corp',
          },
          error: null,
        }),
      });
      
      // Mock RFQ insert
      const mockRfqSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: mockRfqId,
            project_name: 'Green Office Building',
            project_location: 'Seattle, WA',
            material_specs: { material_type: 'insulation', quantity: 5000, unit: 'sqft' },
            budget_range: '$50K-$75K',
            delivery_deadline: '2024-12-31',
            message: 'Need eco-friendly materials',
          },
          error: null,
        }),
      });
      
      const mockRfqInsert = jest.fn().mockReturnValue({
        select: mockRfqSelect,
      });
      
      // Mock products query (no matching suppliers)
      const mockProductsEq = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockProductsSelect = jest.fn().mockReturnValue({
        eq: mockProductsEq,
      });
      
      // Setup from() to return different mocks based on table name
      mockFrom
        .mockImplementationOnce((table) => {
          // First call: profiles
          if (table === 'profiles') {
            return { select: jest.fn().mockReturnValue({ eq: mockProfileEq }) };
          }
        })
        .mockImplementationOnce((table) => {
          // Second call: rfqs
          if (table === 'rfqs') {
            return { insert: mockRfqInsert };
          }
        })
        .mockImplementationOnce((table) => {
          // Third call: products
          if (table === 'products') {
            return { select: mockProductsSelect };
          }
        });

      const request = new NextRequest('http://localhost:3001/api/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          project_name: 'Green Office Building',
          project_location: 'Seattle, WA',
          material_specs: {
            material_type: 'insulation',
            quantity: 5000,
            unit: 'sqft',
          },
          budget_range: '$50K-$75K',
          delivery_deadline: '2024-12-31T00:00:00Z',
          message: 'Need eco-friendly materials',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.rfq_id).toBe(mockRfqId);
      expect(mockRfqInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          architect_id: mockUserId,
          project_name: 'Green Office Building',
          project_location: 'Seattle, WA',
          status: 'pending',
        })
      );
    });
  });
});
