export const CONSENT_KEY = 'security-srl-consent-v1';
export const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export interface Consent {
  version: 1;
  at: number;
  analytics: boolean;
  marketing: boolean;
}
export function readConsent(raw: string | null, now = Date.now()): Consent | null {
  try {
    const c = JSON.parse(raw || 'null');
    return c &&
      c.version === 1 &&
      Number.isFinite(c.at) &&
      c.at <= now &&
      now - c.at < MAX_AGE &&
      typeof c.analytics === 'boolean' &&
      typeof c.marketing === 'boolean'
      ? c
      : null;
  } catch {
    return null;
  }
}
