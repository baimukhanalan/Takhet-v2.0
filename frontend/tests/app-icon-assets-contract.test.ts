import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const pngDimensions = (path: string) => {
  const buffer = readFileSync(resolve(process.cwd(), path));
  assert(buffer.toString('ascii', 1, 4) === 'PNG', `${path} must be a PNG file`);
  return {
    buffer,
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
};

const readRgbaPixel = (buffer: Buffer, x: number, y: number) => {
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const colorType = buffer[25];
  assert(colorType === 6, 'PNG pixel contract expects RGBA icon assets');
  assert(x >= 0 && x < width && y >= 0 && y < height, 'PNG pixel sample must be within image bounds');

  let offset = 33;
  const chunks: Buffer[] = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') {
      chunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }

  const inflated = inflateSync(Buffer.concat(chunks));
  const bytesPerPixel = 4;
  const stride = 1 + width * bytesPerPixel;
  const rowLength = width * bytesPerPixel;
  const unfiltered = Buffer.alloc(height * rowLength);
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  };

  for (let row = 0; row < height; row += 1) {
    const filter = inflated[row * stride];
    const input = inflated.subarray(row * stride + 1, row * stride + 1 + rowLength);
    const outputStart = row * rowLength;
    const previousStart = (row - 1) * rowLength;

    for (let column = 0; column < rowLength; column += 1) {
      const left = column >= bytesPerPixel ? unfiltered[outputStart + column - bytesPerPixel] : 0;
      const up = row > 0 ? unfiltered[previousStart + column] : 0;
      const upLeft = row > 0 && column >= bytesPerPixel ? unfiltered[previousStart + column - bytesPerPixel] : 0;
      const current = input[column];
      const value =
        filter === 0 ? current :
        filter === 1 ? current + left :
        filter === 2 ? current + up :
        filter === 3 ? current + Math.floor((left + up) / 2) :
        filter === 4 ? current + paeth(left, up, upLeft) :
        NaN;
      assert(Number.isFinite(value), 'PNG pixel contract encountered an unsupported filter');
      unfiltered[outputStart + column] = value & 0xff;
    }
  }

  const index = y * rowLength + x * bytesPerPixel;
  return {
    r: unfiltered[index],
    g: unfiltered[index + 1],
    b: unfiltered[index + 2],
    a: unfiltered[index + 3]
  };
};

const expectedPngs: Record<string, number> = {
  'public/favicon-48.png': 48,
  'public/favicon-96.png': 96,
  'public/favicon-144.png': 144,
  'public/apple-touch-icon.png': 180,
  'public/apple-touch-icon-white.png': 180,
  'public/pwa-192.png': 192,
  'public/pwa-white-192.png': 192,
  'public/favicon.png': 500,
  'public/pwa-512.png': 512,
  'public/pwa-white-512.png': 512
};

for (const [path, size] of Object.entries(expectedPngs)) {
  const dimensions = pngDimensions(path);
  assert(dimensions.width === size && dimensions.height === size, `${path} must be ${size}x${size}`);
}

const browserFavicon = pngDimensions('public/favicon.png');
const browserCorner = readRgbaPixel(browserFavicon.buffer, 0, 0);
assert(browserCorner.a === 0, 'browser favicon.png must keep transparent corners');

for (const path of ['public/apple-touch-icon-white.png', 'public/pwa-white-192.png', 'public/pwa-white-512.png']) {
  const pwa = pngDimensions(path);
  const corner = readRgbaPixel(pwa.buffer, 0, 0);
  assert(corner.r === 255 && corner.g === 255 && corner.b === 255 && corner.a === 255, `${path} must have an opaque white background for installed PWA icons`);
}

const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/manifest.webmanifest'), 'utf8'));
assert(manifest.background_color === '#FFFFFF', 'manifest background_color must stay white for installed PWA splash/background');
const manifestIcons = new Map(manifest.icons.map((icon: any) => [icon.src, icon.sizes]));
assert(manifestIcons.get('/apple-touch-icon-white.png') === '180x180', 'manifest must point to the white 180x180 Apple icon');
assert(manifestIcons.get('/pwa-white-192.png') === '192x192', 'manifest must point to the white 192x192 PWA icon');
assert(manifestIcons.get('/pwa-white-512.png') === '512x512', 'manifest must point to the white 512x512 PWA icon');

const ico = readFileSync(resolve(process.cwd(), 'public/favicon.ico'));
assert(ico.readUInt16LE(0) === 0 && ico.readUInt16LE(2) === 1, 'favicon.ico must be a valid ICO file');
assert(ico.readUInt16LE(4) >= 1, 'favicon.ico must contain at least one icon image');

console.log('App icon assets contract passed');
