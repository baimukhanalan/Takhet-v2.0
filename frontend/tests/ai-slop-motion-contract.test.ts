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

const heroWaveCount = (landing.match(/className="takhet-hero-wave"/g) || []).length;
assert(heroWaveCount === 1, 'Landing hero must contain exactly one simple wave background layer');
assert(landing.includes('takhet-hero-wave__viewport'), 'Hero wave must be centered through a scoped viewport');
assert(landing.includes('takhet-hero-wave__svg'), 'Hero wave must use the scoped SVG wave layer');
assert((landing.match(/takhet-hero-wave__svg/g) || []).length >= 2, 'Hero wave must duplicate SVG segments for a seamless flow');
assert(landing.includes('takhet-hero-wave__track'), 'Hero wave must have a moving wave track');
assert((landing.match(/takhet-hero-wave__path/g) || []).length >= 3, 'Hero wave must use layered wave paths for a more natural movement');
assert(landing.includes('heroWaveCameraRef'), 'Hero wave camera must keep smoothed values without React rerenders');
assert(landing.includes('requestAnimationFrame'), 'Hero wave camera must smooth abrupt pointer movement with animation frames');
assert(landing.includes('handleHeroWavePointerMove'), 'Hero must react to pointer movement through the wave layer');
assert(landing.includes('onPointerMove={handleHeroWavePointerMove}'), 'Hero section must bind pointer movement');
assert(landing.includes('onPointerLeave={handleHeroWavePointerLeave}'), 'Hero section must reset pointer camera on leave');
assert(landing.includes("style.setProperty('--takhet-wave-camera-shift-x'"), 'Pointer movement must update only wave camera CSS variables');
assert(landing.includes("style.setProperty('--takhet-wave-camera-shift-y'"), 'Pointer movement must update vertical wave camera CSS variables');
assert(landing.includes("style.setProperty('--takhet-wave-camera-focus-x'"), 'Pointer movement must update horizontal perspective focus');
assert(landing.includes("style.setProperty('--takhet-wave-camera-focus-y'"), 'Pointer movement must update vertical perspective focus');
assert(landing.includes('relative z-10 w-full'), 'Hero content must remain centered above the wave layer');
assert(landing.includes('landingParallaxRef'), 'Landing mouse parallax must keep smoothed values without React rerenders');
assert(landing.includes('handleLandingParallaxPointerMove'), 'Landing must react to pointer movement through a scoped parallax layer');
assert(landing.includes('onPointerMove={handleLandingParallaxPointerMove}'), 'Landing shell must bind pointer movement');
assert(landing.includes('onPointerLeave={handleLandingParallaxPointerLeave}'), 'Landing shell must reset pointer parallax on leave');
assert(landing.includes("style.setProperty('--takhet-parallax-soft-x'"), 'Landing parallax must update soft horizontal depth variable');
assert(landing.includes("style.setProperty('--takhet-parallax-deep-y'"), 'Landing parallax must update deep vertical depth variable');
assert(landing.includes('data-takhet-parallax'), 'Landing must use opt-in parallax attributes instead of global transforms');
assert(landing.includes('customCursorRef'), 'Landing must use a custom cursor ref without React rerenders');
assert(landing.includes('takhet-custom-cursor'), 'Landing must render the scoped custom plus cursor');
assert(landing.includes('#64B5F6'), 'Custom cursor must use the logo plus blue');
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
assert(css.includes('.takhet-hero-wave'), 'CSS must define the hero wave background');
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
assert(css.includes('@keyframes takhet-hero-wave-drift'), 'Hero wave must use a lightweight CSS keyframe');
assert(css.includes('@keyframes takhet-hero-wave-travel'), 'Hero wave must include horizontal phase travel');
assert(css.includes('@keyframes takhet-hero-wave-swell'), 'Hero wave must include swell movement');
assert(css.includes('prefers-reduced-motion: reduce'), 'Hero wave must respect reduced motion preferences');
assert(!css.includes('takhet-webgl'), 'Hero wave must not reintroduce WebGL classes');

const heroWaveCssStart = css.indexOf('.takhet-hero-wave');
const heroWaveCssEnd = css.indexOf('@media (min-width: 390px)', heroWaveCssStart);
const heroWaveCss = css.slice(heroWaveCssStart, heroWaveCssEnd);

assert(heroWaveCss.includes('stroke: currentColor'), 'Hero wave must use one scoped platform color');
assert(heroWaveCss.includes('top: 50%'), 'Hero wave viewport must be vertically centered in the hero');
assert(heroWaveCss.includes('width: 200%'), 'Hero wave track must use two repeated segments for seamless flow');
assert(heroWaveCss.includes('translate3d(-50%, 0, 0)'), 'Hero wave travel must move exactly one duplicated segment');
assert(heroWaveCss.includes('perspective: 760px'), 'Hero wave must create a slightly stronger camera depth without moving content');
assert(heroWaveCss.includes('perspective-origin: var(--takhet-wave-camera-focus-x) var(--takhet-wave-camera-focus-y)'), 'Hero wave camera must react across both horizontal and vertical focus vectors');
assert(heroWaveCss.includes('rotateX(var(--takhet-wave-camera-tilt-x))'), 'Hero wave must tilt vertically from pointer movement');
assert(heroWaveCss.includes('rotateY(var(--takhet-wave-camera-tilt-y))'), 'Hero wave must tilt horizontally from pointer movement');
assert(heroWaveCss.includes('translateZ(var(--takhet-wave-camera-depth))'), 'Hero wave must use depth movement for a stronger camera effect');
assert(landing.includes('depth: distance * 38'), 'Hero wave pointer camera must use a stronger but bounded depth target');
assert(heroWaveCss.includes('transform-box: fill-box'), 'Hero wave paths must animate around their own wave geometry');
assert(!heroWaveCss.includes('radial-gradient'), 'Hero wave must not use glow-style radial gradients');
assert(!heroWaveCss.includes('box-shadow'), 'Hero wave must not use glow-style shadows');
assert(!heroWaveCss.includes('filter:'), 'Hero wave must not use blur/glow filters');
assert(!packageJson.includes('"@radix-ui/react-slot"'), 'Hero wave must not add shadcn button dependencies');
assert(!packageJson.includes('"class-variance-authority"'), 'Hero wave must not add shadcn variant dependencies');

console.log('Landing 3D removal contract tests passed');
