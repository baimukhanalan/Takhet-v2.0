import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const main = read('src/main.ts');
const envConfig = read('src/config/env.config.ts');

for (const header of [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Strict-Transport-Security',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
  'X-Permitted-Cross-Domain-Policies'
]) {
  assert(main.includes(header), `Backend bootstrap must set security header: ${header}`);
}

assert(main.includes("disable('x-powered-by')"), 'Backend must disable X-Powered-By');
assert(main.includes('allowedOrigins'), 'Backend CORS must use an explicit allowed origin list');
assert(main.includes('https://enterprise.takhet.com'), 'Backend CORS must allow enterprise subdomain explicitly');
assert(main.includes('https://labs.takhet.com'), 'Backend CORS must allow labs subdomain explicitly');

for (const marker of [
  'assertProductionRequiredSecret',
  'process.env.NODE_ENV',
  'APP_JWT_SECRET',
  'DATABASE_URL',
  'PII_ENCRYPTION_KEY',
  'replace-with-strong-secret'
]) {
  assert(envConfig.includes(marker), `Env config must include production guard marker: ${marker}`);
}

console.log('Backend security hardening contract passed');
