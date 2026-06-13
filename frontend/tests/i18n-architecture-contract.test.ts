import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const readJson = (path: string) => JSON.parse(read(path));

const localePaths = ['src/locales/ru.json', 'src/locales/kk.json', 'src/locales/en.json'];
const mojibakeMarkers = [
  '\u0420\u00a0',
  '\u0420\u045f',
  '\u0420\u040e',
  '\u0420\u045c',
  '\u0420\u2018',
  '\u0420\u00a7',
  '\u0420\u045a',
  '\u0421\u2013',
  '\u0421\u201a',
  '\u0432\u0402',
  '\ufffd'
];

for (const localePath of localePaths) {
  assert(existsSync(resolve(process.cwd(), localePath)), `Missing locale dictionary: ${localePath}`);
}

const ru = readJson('src/locales/ru.json');
const kk = readJson('src/locales/kk.json');
const en = readJson('src/locales/en.json');

const flattenKeys = (value: unknown, prefix = ''): string[] => {
  if (Array.isArray(value)) return [prefix];
  if (!value || typeof value !== 'object') return [prefix];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  );
};

const ruKeys = flattenKeys(ru).sort();
const kkKeys = flattenKeys(kk).sort();
const enKeys = flattenKeys(en).sort();

assert(JSON.stringify(ruKeys) === JSON.stringify(kkKeys), 'ru and kk dictionaries must have identical key coverage');
assert(JSON.stringify(ruKeys) === JSON.stringify(enKeys), 'ru and en dictionaries must have identical key coverage');

const combinedDictionaries = JSON.stringify({ ru, kk, en });
for (const marker of mojibakeMarkers) {
  assert(!combinedDictionaries.includes(marker), `Locale dictionaries must not contain mojibake marker: ${marker}`);
}
assert(!combinedDictionaries.includes('??'), 'Locale dictionaries must not contain replacement question-mark artifacts');

const language = read('src/services/language.ts');
assert(language.includes("export type Language = 'ru' | 'kk' | 'en'"), 'Language type must use canonical kk, not kz');
assert(language.includes('normalizeLanguage'), 'Language service must normalize legacy or external language values');
assert(language.includes("normalized === 'kz'"), 'Language service must migrate legacy kz to kk');
assert(language.includes('detectBrowserLanguage'), 'Language service must detect browser language on first visit');
assert(language.includes('LANGUAGE_OPTIONS'), 'Language service must expose shared language switcher options');
assert(language.includes('Русский') && language.includes('Қазақша') && language.includes('English'), 'Language options must show full labels');
assert(language.includes('🇷🇺') && language.includes('🇰🇿') && language.includes('🇺🇸'), 'Language options must show flag labels');
for (const marker of mojibakeMarkers) {
  assert(!language.includes(marker), `Language service must not contain mojibake marker: ${marker}`);
}

const useLanguage = read('src/services/useLanguage.ts');
assert(useLanguage.includes('../locales/ru.json'), 'useLanguage must use JSON locale dictionaries');
assert(useLanguage.includes('tArray'), 'useLanguage must expose tArray helper');
assert(useLanguage.includes('formatDate'), 'useLanguage must expose locale-aware formatDate');
assert(useLanguage.includes('formatTime'), 'useLanguage must expose locale-aware formatTime');
assert(useLanguage.includes('formatDateTime'), 'useLanguage must expose locale-aware formatDateTime');
assert(useLanguage.includes('formatNumber'), 'useLanguage must expose locale-aware formatNumber');
assert(useLanguage.includes('formatCurrency'), 'useLanguage must expose locale-aware formatCurrency');

const getPath = (dictionary: any, path: string) =>
  path.split('.').reduce((current, key) => current?.[key], dictionary);

const kkMustNotCopyRussian = [
  'auth.account',
  'sidebar.panel',
  'sidebar.chat',
  'sidebar.archive',
  'roles.patient',
  'roles.admin',
  'dashboard.patient.profile',
  'dashboard.partner.export',
  'settings.tabs.profile',
  'settings.tabs.medical',
  'settings.tabs.team',
  'settings.patient.phone',
  'settings.patient.archive',
  'settings.patient.export',
  'settings.partner.team',
  'settings.doctor.pro',
  'settings.doctor.reputation',
  'ai_consultation.payment.tariff'
];

for (const path of kkMustNotCopyRussian) {
  assert(getPath(kk, path) !== getPath(ru, path), `KK translation must not copy RU for ${path}`);
}

assert(Array.isArray(ru.landing.faqItems) && ru.landing.faqItems.length >= 5, 'RU landing FAQ must cover the full visible FAQ set');
assert(Array.isArray(kk.landing.faqItems) && kk.landing.faqItems.length === ru.landing.faqItems.length, 'KK landing FAQ must match RU FAQ coverage');
assert(Array.isArray(en.landing.faqItems) && en.landing.faqItems.length === ru.landing.faqItems.length, 'EN landing FAQ must match RU FAQ coverage');
assert(Array.isArray(ru.landing.heroPlaceholders) && ru.landing.heroPlaceholders.length >= 5, 'RU landing hero placeholders must be translated via dictionary');
assert(Array.isArray(kk.landing.heroPlaceholders) && kk.landing.heroPlaceholders.length === ru.landing.heroPlaceholders.length, 'KK landing hero placeholders must match RU coverage');
assert(Array.isArray(en.landing.heroPlaceholders) && en.landing.heroPlaceholders.length === ru.landing.heroPlaceholders.length, 'EN landing hero placeholders must match RU coverage');

const landingPage = read('src/pages/LandingPage.tsx');
assert(!landingPage.includes('const faqItems = ['), 'LandingPage FAQ must come from locale dictionaries');
assert(!landingPage.includes('const placeholders = ['), 'LandingPage hero placeholders must come from locale dictionaries');
assert(landingPage.includes('tArray'), 'LandingPage must use tArray for translated arrays');

const globalCss = read('src/index.css');
assert(globalCss.includes(':lang(kk)'), 'Global CSS must include a Kazakh language font rule');
assert(globalCss.includes('Segoe UI') && globalCss.includes('Noto Sans'), 'Global font stack must include Kazakh-safe Cyrillic fallbacks');

for (const componentPath of ['src/components/PublicHeader.tsx', 'src/components/Header.tsx']) {
  const source = read(componentPath);
  assert(source.includes('LANGUAGE_OPTIONS'), `${componentPath} must render shared language options`);
  assert(!source.includes("['ru', 'kz', 'en']"), `${componentPath} must not use legacy kz switcher array`);
}

console.log('I18n architecture contract passed');
