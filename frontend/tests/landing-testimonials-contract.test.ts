import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const landing = read('src/pages/LandingPage.tsx');
const testimonials = read('src/components/TakhetTestimonials.tsx');
const css = read('src/index.css');

const controlSection = landing.indexOf('t.landing.controlTitle');
const testimonialsPosition = landing.indexOf('<TakhetTestimonials />');
const philosophySection = landing.indexOf('t.landing.philosophy');

if (!(controlSection > -1 && testimonialsPosition > controlSection && philosophySection > testimonialsPosition)) {
  throw new Error('Testimonials must stay between the sixth control section and seventh philosophy section');
}

if ((testimonials.match(/name: '/g) || []).length !== 5) {
  throw new Error('Testimonials must define exactly five user stories');
}

if ((testimonials.match(/image: '\/media\/testimonials\//g) || []).length !== 5) {
  throw new Error('Every testimonial must render a supplied portrait');
}

if (!testimonials.includes("name: 'Emily Chen'") || !testimonials.includes("name: 'James Patel'")) {
  throw new Error('The supplied testimonial identities must be preserved');
}

if (!testimonials.includes("window.matchMedia('(prefers-reduced-motion: reduce)')")) {
  throw new Error('Carousel navigation must respect reduced motion');
}

if (!testimonials.includes('requestAnimationFrame(updateActiveCard)')) {
  throw new Error('Scroll state updates must be frame-batched');
}

if (!css.includes('scroll-snap-type: x mandatory') || !css.includes('scroll-snap-align: center')) {
  throw new Error('Testimonials must use native horizontal scroll snap');
}

if (!css.includes(".takhet-testimonials__card[data-active='true']")) {
  throw new Error('The active testimonial must remain visually distinct');
}

console.log('Landing testimonials carousel contract passed');
