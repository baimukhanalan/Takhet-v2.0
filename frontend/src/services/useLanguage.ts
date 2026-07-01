import { useEffect, useMemo, useState } from 'react';
import ru from '../locales/ru.json';
import kk from '../locales/kk.json';
import en from '../locales/en.json';
import { getLocale, getStoredLanguage, setStoredLanguage, type Language, type LegacyLanguage } from './language';

type LocaleDictionary = typeof ru;
type TranslationObject = LocaleDictionary & Record<string, any>;
type Translator = ((path: string, replacements?: Record<string, string | number>) => any) & TranslationObject;

export const translations: Record<Language, TranslationObject> = { ru, kk, en };

const getPathValue = (dictionary: unknown, path: string): unknown => {
  if (!path) return dictionary;
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, dictionary);
};

const createTranslator = (language: Language): Translator => {
  const primary = translations[language] || translations.ru;

  const translate = (path: string, replacements?: Record<string, string | number>) => {
    const value = getPathValue(primary, path) ?? getPathValue(translations.ru, path) ?? getPathValue(translations.en, path);
    if (value && typeof value === 'object') return value;
    const text = typeof value === 'string' ? value : path;

    if (!replacements) return text;
    return Object.entries(replacements).reduce(
      (result, [key, replacement]) => result.split(`{${key}}`).join(String(replacement)),
      text
    );
  };

  Object.assign(translate, primary);
  return translate as Translator;
};

export const tArrayFromDictionary = <T = unknown,>(language: Language, path: string): T[] => {
  const value = getPathValue(translations[language], path) ?? getPathValue(translations.ru, path) ?? getPathValue(translations.en, path);
  return Array.isArray(value) ? (value as T[]) : [];
};

export const formatDateForLanguage = (language: Language, value: string | number | Date, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(getLocale(language), options || { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));

export const formatTimeForLanguage = (language: Language, value: string | number | Date, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(getLocale(language), options || { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

export const formatDateTimeForLanguage = (language: Language, value: string | number | Date, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(
    getLocale(language),
    options || { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  ).format(new Date(value));

export const formatNumberForLanguage = (language: Language, value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(getLocale(language), options).format(value);

export const formatCurrencyForLanguage = (language: Language, value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
    ...options
  }).format(value);

export const useLanguage = () => {
  const [lang, setLang] = useState<Language>(getStoredLanguage());

  useEffect(() => {
    document.documentElement.lang = lang;

    const handleUpdate = () => setLang(getStoredLanguage());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, [lang]);

  const t = useMemo(() => createTranslator(lang), [lang]);

  const setLanguage = (newLang: LegacyLanguage) => {
    setStoredLanguage(newLang);
    setLang(getStoredLanguage());
  };

  const toggleLang = () => {
    const newLang: Language = lang === 'ru' ? 'kk' : lang === 'kk' ? 'en' : 'ru';
    setLanguage(newLang);
  };

  const tArray = <T = unknown,>(path: string) => tArrayFromDictionary<T>(lang, path);
  const formatDate = (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => formatDateForLanguage(lang, value, options);
  const formatTime = (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => formatTimeForLanguage(lang, value, options);
  const formatDateTime = (value: string | number | Date, options?: Intl.DateTimeFormatOptions) =>
    formatDateTimeForLanguage(lang, value, options);
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => formatNumberForLanguage(lang, value, options);
  const formatCurrency = (value: number, options?: Intl.NumberFormatOptions) => formatCurrencyForLanguage(lang, value, options);

  return { lang, t, tArray, toggleLang, setLanguage, formatDate, formatTime, formatDateTime, formatNumber, formatCurrency };
};
