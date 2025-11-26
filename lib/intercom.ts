import crypto from 'crypto';

export function generateIntercomHash(email: string) {
  const secret = process.env.INTERCOM_IDENTITY_SECRET;
  
  if (!secret) {
    console.warn('Intercom Secret missing - Secure Mode disabled');
    return null;
  }

  // Generate HMAC-SHA256 hash required by Intercom Secure Mode
  return crypto
    .createHmac('sha256', secret)
    .update(email)
    .digest('hex');
}
