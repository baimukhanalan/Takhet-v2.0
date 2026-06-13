export type Language = 'ru' | 'kk' | 'en';
export type LegacyLanguage = Language | 'kz';

export const LANGUAGE_STORAGE_KEY = 'takhet_language';

export const LANGUAGE_OPTIONS: Array<{ value: Language; shortLabel: string; label: string; flag: string; locale: string }> = [
  { value: 'kk', shortLabel: 'KK', label: 'Қазақша', flag: '🇰🇿', locale: 'kk-KZ' },
  { value: 'ru', shortLabel: 'RU', label: 'Русский', flag: '🇷🇺', locale: 'ru-RU' },
  { value: 'en', shortLabel: 'EN', label: 'English', flag: '🇺🇸', locale: 'en-US' }
];

const localeByLanguage: Record<Language, string> = {
  ru: 'ru-RU',
  kk: 'kk-KZ',
  en: 'en-US'
};

export const normalizeLanguage = (value?: string | null): Language | null => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === 'kz') return 'kk';
  if (normalized.startsWith('kk') || normalized.startsWith('қаз')) return 'kk';
  if (normalized.startsWith('ru')) return 'ru';
  if (normalized.startsWith('en')) return 'en';
  return null;
};

export const detectBrowserLanguage = (): Language => {
  if (typeof navigator === 'undefined') return 'ru';

  const candidates = [navigator.language, ...(navigator.languages || [])];
  for (const candidate of candidates) {
    const language = normalizeLanguage(candidate);
    if (language) return language;
  }

  return 'ru';
};

export const getStoredLanguage = (): Language => {
  if (typeof localStorage === 'undefined') return 'ru';

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const normalizedStored = normalizeLanguage(stored);
  if (normalizedStored) {
    if (stored !== normalizedStored) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedStored);
    }
    return normalizedStored;
  }

  const detected = detectBrowserLanguage();
  localStorage.setItem(LANGUAGE_STORAGE_KEY, detected);
  return detected;
};

export const setStoredLanguage = (language: LegacyLanguage) => {
  if (typeof localStorage === 'undefined') return;

  const normalized = normalizeLanguage(language) || 'ru';
  localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  document.documentElement.lang = normalized;
  window.dispatchEvent(new Event('storage_update'));
};

export const getLocale = (language: Language) => localeByLanguage[language] || 'ru-RU';
