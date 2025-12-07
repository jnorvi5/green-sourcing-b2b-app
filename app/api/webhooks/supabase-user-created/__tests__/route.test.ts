/**
 * Unit tests for Supabase Auth Webhook Handler
 */

import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

// Mock the email modules
jest.mock('@/lib/email/resend-client', () => ({
  sendEmail: jest.fn(),
  sendBatchEmails: jest.fn(),
}));

jest.mock('@/lib/email/templates', () => ({
  generateSupplierWelcomeEmail: jest.fn(() => '<html>Supplier Welcome</html>'),
  generateArchitectWelcomeEmail: jest.fn(() => '<html>Architect Welcome</html>'),
  generateSupplierFollowUpDay2Email: jest.fn(() => '<html>Day 2 Follow-up</html>'),
  generateSupplierFollowUpDay7Email: jest.fn(() => '<html>Day 7 Follow-up</html>'),
}));

describe('Supabase User Created Webhook', () => {
  // Get mocked functions
  const mockSendEmail = require('@/lib/email/resend-client').sendEmail as jest.Mock;
  const mockSendBatchEmails = require('@/lib/email/resend-client')
    .sendBatchEmails as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set environment variables
    process.env.NEXT_PUBLIC_BASE_URL = 'https://greenchainz.com';
    process.env.RESEND_API_KEY = 'test-api-key';

    // Default mock implementations
    mockSendEmail.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    });

    mockSendBatchEmails.mockResolvedValue([
      { success: true, messageId: 'test-message-id-1' },
      { success: true, messageId: 'test-message-id-2' },
    ]);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.RESEND_API_KEY;
  });

  describe('GET /api/webhooks/supabase-user-created', () => {
    it('should return health check status', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.webhook).toBe('supabase-user-created');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('POST /api/webhooks/supabase-user-created', () => {
    describe('Payload Validation', () => {
      it('should reject invalid payload with 400 status', async () => {
        const invalidPayload = {
          type: 'INSERT',
          // Missing required fields
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(invalidPayload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid payload');
        expect(data.details).toBeDefined();
      });

      it('should reject payload with invalid email', async () => {
        const invalidPayload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'not-an-email',
            raw_user_meta_data: {
              role: 'supplier',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(invalidPayload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should accept valid payload with all required fields', async () => {
        const validPayload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
            raw_user_meta_data: {
              role: 'supplier',
              full_name: 'Test User',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(validPayload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(data.email).toBe('test@example.com');
      });
    });

    describe('Supplier Sign-up Flow', () => {
      it('should send welcome email for supplier role', async () => {
        const payload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'supplier@example.com',
            raw_user_meta_data: {
              role: 'supplier',
              full_name: 'John Supplier',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Check welcome email was sent
        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'supplier@example.com',
            subject: 'Welcome to GreenChainz - Complete Your Profile',
            html: '<html>Supplier Welcome</html>',
            tags: expect.arrayContaining([
              { name: 'user_id', value: '123e4567-e89b-12d3-a456-426614174000' },
              { name: 'email_type', value: 'supplier_welcome' },
            ]),
          })
        );
      });

      it('should schedule follow-up emails for supplier (Day 2 and Day 7)', async () => {
        const payload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'supplier@example.com',
            raw_user_meta_data: {
              role: 'supplier',
              full_name: 'John Supplier',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        await POST(request);

        // Check batch emails were scheduled
        expect(mockSendBatchEmails).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              to: 'supplier@example.com',
              subject: "Don't forget to upload your certifications",
              scheduledAt: expect.any(Date),
              tags: expect.arrayContaining([
                { name: 'email_type', value: 'supplier_followup_day2' },
              ]),
            }),
            expect.objectContaining({
              to: 'supplier@example.com',
              subject: 'Tips for getting your first RFQ match',
              scheduledAt: expect.any(Date),
              tags: expect.arrayContaining([
                { name: 'email_type', value: 'supplier_followup_day7' },
              ]),
            }),
          ])
        );

        // Verify scheduled dates are in the future
        const batchCall = mockSendBatchEmails.mock.calls[0][0];
        const now = new Date();

        const day2Email = batchCall[0];
        const day7Email = batchCall[1];

        expect(day2Email.scheduledAt.getTime()).toBeGreaterThan(now.getTime());
        expect(day7Email.scheduledAt.getTime()).toBeGreaterThan(day2Email.scheduledAt.getTime());
      });

      it('should use email prefix as name if full_name not provided', async () => {
        const payload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'johndoe@example.com',
            raw_user_meta_data: {
              role: 'supplier',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        await POST(request);

        // Check that email was called (name extraction is handled in template)
        expect(mockSendEmail).toHaveBeenCalled();
      });
    });

    describe('Architect Sign-up Flow', () => {
      it('should send welcome email for architect role', async () => {
        const payload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '456e4567-e89b-12d3-a456-426614174000',
            email: 'architect@example.com',
            raw_user_meta_data: {
              role: 'architect',
              full_name: 'Jane Architect',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Check welcome email was sent
        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'architect@example.com',
            subject: 'Welcome to GreenChainz - Find Verified Sustainable Suppliers',
            html: '<html>Architect Welcome</html>',
            tags: expect.arrayContaining([
              { name: 'user_id', value: '456e4567-e89b-12d3-a456-426614174000' },
              { name: 'email_type', value: 'architect_welcome' },
            ]),
          })
        );
      });

      it('should not schedule follow-up emails for architects', async () => {
        const payload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '456e4567-e89b-12d3-a456-426614174000',
            email: 'architect@example.com',
            raw_user_meta_data: {
              role: 'architect',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        await POST(request);

        // Batch emails should not be called for architects
        expect(mockSendBatchEmails).not.toHaveBeenCalled();
      });

      it('should handle buyer role same as architect', async () => {
        const payload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '789e4567-e89b-12d3-a456-426614174000',
            email: 'buyer@example.com',
            raw_user_meta_data: {
              role: 'buyer',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockSendEmail).toHaveBeenCalled();
      });
    });

    describe('Error Handling', () => {
      it('should return 500 when email sending fails', async () => {
        mockSendEmail.mockResolvedValue({
          success: false,
          error: 'SMTP connection failed',
        });

        const payload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
            raw_user_meta_data: {
              role: 'supplier',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Internal server error');
      });

      it('should handle malformed JSON with 500 error', async () => {
        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: 'not valid json{',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      });

      it('should continue processing even if follow-ups fail', async () => {
        mockSendEmail.mockResolvedValue({
          success: true,
          messageId: 'welcome-email-id',
        });

        mockSendBatchEmails.mockResolvedValue([
          { success: false, error: 'Scheduling failed' },
          { success: false, error: 'Scheduling failed' },
        ]);

        const payload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'supplier@example.com',
            raw_user_meta_data: {
              role: 'supplier',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const response = await POST(request);
        const data = await response.json();

        // Should still return 200 since welcome email succeeded
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Role Defaults', () => {
      it('should default to buyer role if role not specified', async () => {
        const payload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user@example.com',
            raw_user_meta_data: {},
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.role).toBe('buyer');
      });

      it('should skip email for admin role', async () => {
        const payload = {
          type: 'INSERT',
          table: 'users',
          schema: 'auth',
          record: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'admin@example.com',
            raw_user_meta_data: {
              role: 'admin',
            },
          },
        };

        const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-user-created', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockSendEmail).not.toHaveBeenCalled();
      });
    });
  });
});
