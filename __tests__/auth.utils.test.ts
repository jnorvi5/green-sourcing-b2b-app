import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { generateToken, verifyToken } from '../lib/auth/jwt';
import { isCorporateEmail, getTrustScoreForEmail } from '../lib/auth/corporate-domains';

describe('Auth Utilities', () => {

  test('JWT Generation and Verification', () => {
    const payload = { userId: '123', email: 'test@example.com', role: 'architect' };
    const token = generateToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded).toMatchObject(payload);
  });

  test('Corporate Email Detection', () => {
    expect(isCorporateEmail('user@autodesk.com')).toBe(true);
    expect(isCorporateEmail('user@gmail.com')).toBe(false);
    expect(isCorporateEmail('user@gensler.com')).toBe(true);
  });

  test('Trust Score Calculation', () => {
    expect(getTrustScoreForEmail('user@autodesk.com')).toBe(75);
    expect(getTrustScoreForEmail('user@gmail.com')).toBe(30);
  });

});
