import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const apiSource = readFileSync(join(process.cwd(), 'services/api.ts'), 'utf8');

assert(
  apiSource.includes("hostname.endsWith('.vercel.app')") &&
    apiSource.includes("return 'https://api.takhet.com';"),
  'Vercel preview deployments must call https://api.takhet.com instead of the static frontend origin'
);

assert(
  apiSource.includes("if (/takhet\\.com$/i.test(hostname))") &&
    apiSource.includes("return 'https://api.takhet.com';"),
  'Takhet production domains must call https://api.takhet.com'
);

console.log('API URL resolution contract passed');
