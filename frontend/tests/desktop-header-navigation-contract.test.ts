import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

if (css.includes('@media (max-width: 1535px) {\n  .takhet-flow-header__nav {\n    display: none;')) {
  throw new Error('Desktop and laptop widths must not collapse the primary navigation into the burger menu');
}

if (!css.includes('@media (min-width: 1200px) and (max-width: 1535px)')) {
  throw new Error('Laptop widths must use a compact full-navigation header layout');
}

if (!css.includes('@media (max-width: 1199px)') || !css.includes('.takhet-flow-header__menu')) {
  throw new Error('The burger menu must be limited to tablet and mobile widths');
}

console.log('Desktop header navigation contract passed');
