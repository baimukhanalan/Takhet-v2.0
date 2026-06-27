import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const packageJson = read('package.json');
const motionShell = read('src/components/PlatformMotionShell.tsx');
const sharedUiFiles = [
  'src/components/ui/Alert.tsx',
  'src/components/ui/Button.tsx',
  'src/components/ui/IconButton.tsx',
  'src/components/ui/TextField.tsx',
];

for (const path of sharedUiFiles) {
  assert(existsSync(resolve(process.cwd(), path)), `${path} must exist`);
}

assert(!packageJson.includes('@mui/'), 'Takhet UI must not add the MUI runtime');
assert(!packageJson.includes('@emotion/'), 'Takhet UI must not add the Emotion runtime');

for (const path of [
  'src/components/Header.tsx',
  'src/pages/AuthPage.tsx',
  'src/pages/PatientAuthPage.tsx',
  'src/pages/AdminAuthPage.tsx',
  'src/pages/AuthResetPasswordPage.tsx',
  'src/pages/AuthConfirmEmailPage.tsx',
]) {
  const source = read(path);
  assert(source.includes('components/ui/') || source.includes("'./ui/"), `${path} must use Takhet UI primitives`);
}

assert(motionShell.includes('pointerFrameRef'), 'Platform pointer work must be limited to one scheduled frame');
assert(motionShell.includes('pendingPointerRef'), 'Platform pointer work must keep only the latest pointer position');
assert(motionShell.includes("matchMedia('(hover: hover) and (pointer: fine)')"), 'Platform motion must skip coarse pointers');
assert(motionShell.includes("matchMedia('(prefers-reduced-motion: reduce)')"), 'Platform motion must respect reduced motion');
assert(motionShell.includes('requestAnimationFrame(flushPointerMove)'), 'Platform pointer updates must be batched with requestAnimationFrame');

console.log('Takhet UI system and pointer performance contract passed');
