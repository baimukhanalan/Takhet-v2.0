import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const json = <T>(path: string) => JSON.parse(read(path)) as T;

const packageJson = json<{ dependencies?: Record<string, string> }>('package.json');
const enterprise = read('src/pages/EnterpriseApp.tsx');
const labs = read('src/pages/TakhetLabsPage.tsx');

assert(packageJson.dependencies?.animejs, 'animejs must be installed as a frontend dependency');

assert(enterprise.includes("from 'animejs'"), 'Enterprise ROI must import Anime.js');
assert(enterprise.includes('displayedMonthlySavings'), 'Enterprise ROI must animate the visible monthly savings value');
assert(enterprise.includes('displayedYearlySavings'), 'Enterprise ROI must animate the visible yearly savings value');
assert(enterprise.includes('animate(animatedValue'), 'Enterprise ROI must use Anime.js for numeric transitions');

assert(labs.includes("from 'animejs'"), 'Takhet Labs must import Anime.js');
assert(labs.includes('graphRef'), 'Takhet Labs dynamic graph must have an animation ref');
assert(labs.includes('animate(graphRef.current'), 'Takhet Labs graph must use Anime.js on scenario changes');
assert(labs.includes('transition-all duration-700'), 'Takhet Labs should keep CSS transitions for bar width while Anime.js handles graph entrance');

console.log('Anime.js motion contract passed');
