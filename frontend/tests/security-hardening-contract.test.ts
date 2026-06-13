import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const vercel = read('vercel.json');
const repoCursorIgnore = read('../.cursorignore');

for (const header of [
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy'
]) {
  assert(vercel.includes(header), `Vercel config must include security header: ${header}`);
}

for (const cspDirective of [
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  'connect-src',
  'wss://*.livekit.cloud',
  'https://*.supabase.co'
]) {
  assert(vercel.includes(cspDirective), `CSP must include directive/source: ${cspDirective}`);
}

for (const ignoredPath of ['node_modules/', 'dist/', 'build/', '.vercel/', 'output/', 'test-results/']) {
  assert(repoCursorIgnore.includes(ignoredPath), `.cursorignore must ignore ${ignoredPath}`);
}

for (const ignoredPattern of ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.mp4', '**/*.mov']) {
  assert(repoCursorIgnore.includes(ignoredPattern), `.cursorignore must ignore heavy binary pattern ${ignoredPattern}`);
}

console.log('Frontend security hardening contract passed');
