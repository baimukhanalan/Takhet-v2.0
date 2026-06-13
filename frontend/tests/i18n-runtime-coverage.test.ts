import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runtimeText } from '../src/locales/runtimeText';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const appSource = readSource('src/App.tsx');
const runtimeSource = readSource('src/locales/runtimeText.ts');
const localizerSource = readSource('src/components/RuntimeTextLocalizer.tsx');
const generatorSource = readSource('scripts/generate-runtime-translations.cjs');
const languageHookSource = readSource('src/services/useLanguage.ts');
const languageSource = readSource('src/services/language.ts');

assert(!appSource.includes('RuntimeTextLocalizer'), 'App.tsx must not mount the global DOM runtime text localizer');
assert(
  languageHookSource.includes("import ru from '../locales/ru.json'") &&
    languageHookSource.includes("import kk from '../locales/kk.json'") &&
    languageHookSource.includes("import en from '../locales/en.json'"),
  'useLanguage must use explicit ru/kk/en JSON dictionaries'
);
assert(languageSource.includes("if (normalized === 'kz') return 'kk'"), 'Legacy kz language code must normalize to kk');

const runtimeLanguages = Object.keys(runtimeText).sort().join(',');
assert(runtimeLanguages === 'en,kk,ru', `runtimeText must keep only ru/kk/en compatibility maps, got: ${runtimeLanguages}`);

for (const [language, dictionary] of Object.entries(runtimeText)) {
  assert(Object.keys(dictionary).length === 0, `runtimeText.${language} must stay empty while legacy DOM localization is disabled`);
}

const forbiddenRuntimeFragments = [
  'Suraga',
  'Zhalpy',
  'This is the answer to the question',
  '${',
  'You are',
  'Reply in Russian',
  'Do not',
  'No markdown',
  'system prompt',
  'Know the platform map',
  'Рџ',
  'РЎ',
  'вЂ',
  '\uFFFD'
];

for (const fragment of forbiddenRuntimeFragments) {
  assert(!runtimeSource.includes(fragment), `runtimeText.ts must not contain unsafe runtime fragment: ${fragment}`);
}

assert(
  localizerSource.includes('Legacy') || localizerSource.includes('legacy') || localizerSource.includes('quarantined'),
  'RuntimeTextLocalizer must be marked as legacy/quarantined if kept in the codebase'
);
assert(
  generatorSource.includes('Runtime auto-translation is disabled') && generatorSource.includes('process.exit(1)'),
  'generate-runtime-translations.cjs must be disabled for production translation generation'
);

console.log('I18n runtime disable contract passed');
