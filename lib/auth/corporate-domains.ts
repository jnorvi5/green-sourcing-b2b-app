import { CORPORATE_DOMAINS } from './constants';

export function isCorporateEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1].toLowerCase();
  return CORPORATE_DOMAINS.includes(domain);
}

export function getTrustScoreForEmail(email: string): number {
  if (isCorporateEmail(email)) {
    return 75;
  }
  return 30;
}
