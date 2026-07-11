import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const landing = read('src/pages/LandingPage.tsx');
const journey = read('src/components/TakhetJourneyScroll.tsx');
const css = read('src/index.css');

assert(landing.includes("import TakhetJourneyScroll from '../components/TakhetJourneyScroll'"), 'Landing must import the isolated journey component');
assert(landing.includes('<TakhetJourneyScroll />'), 'Landing must render the journey component');

const beforeAfterPosition = landing.indexOf('takhet-story-before-after');
const journeyPosition = landing.indexOf('<TakhetJourneyScroll />');
const principlesPosition = landing.indexOf('takhet-story-principles');
assert(beforeAfterPosition >= 0, 'Story before/after section must be present before the preserved journey block');
assert(journeyPosition > beforeAfterPosition && journeyPosition < principlesPosition, 'Journey must sit strictly between the Story before/after and principles sections');

assert(journey.includes('Как Takhet+ сопровождает вас на каждом этапе'), 'Journey must use the requested heading');
assert((journey.match(/mediaKind: '(?:image|video)',\n/g) || []).length === 5, 'Journey must define exactly five media slots');
assert((journey.match(/items: \[/g) || []).length === 5, 'Journey must define exactly five sets of subsections');
assert(journey.includes("mediaKind: 'video'"), 'The fifth future media slot must be reserved for video');
assert(journey.includes("mediaSrc: '/media/journey/stage-01-tablet.webp'"), 'Stage 01 must use supplied photo 04');
assert(journey.includes("mediaSrc: '/media/journey/stage-02-ai-mobile.webp'"), 'Stage 02 must use supplied photo 02');
assert(journey.includes("mediaSrc: '/media/journey/stage-03-doctor-search.webp'"), 'Stage 03 must use supplied photo 01');
assert(journey.includes("mediaSrc: '/media/journey/stage-04-mobile-menu.webp'"), 'Stage 04 must use supplied photo 03');
assert(journey.includes("mediaSrc: '/media/journey/stage-05-continuity.mp4'"), 'Stage 05 must use the supplied video');
assert(journey.includes('<img'), 'Journey image stages must render real supplied images');
assert(journey.includes('<video'), 'Journey final stage must render the supplied video');
assert(!journey.includes('                  loop'), 'Final background video must stop on its last frame instead of looping');
assert(journey.includes('video.play()'), 'Final background video must play only when its stage is active');
assert(journey.includes('videoRef.current?.pause()'), 'Final background video must pause outside its stage');
assert(journey.includes('preload="auto"'), 'Final background video must preload before its stage becomes active');
assert(journey.includes('onCanPlay'), 'Final background video must retry playback when the media becomes ready');
assert(journey.includes('videoPlaybackBlocked'), 'Final background video must expose a recovery control when autoplay is blocked');
assert(journey.includes('takhet-journey__reduced-video'), 'Reduced-motion users must retain an explicit video control');
assert(journey.includes('reducedMotionEnabled ? undefined'), 'Reduced-motion stages must remain available to assistive navigation');
assert(journey.includes("window.addEventListener('scroll'"), 'Journey must react to document scroll');
assert(journey.includes('requestAnimationFrame(updateFromScroll)'), 'Journey scroll work must be frame-batched');
assert(journey.includes('scrollToStage'), 'Journey stage rail must navigate to each scroll stage');
assert(journey.includes('takhet-journey__nav-button'), 'Journey stage controls must expose a stable interaction selector');
assert(journey.includes("matchMedia('(prefers-reduced-motion: reduce)')"), 'Journey must respect reduced motion');

assert(css.includes('.takhet-journey'), 'Journey must have isolated BEM-style CSS');
assert(css.includes('height: 900svh'), 'Journey must provide a long two-viewport scroll interval between stages');
assert(css.includes('position: sticky'), 'Journey viewport must remain pinned during stage transitions');
assert(css.includes('top: 50%') && css.includes('transform: translate3d(0, -50%, 0)'), 'Each desktop journey stage and the stage rail must share the same proportional vertical center');
assert(css.includes('overflow-x: clip'), 'Root overflow clipping must preserve sticky positioning');
assert(landing.includes('overflow-x-clip'), 'Landing shell must not create a scroll container that breaks sticky positioning');
assert(css.includes('.takhet-journey__media'), 'Journey must reserve an empty future media layer');
assert(css.includes('object-fit: cover'), 'Journey media must cover the full pinned viewport');
assert(css.includes('background: rgba(4, 14, 36, 0.62)'), 'Journey media must retain a readable solid navy overlay');
assert(css.includes('.takhet-journey__video-play'), 'Journey must style the blocked-autoplay recovery control');
assert(css.includes('.takhet-journey__reduced-video'), 'Journey must style the reduced-motion video fallback');

console.log('Landing five-stage scroll journey contract passed');
