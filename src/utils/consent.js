const CONSENT_STORAGE_KEY = 'cookie_consent_v1';

const readConsent = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const hasAnalyticsConsent = () => {
  const consent = readConsent();
  return Boolean(consent?.analytics);
};

const hasMarketingConsent = () => {
  const consent = readConsent();
  return Boolean(consent?.marketing);
};

export { CONSENT_STORAGE_KEY, readConsent, hasAnalyticsConsent, hasMarketingConsent };
