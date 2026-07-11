import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const landing = read('src/pages/LandingPage.tsx');
const css = read('src/index.css');

const servicesPosition = landing.indexOf('takhet-story-services');
const testimonialsPosition = landing.indexOf('takhet-story-testimonials-wrap');
const mapPosition = landing.indexOf('takhet-story-map');

assert(
  servicesPosition > -1 && testimonialsPosition > servicesPosition && mapPosition > testimonialsPosition,
  'Story testimonials must sit after services and before map coverage'
);

assert((landing.match(/name: '/g) || []).length === 5, 'Story testimonials must define exactly five user stories');

const testimonialImages = [...landing.matchAll(/image: '(\/media\/testimonials\/[^']+)'/g)].map((match) => match[1]);
assert(testimonialImages.length === 5, 'Every Story testimonial must render a supplied portrait');
assert(new Set(testimonialImages).size === 5, 'All five supplied testimonial photos must be used exactly once');
assert(testimonialImages.includes('/media/testimonials/david-kim.webp'), 'David Kim must use his own supplied portrait');

assert(landing.includes("name: 'Emily Chen'") && landing.includes("name: 'James Patel'"), 'The supplied testimonial identities must be preserved');
assert(landing.includes('data-story-testimonials-ring'), 'Story testimonials must use a scroll-driven ring stage');
assert(landing.includes('data-story-testimonial-card'), 'Story testimonials must expose cards to the scroll animation loop');
assert(!landing.includes('[...testimonials, ...testimonials]'), 'Story testimonials must not be the old horizontal marquee loop');
assert(css.includes('.takhet-story-testimonials-wrap'), 'Story testimonials sticky wrapper must be styled');
assert(css.includes('.takhet-story-testimonials__ring'), 'Story testimonials 3D ring must be styled');
assert(css.includes('transform-style: preserve-3d'), 'Story testimonials must preserve 3D transforms');

console.log('Landing Story testimonials contract passed');
