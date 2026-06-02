export type Language = 'ru' | 'kz' | 'en';

const LANGUAGE_STORAGE_KEY = 'takhet_language';

const isLanguage = (value: string | null): value is Language =>
  value === 'ru' || value === 'kz' || value === 'en';

export const getStoredLanguage = (): Language => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLanguage(stored) ? stored : 'ru';
};

export const setStoredLanguage = (language: Language) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.dispatchEvent(new Event('storage_update'));
};
