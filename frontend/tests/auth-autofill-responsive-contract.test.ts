import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const sharedCredential = 'baimukhanalan1@gmail.com';

const authSources = [
  'src/pages/AuthPage.tsx',
  'src/pages/PatientAuthPage.tsx',
  'src/pages/AdminAuthPage.tsx',
  'src/pages/EnterpriseApp.tsx',
  'src/pages/TakhetLabsApp.tsx',
  'pages/AuthPage.tsx',
  'pages/AdminAuthPage.tsx'
];

for (const path of authSources) {
  const source = read(path);
  assert(
    !source.includes(`useState('${sharedCredential}')`) && !source.includes(`useState("${sharedCredential}")`),
    `${path} must not prefill auth inputs with shared credentials`
  );
}

for (const path of ['src/pages/AuthPage.tsx', 'src/pages/PatientAuthPage.tsx', 'src/pages/AdminAuthPage.tsx']) {
  const source = read(path);
  assert(source.includes('type="email"'), `${path} must use email input type`);
  assert(source.includes('autoComplete='), `${path} must declare autocomplete behavior`);
  assert(source.includes('current-password'), `${path} must mark login password fields as current-password`);
}

for (const path of ['src/pages/EnterpriseApp.tsx', 'src/pages/TakhetLabsApp.tsx']) {
  const source = read(path);
  assert(source.includes('autoComplete="username"'), `${path} must mark identifier as username for password managers`);
  assert(source.includes('current-password'), `${path} must mark password as current-password`);
}

const css = read('src/index.css');
assert(css.includes('box-sizing: border-box'), 'global CSS must use border-box sizing');
assert(css.includes('overflow-x: hidden'), 'global CSS must prevent page-level horizontal overflow');
assert(css.includes('max-width: 100%'), 'global CSS must constrain media width on small screens');

console.log('Auth autofill and responsive contract passed');
