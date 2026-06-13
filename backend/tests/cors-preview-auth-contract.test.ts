import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const main = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8');

assert(
  main.includes('isAllowedVercelPreviewOrigin') &&
    main.includes("origin.endsWith('.vercel.app')") &&
    main.includes("origin.includes('baimukhanalan1-5914s-projects')"),
  'Backend CORS must allow this project Vercel preview origins for auth smoke testing'
);

assert(
  main.includes('allowedOrigins.has(origin) || isAllowedVercelPreviewOrigin(origin)'),
  'Backend CORS must apply preview-origin allowlist in the origin callback'
);

console.log('CORS preview auth contract passed');
