import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const exists = (path: string) => existsSync(resolve(process.cwd(), path));

const landing = read('src/pages/LandingPage.tsx');
const heroFlow = read('src/components/HeroFlowCanvas.tsx');
const css = read('src/index.css');
const viteConfig = read('vite.config.ts');
const packageJson = read('package.json');

const forbiddenFiles = [
  'src/components/webgl/TakhetWebGLStage.tsx',
  'src/components/webgl/MedicalCoreScene.tsx',
  'src/components/webgl/CinematicPostProcess.tsx',
  'src/components/universe/TakhetUniverseHero.tsx',
  'src/hooks/useLandingSectionProgress.ts',
  'src/hooks/useLandingTiltCards.ts',
  'src/services/webglQuality.ts',
];

for (const file of forbiddenFiles) {
  assert(!exists(file), `${file} must be removed`);
}

const forbiddenLandingMarkers = [
  'TakhetWebGLStage',
  'MedicalCoreScene',
  'TakhetUniverseHero',
  'useLandingSectionProgress',
  'useLandingTiltCards',
  'data-webgl-section',
  'data-tilt-card',
  'takhet-webgl',
  'takhet-tilt-card',
  'takhet-universe',
  "@react-three/fiber",
  "import('gsap')",
  "import('gsap/ScrollTrigger')",
];

for (const marker of forbiddenLandingMarkers) {
  assert(!landing.includes(marker), `Landing page must not contain ${marker}`);
}

const forbiddenCssMarkers = [
  'takhet-webgl',
  'takhet-tilt-card',
  'takhet-universe',
];

for (const marker of forbiddenCssMarkers) {
  assert(!css.includes(marker), `CSS must not contain ${marker}`);
}

assert(!viteConfig.includes('webgl-vendor'), 'Vite config must not keep WebGL vendor chunk');
assert(!packageJson.includes('"@react-three/fiber"'), 'package.json must not depend on @react-three/fiber');
assert(!packageJson.includes('"three"'), 'package.json must not depend on three');
assert(!packageJson.includes('"gsap"'), 'package.json must not depend on gsap');

