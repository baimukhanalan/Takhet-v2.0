import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const mainSource = readFileSync(resolve(root, 'src/main.tsx'), 'utf8');
const serviceWorkerSource = readFileSync(resolve(root, 'public/sw.js'), 'utf8');

assert(
  !mainSource.includes('navigator.serviceWorker.register('),
  'main.tsx must not register the PWA service worker while recovering from white-screen cache issues.'
);

assert(
  serviceWorkerSource.includes('caches.delete') && serviceWorkerSource.includes('registration.unregister'),
  'sw.js must clear old caches and unregister itself so stale broken bundles cannot keep serving.'
);

console.log('service-worker rollback contract passed');
