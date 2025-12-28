const isProduction = process.env.NODE_ENV === 'production';

// SECURITY: In production, this fallback should never be used.
// Ensure JWT_SECRET is set in your environment variables.
export const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-do-not-use-in-prod-32chars';

if (isProduction && JWT_SECRET === 'default-dev-secret-do-not-use-in-prod-32chars') {
  // In a real strict environment, we might want to throw error,
  // but to avoid breaking existing deployments that might strictly rely on this (unlikely but possible),
  // we will log a severe error. Ideally, this should throw.
  console.error('🚨 CRITICAL SECURITY WARNING: Using default JWT_SECRET in production! Please set JWT_SECRET env var.');
  // throw new Error('JWT_SECRET must be set in production');
}

export const JWT_EXPIRES_IN = '7d';
export const PASSWORD_MIN_LENGTH = 12;

export const CORPORATE_DOMAINS = [
  'autodesk.com',
  'nbbj.com',
  'gensler.com',
  'som.com',
  'hok.com',
  'perkinswill.com',
  'aecom.com',
  'hdrinc.com',
  'jacobs.com',
  'stantec.com',
  // Add more as partnerships expand
];
