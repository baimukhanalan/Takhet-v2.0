import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const app = read('src/App.tsx');
const css = read('src/index.css');
const landing = read('src/pages/LandingPage.tsx');
const fadeIn = read('src/components/FadeIn.tsx');
const motionShell = read('src/components/PlatformMotionShell.tsx');
const takhetAi = read('src/pages/TakhetAIChat.tsx');
const aiBrowser = read('src/pages/AIHealthBrowser.tsx');
const mental = read('src/pages/MentalPage.tsx');
const aiVideo = read('src/pages/AIConsultationRoom.tsx');
const coordinator = read('src/components/AIChatOverlay.tsx');
const geminiClient = read('src/services/gemini.ts');
const chatStream = read('api/ai/chat-stream.ts');
const aiShared = read('api/ai/_shared.ts');

assert(existsSync(resolve(process.cwd(), 'src/services/guestAiUsage.ts')), 'Shared guest AI usage service must exist');
const guestUsage = read('src/services/guestAiUsage.ts');
assert(guestUsage.includes('GUEST_AI_REQUEST_LIMIT = 3'), 'Every guest AI system must allow exactly three requests');
for (const system of ['takhet-ai', 'ai-browser', 'mental-ai', 'ai-video']) {
  assert(guestUsage.includes(`'${system}'`), `Guest limit must have an independent ${system} bucket`);
}

assert(takhetAi.includes("consumeGuestAiRequest('takhet-ai')"), 'Guest Takhet AI must consume its own request bucket');
assert(aiBrowser.includes("consumeGuestAiRequest('ai-browser')"), 'Guest AI Browser must consume its own request bucket');
assert(aiBrowser.includes('searchParamSyncRef'), 'AI Browser URL synchronization must not spend two guest requests for one search');
assert(mental.includes("consumeGuestAiRequest('mental-ai')"), 'Guest Mental AI must consume its own request bucket');
assert(aiVideo.includes("consumeGuestAiRequest('ai-video')"), 'Guest video AI must consume its own request bucket');
assert(!coordinator.includes('consumeGuestAiRequest'), 'Platform coordinator must remain exempt from guest request limits');
assert(coordinator.includes('isPlatformCoordinatorQuestion'), 'Platform coordinator must reject off-platform questions locally');
assert(geminiClient.includes('AI_FIRST_RESPONSE_TIMEOUT_MS = 12000'), 'AI clients must fail over instead of waiting indefinitely for first output');
assert(geminiClient.includes('AI_STREAM_IDLE_TIMEOUT_MS = 12000'), 'AI clients must detect stalled streams');
assert(geminiClient.includes('readAiTextStream'), 'AI text systems must share one resilient stream reader');
assert(chatStream.includes('maxOutputTokens: 2200'), 'Streaming answers must have enough output budget to finish');
assert(chatStream.includes('MAX_TOKENS'), 'Streaming endpoint must continue answers stopped by the model token limit');
assert(aiShared.includes('[FAST_MODEL, PRO_MODEL, FALLBACK_MODEL]'), 'Complex text requests must remain Flash-first for latency');

assert(landing.includes('heroPlaceholders'), 'Landing search must use translated rotating placeholders');
assert(landing.includes('typedHeroPlaceholder'), 'Landing search must render a typed placeholder value');
assert(fadeIn.includes('staggerDelay'), 'Shared landing card container must expose stagger timing');
assert(fadeIn.includes('index * staggerDelay'), 'Landing cards must enter one after another');
assert(fadeIn.includes('data-takhet-stagger'), 'Sequential landing groups must be observable in rendered QA');

assert(app.includes('PlatformMotionShell variant={publicMotionVariant}'), 'Every public page must render inside the global motion shell');
assert(motionShell.includes('findExpandedInteractiveTarget'), 'Global custom cursor must resolve controls across its full area');
assert(motionShell.includes("document.addEventListener('click'"), 'Global custom cursor must forward clicks from its expanded area');
assert(motionShell.includes('takhet-cursor-hit'), 'Global cursor must expose hover state for expanded targets');
assert(!css.includes('outline: 2px solid rgba(37, 84, 217, 0.3)'), 'Expanded cursor hover state must not draw a technical outline around controls');
assert(css.includes('width: 40px') && css.includes('height: 40px'), 'Global plus cursor must use a stable 40px interaction footprint');

assert(css.includes('font-size: clamp(44px, 15vw, 64px)'), 'Mobile hero name must be reduced proportionally');
assert(css.includes('font-size: 13px'), 'Mobile hero description must be reduced proportionally');

console.log('Guest AI, global cursor, landing stagger and mobile hero contract passed');
