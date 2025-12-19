/**
 * Unit tests for saveVerification helper
 */

import { saveVerification } from '../saveVerification';
import type { VerificationPayload } from '../types';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('saveVerification', () => {
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;
  let mockFrom: jest.Mock;
  let mockCreateClient: jest.Mock;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock chain
    mockEq = jest.fn().mockResolvedValue({ error: null });
    mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

    // Mock createClient
    const supabaseModule = await import('@supabase/supabase-js');
    mockCreateClient = supabaseModule.createClient as unknown as jest.Mock;
    mockCreateClient.mockReturnValue({ from: mockFrom });

    // Set required environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  describe('validation', () => {
    it('should throw error if profileId is missing', async () => {
      const payload: VerificationPayload = {
        profileId: '',
        epdVerified: true,
      };

      await expect(saveVerification(payload)).rejects.toThrow('profileId is required');
    });

    it('should throw error if carbonFootprintA1A3 is negative', async () => {
      const payload: VerificationPayload = {
        profileId: 'test-id',
        carbonFootprintA1A3: -10,
      };

      await expect(saveVerification(payload)).rejects.toThrow(
        'carbonFootprintA1A3 must be a positive number'
      );
    });

    it('should throw error if Supabase environment variables are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const payload: VerificationPayload = {
        profileId: 'test-id',
        epdVerified: true,
      };

      await expect(saveVerification(payload)).rejects.toThrow(
        'Missing Supabase environment variables'
      );
    });
  });

  describe('successful updates', () => {
    it('should update profile with all verification fields', async () => {
      const verifiedAt = new Date('2025-01-01T00:00:00Z');
      const payload: VerificationPayload = {
        profileId: 'test-profile-id',
        epdNumber: 'EPD-12345',
        carbonFootprintA1A3: 150.5,
        epdVerified: true,
        fscVerified: true,
        bcorpVerified: false,
        leedVerified: true,
        verifiedAt,
        epdDataSource: 'EPD International',
        verificationSource: 'Manual',
      };

      await saveVerification(payload);

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({
        epd_number: 'EPD-12345',
        carbon_footprint_a1a3: 150.5,
        epd_verified: true,
        fsc_verified: true,
        bcorp_verified: false,
        leed_verified: true,
        epd_data_source: 'EPD International',
        verification_source: 'Manual',
        epd_verified_at: verifiedAt.toISOString(),
      });
      expect(mockEq).toHaveBeenCalledWith('id', 'test-profile-id');
    });

    it('should update profile with only provided fields', async () => {
      const payload: VerificationPayload = {
        profileId: 'test-profile-id',
        epdVerified: true,
        carbonFootprintA1A3: 200,
      };

      await saveVerification(payload);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          epd_verified: true,
          carbon_footprint_a1a3: 200,
          epd_verified_at: expect.any(String),
        })
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          epd_number: expect.anything(),
          fsc_verified: expect.anything(),
        })
      );
    });

    it('should auto-set verified_at when epdVerified is true and verifiedAt not provided', async () => {
      const beforeCall = new Date();
      
      const payload: VerificationPayload = {
        profileId: 'test-profile-id',
        epdVerified: true,
      };

      await saveVerification(payload);

      const updateCall = mockUpdate.mock.calls[0][0];
      const verifiedAt = new Date(updateCall.epd_verified_at);
      
      expect(verifiedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(verifiedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
    });

    it('should handle zero carbon footprint', async () => {
      const payload: VerificationPayload = {
        profileId: 'test-profile-id',
        carbonFootprintA1A3: 0,
      };

      await saveVerification(payload);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          carbon_footprint_a1a3: 0,
        })
      );
    });
  });

  describe('error propagation', () => {
    it('should throw error when database update fails', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Database connection failed' } });

      const payload: VerificationPayload = {
        profileId: 'test-profile-id',
        epdVerified: true,
      };

      await expect(saveVerification(payload)).rejects.toThrow(
        'Failed to save verification data: Database connection failed'
      );
    });

    it('should propagate type errors for invalid payload', async () => {
      // TypeScript will catch this at compile time, but testing runtime behavior
      const payload = {
        profileId: 'test-profile-id',
        carbonFootprintA1A3: 'not-a-number', // Invalid type
      } as unknown as VerificationPayload;

      // This would be caught by TypeScript, but we can still test runtime
      // The function will attempt to save the invalid data
      await saveVerification(payload);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          carbon_footprint_a1a3: 'not-a-number',
        })
      );
    });
  });

  describe('type safety', () => {
    it('should accept valid VerificationSource types', async () => {
      const sources: Array<VerificationPayload['source']> = [
        'EPD International',
        'IBU',
        'UL Environment',
        'NSF',
        'FSC',
        'B Lab',
        'USGBC',
        'Manual',
        'API Import',
      ];

      for (const source of sources) {
        const payload: VerificationPayload = {
          profileId: 'test-profile-id',
          source,
          verificationSource: source,
        };

        await saveVerification(payload);
        expect(mockUpdate).toHaveBeenCalled();
        jest.clearAllMocks();
        mockEq = jest.fn().mockResolvedValue({ error: null });
        mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
        mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });
        mockCreateClient.mockReturnValue({ from: mockFrom });
      }
    });
  });
});
