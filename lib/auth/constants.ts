// SECURITY: In production, this fallback should never be used.
// Ensure JWT_SECRET is set in your environment variables.
export const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-do-not-use-in-prod-32chars';
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
