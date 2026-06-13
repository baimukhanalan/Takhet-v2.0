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
assert(css.includes('--accent: #64B5F6;'), 'Accent token must use Takhet+ blue, not green/teal');
assert(css.includes('--success: #1D4ED8;'), 'Success token must be blue-aligned to avoid green shades');
assert(css.includes('--secondary: #EAF2FF;'), 'Secondary token must use a blue-tinted neutral');

console.log('Platform palette contract tests passed');
