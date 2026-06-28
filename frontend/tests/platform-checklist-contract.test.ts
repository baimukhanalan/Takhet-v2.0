import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const app = read('src/App.tsx');
const css = read('src/index.css');
const publicHeader = read('src/components/PublicHeader.tsx');
const authPage = read('src/pages/AuthPage.tsx');
const landingPage = read('src/pages/LandingPage.tsx');
const mentalPage = read('src/pages/MentalPage.tsx');
const takhetAi = read('src/pages/TakhetAIChat.tsx');
const doctorsPage = read('src/pages/DoctorsPage.tsx');
const enterpriseApp = read('src/pages/EnterpriseApp.tsx');
const chatStream = read('api/ai/chat-stream.ts');
const healthBrowserApi = read('api/ai/health-insights.ts');
const coordinatorApi = read('api/site-coordinator.ts');

for (const route of ['/', '/services', '/takhet-ai/try', '/doctors', '/partners', '/mental', '/takhet-labs', '/enterprise']) {
  assert(publicHeader.includes(`path: '${route}'`), `Public header/burger must keep route ${route}`);
}

assert(app.includes('PlatformMotionShell'), 'App must use a shared PlatformMotionShell for global cursor and public-page motion');
assert(app.includes('PUBLIC_MOTION_ROUTES'), 'App must explicitly list public pages that receive rich motion');
assert(app.includes('PUBLIC_MOTION_ROUTES.has(pathname)'), 'Rich public motion must be route-scoped, not applied blindly to every portal');
assert(css.includes('.takhet-platform-motion-shell'), 'CSS must define the shared platform motion shell');
assert(css.includes('.takhet-platform-cursor'), 'CSS must define the shared custom cursor');
assert(css.includes('width: 40px'), 'Custom plus cursor must expose a stable full-area interaction footprint');
assert(css.includes('.takhet-platform-motion-shell--rich [data-takhet-parallax]'), 'Public pages must support opt-in rich parallax');
assert(css.includes('.takhet-platform-motion-shell--portal'), 'Portal motion must have a lightweight mode');

assert(authPage.includes('resolveAuthReturnTarget'), 'Auth back navigation must resolve the source landing from location.state.from');
assert(authPage.includes('openLogin'), 'Register mode must expose a bottom login action');
assert(authPage.includes("mode === 'register' ? openLogin : openRegister"), 'Auth footer must switch between login/register actions');
assert(authPage.includes('Подтвердите почту'), 'Auth copy must be readable UTF-8 for email verification');

assert(landingPage.includes('data-admin-portal-entry'), 'Main landing page must keep the subtle admin portal entry at the bottom');
assert(landingPage.includes("navigate('/admin-auth')"), 'Admin portal entry must route to the admin auth page');
assert(landingPage.includes('hover:opacity-100') && landingPage.includes('focus-visible:opacity-100'), 'Admin portal entry must reveal on hover and keyboard focus');
assert(landingPage.includes('t.common.adminPortal'), 'Admin portal entry must use the shared i18n label');

assert(!mentalPage.includes('if (!isPortal) return;'), 'Mental public page must load specialists and filters, not portal-only');
assert(!mentalPage.includes('Открыть полный Takhet AI'), 'Mental chat block must not show a separate full Takhet AI button');
assert(mentalPage.includes('openSoulfulMode'), 'Mental expand action must open full Takhet AI soulful mode');
assert(mentalPage.includes('data-takhet-tilt'), 'Mental specialist cards should opt into shared soft 3D tilt');

assert(takhetAi.includes("value: '/guest-consultation'"), 'Guest Takhet AI find-doctor action must route to guest consultation');
assert(takhetAi.includes("value: '/mental'"), 'Guest soulful specialist action must route to public Mental page');

assert(doctorsPage.includes('Takhet+ готовит контекст'), 'Doctors hero subtitle must use clear readable product copy');
assert(enterpriseApp.includes('Цифровое медицинское сопровождение предприятий'), 'Enterprise hero must use requested positioning copy');

assert(chatStream.includes('maxOutputTokens: 2200'), 'Streaming chat must raise maxOutputTokens to reduce answer truncation');
assert(!chatStream.includes("cleanStreamChunk(chunk.text || '')"), 'Streaming must not destructively clean every chunk before writing it');
assert(healthBrowserApi.includes('HEALTH_BROWSER_SINGLE_PASS'), 'AI Browser must use a single-pass response path before expensive fallback generation');
assert(healthBrowserApi.includes('maxOutputTokens: medical ? 1600 : 1400'), 'AI Browser token limits must be raised to reduce truncated answers');
assert(coordinatorApi.includes('maxOutputTokens: 900'), 'Coordinator must allow enough output for complete route-first answers');

console.log('Platform checklist frontend contract passed');