assert(landing.includes('<HeroFlowCanvas searchRef={heroSearchRef} />'), 'Landing hero must render the exact canvas flow background');
assert(landing.includes('data-takhet-flow-hero'), 'Canvas flow must be scoped to the hero section');
assert(heroFlow.includes('const FLOW_LINES'), 'Canvas flow must keep a stable layered line model');
assert((heroFlow.match(/\{ ry:/g) || []).length === 9, 'Canvas flow must render the nine reference wave layers');
assert(heroFlow.includes("window.addEventListener('pointermove'"), 'Canvas flow must react to the pointer');
assert(heroFlow.includes('cursor.amount'), 'Canvas flow must ramp local cursor influence smoothly');
assert(heroFlow.includes('1.35 * influence'), 'Canvas waves must swell locally around the pointer');
assert(heroFlow.includes('cursor.lag'), 'Canvas waves must slow locally around the pointer');
assert(heroFlow.includes('window.scrollY / 600'), 'Canvas wave speed must respond to scroll progress');
assert(heroFlow.includes('requestAnimationFrame(tick)'), 'Canvas flow must animate with requestAnimationFrame');
assert(heroFlow.includes("matchMedia('(prefers-reduced-motion: reduce)')"), 'Canvas flow must respect reduced motion');
assert(landing.includes('landingParallaxRef'), 'Landing mouse parallax must keep smoothed values without React rerenders');
assert(landing.includes('handleLandingParallaxPointerMove'), 'Landing must react to pointer movement through a scoped parallax layer');
assert(landing.includes('onPointerMove={handleLandingParallaxPointerMove}'), 'Landing shell must bind pointer movement');
assert(landing.includes('onPointerLeave={handleLandingParallaxPointerLeave}'), 'Landing shell must reset pointer parallax on leave');
assert(landing.includes("style.setProperty('--takhet-parallax-soft-x'"), 'Landing parallax must update soft horizontal depth variable');
assert(landing.includes("style.setProperty('--takhet-parallax-deep-y'"), 'Landing parallax must update deep vertical depth variable');
assert(landing.includes('data-takhet-parallax'), 'Landing must use opt-in parallax attributes instead of global transforms');
assert(landing.includes('customCursorRef'), 'Landing must use a custom cursor ref without React rerenders');
assert(landing.includes('takhet-custom-cursor'), 'Landing must render the scoped custom plus cursor');
assert(landing.includes('#7C8EE0'), 'Custom cursor must use the new hero periwinkle blue');
assert(landing.includes('writeCustomCursorPosition'), 'Custom cursor must update directly like a normal cursor');
assert(!landing.includes('customCursorMotionRef'), 'Custom cursor must not use inertial trailing state');
assert(!landing.includes('animateCustomCursor'), 'Custom cursor must not animate behind the real pointer');
assert(!landing.includes('setCustomCursorTarget'), 'Custom cursor must not use a delayed target cursor');
assert(landing.includes('data-takhet-tilt'), 'Landing cards must opt into 3D tilt');
assert(landing.includes("style.setProperty('--takhet-tilt-x'"), '3D tilt must update vertical tilt variable');
assert(landing.includes("style.setProperty('--takhet-tilt-y'"), '3D tilt must update horizontal tilt variable');
assert(landing.includes('data-takhet-magnetic-button'), 'Landing CTA buttons must opt into magnetic movement');
assert(landing.includes("style.setProperty('--takhet-magnetic-x'"), 'Magnetic buttons must update horizontal pull variable');
assert(landing.includes("style.setProperty('--takhet-magnetic-y'"), 'Magnetic buttons must update vertical pull variable');
assert(css.includes('.takhet-flow-hero'), 'CSS must define the new flow hero');
assert(css.includes('.takhet-flow-canvas'), 'CSS must keep the canvas full-bleed inside the hero');
assert(css.includes('.takhet-landing-shell'), 'CSS must scope landing parallax variables to the landing shell');
assert(css.includes('[data-takhet-parallax]'), 'CSS must define opt-in parallax elements');
assert(css.includes('[data-takhet-parallax="soft"]'), 'CSS must define soft parallax depth');
assert(css.includes('[data-takhet-parallax="deep"]'), 'CSS must define deep parallax depth');
assert(css.includes('.takhet-custom-cursor'), 'CSS must define the custom plus cursor');
assert(css.includes('cursor: none'), 'Landing must hide the default cursor only where the custom cursor is active');
assert(css.includes('.takhet-landing-shell *'), 'Landing must hide the default cursor on all nested hover targets');
assert(css.includes('width: 32px'), 'Custom plus cursor must be slightly larger than the previous version');
assert(css.includes('[data-takhet-tilt]'), 'CSS must define opt-in 3D tilt cards');
assert(css.includes('rotateX(var(--takhet-tilt-x))'), '3D tilt must use rotateX');
assert(css.includes('rotateY(var(--takhet-tilt-y))'), '3D tilt must use rotateY');
assert(css.includes('transform 620ms cubic-bezier(0.16, 1, 0.3, 1)'), '3D tilt cards must use a softer hover transition');
assert(landing.includes('(-y * 3.25)'), '3D tilt vertical amplitude must be reduced for smoother hover');
assert(landing.includes('(x * 3.75)'), '3D tilt horizontal amplitude must be reduced for smoother hover');
assert(landing.includes("'6px'"), '3D tilt lift must be reduced so cards do not jump on hover');
assert(landing.includes('x * 16'), '3D tilt glare movement must be calmer horizontally');
assert(landing.includes('y * 14'), '3D tilt glare movement must be calmer vertically');
assert(css.includes('[data-takhet-magnetic-button]'), 'CSS must define magnetic buttons');
assert(css.includes('translate: var(--takhet-magnetic-x) var(--takhet-magnetic-y)'), 'Magnetic button movement must use individual translate to avoid breaking existing transforms');
assert(css.includes('prefers-reduced-motion: reduce'), 'Hero motion must respect reduced motion preferences');
assert(!css.includes('takhet-webgl'), 'Hero flow must not reintroduce WebGL classes');
assert(css.includes("font-family: 'Manrope', sans-serif"), 'Hero must use the reference Manrope typography');
assert(css.includes('font-size: clamp(56px, 11vw, 172px)'), 'Hero title must preserve the reference scale');
assert(css.includes('width: min(820px, 92vw)'), 'Hero search must preserve the reference width');
assert(css.includes('height: 80px'), 'Hero search must preserve the reference height');
assert(!packageJson.includes('"@radix-ui/react-slot"'), 'Hero wave must not add shadcn button dependencies');
assert(!packageJson.includes('"class-variance-authority"'), 'Hero wave must not add shadcn variant dependencies');

console.log('Landing 3D removal contract tests passed');
