/**
 * Tests for SSRF prevention validation in BIM Analysis Service
 * These tests verify that the validation schemas properly prevent
 * SSRF attacks via malicious model URNs and GUIDs.
 */

import { ZodError } from 'zod';
import {
  autodeskUrnSchema,
  viewableGuidSchema,
  buildModelDerivativeUrl,
} from '../bim-analysis';

describe('autodeskUrnSchema', () => {
  describe('valid URNs', () => {
    it('should accept a valid URL-safe Base64 URN', () => {
      const validUrn = 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLkFCQ0RFRkdI';
      expect(() => autodeskUrnSchema.parse(validUrn)).not.toThrow();
    });

    it('should accept URN with underscores and hyphens', () => {
      const validUrn = 'urn_with-underscores_and-hyphens123';
      expect(() => autodeskUrnSchema.parse(validUrn)).not.toThrow();
    });

    it('should accept alphanumeric URN', () => {
      const validUrn = 'ABC123xyz456';
      expect(() => autodeskUrnSchema.parse(validUrn)).not.toThrow();
    });
  });

  describe('SSRF attack prevention', () => {
    it('should reject URN with path traversal (..)', () => {
      const maliciousUrn = '../../etc/passwd';
      expect(() => autodeskUrnSchema.parse(maliciousUrn)).toThrow(ZodError);
    });

    it('should reject URN with double slashes (//)', () => {
      const maliciousUrn = 'valid-urn//internal-service';
      expect(() => autodeskUrnSchema.parse(maliciousUrn)).toThrow(ZodError);
    });

    it('should reject URN with hash fragment (#)', () => {
      const maliciousUrn = 'valid-urn#malicious-fragment';
      expect(() => autodeskUrnSchema.parse(maliciousUrn)).toThrow(ZodError);
    });

    it('should reject URN with forward slash (/)', () => {
      const maliciousUrn = 'urn/with/slashes';
      expect(() => autodeskUrnSchema.parse(maliciousUrn)).toThrow(ZodError);
    });

    it('should reject URN with URL-encoded characters', () => {
      const maliciousUrn = 'urn%2F..%2F..%2Fetc%2Fpasswd';
      expect(() => autodeskUrnSchema.parse(maliciousUrn)).toThrow(ZodError);
    });

    it('should reject URN with special characters', () => {
      const maliciousUrn = 'urn?query=malicious';
      expect(() => autodeskUrnSchema.parse(maliciousUrn)).toThrow(ZodError);
    });

    it('should reject URN with colon (:)', () => {
      const maliciousUrn = 'urn:internal:service';
      expect(() => autodeskUrnSchema.parse(maliciousUrn)).toThrow(ZodError);
    });

    it('should reject URN with at symbol (@)', () => {
      const maliciousUrn = 'user@internal-host';
      expect(() => autodeskUrnSchema.parse(maliciousUrn)).toThrow(ZodError);
    });
  });

  describe('validation constraints', () => {
    it('should reject empty URN', () => {
      expect(() => autodeskUrnSchema.parse('')).toThrow(ZodError);
    });

    it('should reject URN exceeding max length (1000 chars)', () => {
      const longUrn = 'a'.repeat(1001);
      expect(() => autodeskUrnSchema.parse(longUrn)).toThrow(ZodError);
    });

    it('should accept URN at max length (1000 chars)', () => {
      const maxLengthUrn = 'a'.repeat(1000);
      expect(() => autodeskUrnSchema.parse(maxLengthUrn)).not.toThrow();
    });

    it('should reject non-string input', () => {
      expect(() => autodeskUrnSchema.parse(12345)).toThrow(ZodError);
      expect(() => autodeskUrnSchema.parse(null)).toThrow(ZodError);
      expect(() => autodeskUrnSchema.parse(undefined)).toThrow(ZodError);
    });
  });
});

describe('viewableGuidSchema', () => {
  describe('valid GUIDs', () => {
    it('should accept a valid UUID v4', () => {
      const validGuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(() => viewableGuidSchema.parse(validGuid)).not.toThrow();
    });

    it('should accept UUID with uppercase letters', () => {
      const validGuid = '123E4567-E89B-12D3-A456-426614174000';
      expect(() => viewableGuidSchema.parse(validGuid)).not.toThrow();
    });
  });

  describe('SSRF attack prevention', () => {
    it('should reject GUID with path traversal', () => {
      const maliciousGuid = '../../etc/passwd';
      expect(() => viewableGuidSchema.parse(maliciousGuid)).toThrow(ZodError);
    });

    it('should reject GUID with URL-like content', () => {
      const maliciousGuid = 'http://internal-service/api';
      expect(() => viewableGuidSchema.parse(maliciousGuid)).toThrow(ZodError);
    });

    it('should reject malformed GUID', () => {
      const malformedGuid = 'not-a-valid-uuid';
      expect(() => viewableGuidSchema.parse(malformedGuid)).toThrow(ZodError);
    });

    it('should reject GUID with invalid length', () => {
      const invalidGuid = '123e4567-e89b-12d3-a456';
      expect(() => viewableGuidSchema.parse(invalidGuid)).toThrow(ZodError);
    });
  });
});

describe('buildModelDerivativeUrl', () => {
  describe('valid URL construction', () => {
    it('should build a valid manifest URL', () => {
      const urn = 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLkFCQ0RFRkdI';
      const url = buildModelDerivativeUrl(urn, 'manifest');
      
      expect(url).toBe(
        `https://developer.api.autodesk.com/modelderivative/v2/designdata/${encodeURIComponent(urn)}/manifest`
      );
    });

    it('should build a valid properties URL with GUID path', () => {
      const urn = 'validBase64Urn123';
      const path = 'metadata/123e4567-e89b-12d3-a456-426614174000/properties';
      const url = buildModelDerivativeUrl(urn, path);
      
      expect(url).toContain('/designdata/');
      expect(url).toContain('/metadata/');
      expect(url).toContain('/properties');
    });

    it('should URL-encode the URN in the output', () => {
      const urn = 'validUrn_with-special_chars';
      const url = buildModelDerivativeUrl(urn, 'manifest');
      
      expect(url).toContain(encodeURIComponent(urn));
    });
  });

  describe('SSRF prevention in URL building', () => {
    it('should reject malicious URN in URL construction', () => {
      const maliciousUrn = '../../../internal-service';
      expect(() => buildModelDerivativeUrl(maliciousUrn, 'manifest')).toThrow(ZodError);
    });

    it('should reject URN with protocol injection attempt', () => {
      const maliciousUrn = 'http://attacker.com/';
      expect(() => buildModelDerivativeUrl(maliciousUrn, 'manifest')).toThrow(ZodError);
    });

    it('should reject URN that tries to break out of the path', () => {
      const maliciousUrn = 'valid%2F..%2F..%2Finternal';
      expect(() => buildModelDerivativeUrl(maliciousUrn, 'manifest')).toThrow(ZodError);
    });
  });
});
