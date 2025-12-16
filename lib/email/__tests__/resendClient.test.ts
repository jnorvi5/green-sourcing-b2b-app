/**
 * Unit tests for Resend email client
 */

import { sendEmail, sendBulkEmail, scheduleEmail, __resetResendClient } from '../resendClient';
import type { SendEmailResult, SendBulkEmailResult } from '../resendClient';

// Mock Resend
jest.mock('resend', () => {
  const mockSend = jest.fn();
  const mockBatchSend = jest.fn();
  
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
      batch: {
        send: mockBatchSend,
      },
    })),
    __mockSend: mockSend,
    __mockBatchSend: mockBatchSend,
  };
});

describe('resendClient', () => {
  let mockSend: jest.Mock;
  let mockBatchSend: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Reset the singleton instance
    __resetResendClient();
    
    // Get mock functions
    const resendModule = await import('resend') as { __mockSend: jest.Mock; __mockBatchSend: jest.Mock };
    mockSend = resendModule.__mockSend;
    mockBatchSend = resendModule.__mockBatchSend;

    // Set required environment variable
    process.env.RESEND_API_KEY = 'test-resend-api-key';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    __resetResendClient();
  });

  describe('sendEmail', () => {
    describe('validation', () => {
      it('should reject invalid email address', async () => {
        const result = await sendEmail('not-an-email', 'Subject', '<p>Body</p>');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid recipient email');
        expect(mockSend).not.toHaveBeenCalled();
      });

      it('should reject empty subject', async () => {
        const result = await sendEmail('user@example.com', '', '<p>Body</p>');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid subject');
        expect(mockSend).not.toHaveBeenCalled();
      });

      it('should reject subject over 200 characters', async () => {
        const longSubject = 'a'.repeat(201);
        const result = await sendEmail('user@example.com', longSubject, '<p>Body</p>');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid subject');
        expect(mockSend).not.toHaveBeenCalled();
      });

      it('should reject empty HTML content', async () => {
        const result = await sendEmail('user@example.com', 'Subject', '');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid HTML content');
        expect(mockSend).not.toHaveBeenCalled();
      });

      it('should accept valid input', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'msg-123' },
          error: null,
        });

        const result = await sendEmail(
          'user@example.com',
          'Valid Subject',
          '<p>Valid Body</p>'
        );

        expect(result.success).toBe(true);
        expect(mockSend).toHaveBeenCalledWith({
          from: 'GreenChainz <noreply@greenchainz.com>',
          to: 'user@example.com',
          subject: 'Valid Subject',
          html: '<p>Valid Body</p>',
        });
      });
    });

    describe('successful sends', () => {
      it('should send email and return message ID', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'msg-abc123' },
          error: null,
        });

        const result = await sendEmail(
          'test@example.com',
          'Test Email',
          '<h1>Hello</h1>'
        );

        expect(result.success).toBe(true);
        expect(result.messageId).toBe('msg-abc123');
        expect(result.error).toBeUndefined();
      });

      it('should handle HTML with special characters', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'msg-special' },
          error: null,
        });

        const html = '<p>Price: €100 & "free" shipping!</p>';
        const result = await sendEmail('test@example.com', 'Special Chars', html);

        expect(result.success).toBe(true);
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            html,
          })
        );
      });
    });

    describe('error handling', () => {
      it('should handle Resend API error response', async () => {
        mockSend.mockResolvedValue({
          data: null,
          error: {
            message: 'Invalid API key',
            name: 'invalid_api_key',
            statusCode: 401,
          },
        });

        const result = await sendEmail('test@example.com', 'Subject', '<p>Body</p>');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid API key');
      });

      it('should handle missing message ID in response', async () => {
        mockSend.mockResolvedValue({
          data: {},
          error: null,
        });

        const result = await sendEmail('test@example.com', 'Subject', '<p>Body</p>');

        expect(result.success).toBe(false);
        expect(result.error).toContain('no message ID');
      });

      it('should handle network errors', async () => {
        mockSend.mockRejectedValue(new Error('Network error'));

        const result = await sendEmail('test@example.com', 'Subject', '<p>Body</p>');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Network error');
      });

      it('should handle unknown errors', async () => {
        mockSend.mockRejectedValue('Unknown error object');

        const result = await sendEmail('test@example.com', 'Subject', '<p>Body</p>');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown error');
      });
    });

    describe('development mode', () => {
      it('should return mock success when API key is not configured', async () => {
        delete process.env.RESEND_API_KEY;

        const result = await sendEmail('test@example.com', 'Subject', '<p>Body</p>');

        expect(result.success).toBe(true);
        expect(result.messageId).toMatch(/^dev-resend-/);
        expect(mockSend).not.toHaveBeenCalled();
      });
    });
  });

  describe('sendBulkEmail', () => {
    describe('validation', () => {
      it('should reject empty recipients array', async () => {
        const result = await sendBulkEmail([], 'Subject', '<p>Body</p>');

        expect(result.success).toBe(false);
        expect(result.successCount).toBe(0);
        expect(mockBatchSend).not.toHaveBeenCalled();
      });

      it('should reject invalid email addresses', async () => {
        const result = await sendBulkEmail(
          ['valid@example.com', 'invalid-email', 'another@example.com'],
          'Subject',
          '<p>Body</p>'
        );

        expect(result.success).toBe(false);
        expect(result.failureCount).toBe(3);
        expect(mockBatchSend).not.toHaveBeenCalled();
      });

      it('should accept valid recipients array', async () => {
        mockBatchSend.mockResolvedValue({
          data: {
            data: [{ id: 'msg-1' }, { id: 'msg-2' }],
          },
          error: null,
        });

        const result = await sendBulkEmail(
          ['user1@example.com', 'user2@example.com'],
          'Subject',
          '<p>Body</p>'
        );

        expect(result.success).toBe(true);
        expect(mockBatchSend).toHaveBeenCalled();
      });
    });

    describe('successful batch sends', () => {
      it('should send batch and return all message IDs', async () => {
        mockBatchSend.mockResolvedValue({
          data: {
            data: [{ id: 'msg-1' }, { id: 'msg-2' }, { id: 'msg-3' }],
          },
          error: null,
        });

        const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
        const result = await sendBulkEmail(recipients, 'Bulk Email', '<p>Content</p>');

        expect(result.success).toBe(true);
        expect(result.messageIds).toEqual(['msg-1', 'msg-2', 'msg-3']);
        expect(result.successCount).toBe(3);
        expect(result.failureCount).toBe(0);
      });

      it('should handle partial failures in permissive mode', async () => {
        mockBatchSend.mockResolvedValue({
          data: {
            data: [{ id: 'msg-1' }, { id: 'msg-3' }],
            errors: [
              { index: 1, message: 'Bounce detected' },
            ],
          },
          error: null,
        });

        const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
        const result = await sendBulkEmail(recipients, 'Subject', '<p>Body</p>');

        expect(result.success).toBe(true);
        expect(result.successCount).toBe(2);
        expect(result.failureCount).toBe(1);
        expect(result.errors).toEqual([
          { recipient: 'user2@example.com', error: 'Bounce detected' },
        ]);
      });
    });

    describe('error handling and fallback', () => {
      it('should handle batch API errors and fallback to sequential', async () => {
        mockBatchSend.mockResolvedValue({
          data: null,
          error: {
            message: 'Batch API error',
            name: 'application_error',
            statusCode: 500,
          },
        });

        mockSend
          .mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null })
          .mockResolvedValueOnce({ data: { id: 'msg-2' }, error: null });

        const recipients = ['user1@example.com', 'user2@example.com'];
        const result = await sendBulkEmail(recipients, 'Subject', '<p>Body</p>');

        expect(result.success).toBe(true);
        expect(result.messageIds).toEqual(['msg-1', 'msg-2']);
        expect(result.successCount).toBe(2);
        expect(mockSend).toHaveBeenCalledTimes(2);
      });

      it('should handle partial sequential failures in fallback', async () => {
        mockBatchSend.mockRejectedValue(new Error('Batch failed'));

        mockSend
          .mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null })
          .mockResolvedValueOnce({
            data: null,
            error: { message: 'Invalid email', name: 'validation_error', statusCode: 400 },
          })
          .mockResolvedValueOnce({ data: { id: 'msg-3' }, error: null });

        const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
        const result = await sendBulkEmail(recipients, 'Subject', '<p>Body</p>');

        expect(result.success).toBe(true);
        expect(result.successCount).toBe(2);
        expect(result.failureCount).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0]?.recipient).toBe('user2@example.com');
      });
    });

    describe('development mode', () => {
      it('should return mock success for all recipients when API key is not configured', async () => {
        delete process.env.RESEND_API_KEY;

        const recipients = ['user1@example.com', 'user2@example.com'];
        const result = await sendBulkEmail(recipients, 'Subject', '<p>Body</p>');

        expect(result.success).toBe(true);
        expect(result.successCount).toBe(2);
        expect(result.messageIds?.length).toBe(2);
        expect(mockBatchSend).not.toHaveBeenCalled();
      });
    });
  });

  describe('scheduleEmail', () => {
    describe('validation', () => {
      it('should reject invalid email address', async () => {
        const futureDate = new Date(Date.now() + 3600000);
        const result = await scheduleEmail('not-an-email', 'Subject', '<p>Body</p>', futureDate);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid recipient email');
        expect(mockSend).not.toHaveBeenCalled();
      });

      it('should reject past dates', async () => {
        const pastDate = new Date(Date.now() - 3600000);
        const result = await scheduleEmail('user@example.com', 'Subject', '<p>Body</p>', pastDate);

        expect(result.success).toBe(false);
        expect(result.error).toContain('must be in the future');
        expect(mockSend).not.toHaveBeenCalled();
      });

      it('should reject current time (edge case)', async () => {
        const now = new Date();
        const result = await scheduleEmail('user@example.com', 'Subject', '<p>Body</p>', now);

        expect(result.success).toBe(false);
        expect(result.error).toContain('must be in the future');
        expect(mockSend).not.toHaveBeenCalled();
      });

      it('should accept future date', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'msg-scheduled' },
          error: null,
        });

        const futureDate = new Date(Date.now() + 3600000);
        const result = await scheduleEmail('user@example.com', 'Subject', '<p>Body</p>', futureDate);

        expect(result.success).toBe(true);
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            scheduledAt: futureDate.toISOString(),
          })
        );
      });
    });

    describe('successful scheduling', () => {
      it('should schedule email and return message ID', async () => {
        mockSend.mockResolvedValue({
          data: { id: 'msg-scheduled-123' },
          error: null,
        });

        const sendAt = new Date('2025-12-31T23:59:59Z');
        const result = await scheduleEmail(
          'test@example.com',
          'New Year Email',
          '<h1>Happy New Year!</h1>',
          sendAt
        );

        expect(result.success).toBe(true);
        expect(result.messageId).toBe('msg-scheduled-123');
        expect(mockSend).toHaveBeenCalledWith({
          from: 'GreenChainz <noreply@greenchainz.com>',
          to: 'test@example.com',
          subject: 'New Year Email',
          html: '<h1>Happy New Year!</h1>',
          scheduledAt: '2025-12-31T23:59:59.000Z',
        });
      });
    });

    describe('error handling', () => {
      it('should handle scheduling errors', async () => {
        mockSend.mockResolvedValue({
          data: null,
          error: {
            message: 'Scheduling not available',
            name: 'invalid_parameter',
            statusCode: 400,
          },
        });

        const futureDate = new Date(Date.now() + 3600000);
        const result = await scheduleEmail('test@example.com', 'Subject', '<p>Body</p>', futureDate);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Scheduling not available');
      });
    });

    describe('development mode', () => {
      it('should return mock success when API key is not configured', async () => {
        delete process.env.RESEND_API_KEY;

        const futureDate = new Date(Date.now() + 3600000);
        const result = await scheduleEmail('test@example.com', 'Subject', '<p>Body</p>', futureDate);

        expect(result.success).toBe(true);
        expect(result.messageId).toMatch(/^dev-resend-scheduled-/);
        expect(mockSend).not.toHaveBeenCalled();
      });
    });
  });

  describe('type safety', () => {
    it('should enforce strict typing on SendEmailResult', () => {
      const validResult: SendEmailResult = {
        success: true,
        messageId: 'msg-123',
      };

      expect(validResult.success).toBe(true);
    });

    it('should enforce strict typing on SendBulkEmailResult', () => {
      const validResult: SendBulkEmailResult = {
        success: true,
        messageIds: ['msg-1', 'msg-2'],
        successCount: 2,
        failureCount: 0,
      };

      expect(validResult.successCount).toBe(2);
    });
  });
});
