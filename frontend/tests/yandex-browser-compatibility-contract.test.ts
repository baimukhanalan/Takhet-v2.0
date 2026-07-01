import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const viteConfig = read('vite.config.ts');
const css = read('src/index.css');
const language = read('src/services/useLanguage.ts');
const labs = read('src/pages/TakhetLabsPage.tsx');

if (!viteConfig.includes("target: ['es2019', 'chrome87', 'edge88', 'firefox78', 'safari14']")) {
  throw new Error('Production bundles must explicitly support Chromium-based Yandex Browser releases');
}

const viewportFallbacks = [
  ['height: 100vh;', 'height: 100svh;'],
  ['height: 900vh;', 'height: 900svh;'],
  ['height: 500vh;', 'height: 500svh;'],
] as const;

for (const [fallback, modern] of viewportFallbacks) {
  const fallbackIndex = css.indexOf(fallback);
  const modernIndex = css.indexOf(modern, fallbackIndex);
  if (fallbackIndex < 0 || modernIndex < fallbackIndex) {
    throw new Error(`${modern} must have a preceding ${fallback} compatibility fallback`);
  }
}

if (language.includes('.replaceAll(')) {
  throw new Error('Translations must not require String.prototype.replaceAll');
}

if (labs.includes('.at(-1)')) {
  throw new Error('Takhet Labs must not require Array.prototype.at');
}

console.log('Yandex Browser compatibility contract passed');
