import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

const main = read('src/main.tsx');
const indexCss = read('src/index.css');
const indexHtml = read('index.html');
const adminDashboard = read('src/pages/AdminDashboard.tsx');
const forceLightTheme = read('src/services/forceLightTheme.ts');

assert(
  main.includes('installLightThemeLock()'),
  'main.tsx must install the global light-theme lock at startup'
);

assert(
  !main.includes("document.documentElement.setAttribute('data-theme', 'light')") &&
    !main.includes('document.documentElement.style.colorScheme') &&
    !main.includes('document.body.style.colorScheme'),
  'main.tsx must not mutate theme attributes after installing the MutationObserver-based light-theme lock'
);

assert(
  forceLightTheme.includes('let isApplyingLightTheme = false') &&
    forceLightTheme.includes('if (isApplyingLightTheme) return;') &&
    forceLightTheme.includes("if (html.getAttribute('data-theme') !== 'light')"),
  'forceLightTheme must be idempotent and guarded against MutationObserver self-trigger loops'
);

assert(
  indexCss.includes('color-scheme: only light'),
  'global CSS must force browser controls and page rendering to light mode'
);

assert(
  indexHtml.includes('<meta name="color-scheme" content="light" />') &&
    indexHtml.includes('<meta name="supported-color-schemes" content="light" />'),
  'index.html must advertise light-only color scheme before React boots'
);

assert(
  !adminDashboard.includes("handleThemeSwitch('dark')") &&
    !adminDashboard.includes("theme === 'dark'") &&
    !adminDashboard.includes('>Темная<') &&
    !adminDashboard.includes('>РўРµРјРЅР°СЏ<'),
  'Admin settings must not expose or activate a dark theme option'
);

console.log('Force light theme contract passed');
