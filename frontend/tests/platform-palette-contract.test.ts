import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const root = process.cwd();
const scanRoots = [
  'src/components',
  'src/pages',
  'src/index.css',
  'pages',
  'components',
];

const extensions = new Set(['.ts', '.tsx', '.css', '.html']);
const forbiddenPaletteMarkers = [
  'green-',
  'emerald-',
  'teal-',
  'lime-',
  '#00C853',
  '#00c853',
  '#00BFA5',
  '#00bfa5',
  '#10b981',
  '#22c55e',
  '#16a34a',
  '#059669',
  '#34d399',
  '#4ade80',
];

const walk = (path: string): string[] => {
  const absolute = resolve(root, path);
  const stat = statSync(absolute);
  if (stat.isFile()) return [absolute];

  return readdirSync(absolute).flatMap((entry) => walk(join(absolute, entry)));
};

const files = scanRoots.flatMap((path) => walk(path)).filter((path) => {
  const ext = path.slice(path.lastIndexOf('.'));
  return extensions.has(ext);
});

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const marker of forbiddenPaletteMarkers) {
    assert(
      !source.includes(marker),
      `${relative(root, file)} must not use green/emerald/teal/lime palette marker: ${marker}`
    );
  }
}

const css = readFileSync(resolve(root, 'src/index.css'), 'utf8');
assert(css.includes('--foreground: #0E1F44;'), 'Foreground token must match the new hero navy');
assert(css.includes('--primary: #1D4ED8;'), 'Primary token must match the new hero cobalt');
assert(css.includes('--accent: #7C8EE0;'), 'Accent token must match the new hero periwinkle');
assert(css.includes('--success: #1D4ED8;'), 'Success token must be blue-aligned to avoid green shades');
assert(css.includes('--secondary: #EEF2FE;'), 'Secondary token must use the new blue-tinted neutral');
assert(css.includes('--muted-foreground: #5D6B86;'), 'Muted text must match the hero copy color');
assert(css.includes('--border: #E7EBF4;'), 'Border token must match the hero controls');

console.log('Platform palette contract tests passed');
