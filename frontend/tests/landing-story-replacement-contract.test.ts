import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const app = read('src/App.tsx');
const landing = read('src/pages/LandingPage.tsx');
const css = read('src/index.css');

assert(app.includes("const LandingPage = lazy(() => import('./pages/LandingPage'))"), 'Root route must import the React landing page');
assert(!app.includes("LandingPatients = lazy(() => import('./pages/LandingPatients'))"), 'Root route must not use the old iframe landing wrapper');
assert(app.includes('<LandingPage user={user || undefined} />'), 'Root route must render LandingPage for public patients');
assert(landing.includes('takhet-story-page'), 'Patients landing must use the Story replacement shell');
assert(landing.includes('data-story-hero-wrap'), 'Story hero must be a scroll-driven sticky scene');
assert(landing.includes('data-story-manifest-wrap'), 'Story manifest must be a scroll-driven sticky scene');
assert(landing.includes('takhet-story-before-after'), 'Story before/after section must be present');
assert(landing.includes('<TakhetJourneyScroll />'), 'Current journey scroll block must remain as the preserved third-block exception');
assert(landing.includes('data-story-principles-wrap'), 'Story principles section must follow the preserved journey block as a 3D scroll scene');
assert(landing.includes('takhet-story-services'), 'Story services dark chapter must be present');
assert(landing.includes('data-story-testimonials-wrap'), 'Story testimonials must be scroll-driven');
assert(landing.includes('data-story-testimonials-ring'), 'Story testimonials must use the Claude-style 3D ring');
assert(landing.includes('data-story-corridor-wrap'), 'Story medical archive corridor must be present as a sticky scene');
assert(landing.includes('data-story-ai-wrap'), 'Story AI route section must be present as a sticky scene');
assert(landing.includes('takhet-story-final'), 'Story final CTA must be present');
assert(!landing.includes('t.landing.whyCards'), 'Old landing why-card section must not remain');
assert(!landing.includes('t.landing.capabilitiesTitle'), 'Old capabilities section must not remain');
assert(!landing.includes('TakhetTestimonials'), 'Old testimonial component must be replaced by Story testimonials');

assert(css.includes('.takhet-story-page'), 'Story replacement must have dedicated CSS');
assert(css.includes('.takhet-story-hero-wrap'), 'Story hero sticky scene must be styled');
assert(css.includes('.takhet-story-principles-wrap'), 'Story principles sticky scene must be styled');
assert(css.includes('.takhet-story-testimonials__ring'), 'Story testimonials ring must be styled');
assert(css.includes('.takhet-story-corridor-wrap'), 'Story corridor sticky scene must be styled');
assert(css.includes('.takhet-story-services'), 'Story services dark chapter must be styled');
assert(css.includes('.takhet-story-ai'), 'Story AI section must be styled');

console.log('Landing Story replacement contract passed');
