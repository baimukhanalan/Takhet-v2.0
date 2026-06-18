import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const pngDimensions = (path: string) => {
  const buffer = readFileSync(resolve(process.cwd(), path));
  assert(buffer.toString('ascii', 1, 4) === 'PNG', `${path} must be a PNG file`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
};

const expectedPngs: Record<string, number> = {
  'public/favicon-48.png': 48,
  'public/favicon-96.png': 96,
  'public/favicon-144.png': 144,
  'public/apple-touch-icon.png': 180,
  'public/pwa-192.png': 192,
  'public/favicon.png': 500,
  'public/pwa-512.png': 512
};

for (const [path, size] of Object.entries(expectedPngs)) {
  const dimensions = pngDimensions(path);
  assert(dimensions.width === size && dimensions.height === size, `${path} must be ${size}x${size}`);
}

const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/manifest.webmanifest'), 'utf8'));
const manifestIcons = new Map(manifest.icons.map((icon: any) => [icon.src, icon.sizes]));
assert(manifestIcons.get('/apple-touch-icon.png') === '180x180', 'manifest must point to the 180x180 Apple icon');
assert(manifestIcons.get('/pwa-192.png') === '192x192', 'manifest must point to the 192x192 PWA icon');
assert(manifestIcons.get('/pwa-512.png') === '512x512', 'manifest must point to the 512x512 PWA icon');

const ico = readFileSync(resolve(process.cwd(), 'public/favicon.ico'));
assert(ico.readUInt16LE(0) === 0 && ico.readUInt16LE(2) === 1, 'favicon.ico must be a valid ICO file');
assert(ico.readUInt16LE(4) >= 1, 'favicon.ico must contain at least one icon image');

console.log('App icon assets contract passed');
