import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const landingPage = readFileSync(resolve(process.cwd(), 'src/pages/LandingPage.tsx'), 'utf8');

assert(
  landingPage.includes('data-hero-action-hover-trigger'),
  'Patient hero quick actions must expose dedicated hover triggers'
);

assert(
  landingPage.includes('data-hero-action-hover-preview'),
  'Patient hero quick actions must render mini hover previews'
);

[
  '/guest-consultation',
  '/ai-consultation',
  '/takhet-ai',
  '/ai-lab',
  '/archive'
].forEach((path) => {
  assert(
    landingPage.includes(`'${path}'`),
    `Patient hero quick action preview must cover ${path}`
  );
});

assert(
  landingPage.includes('guestPreviewDays'),
  'Guest consultation preview must use dynamic date/slot data instead of a static screenshot'
);

assert(
  landingPage.includes('actionPreviewByPath'),
  'Patient hero previews must be driven by a shared preview map'
);

assert(
  landingPage.includes('renderHeroActionInterfacePreview'),
  'Patient hero previews must render real interface miniatures, not generic cards'
);

[
  "interfaceKind: 'guest-booking'",
  "interfaceKind: 'ai-video-room'",
  "interfaceKind: 'takhet-ai-chat'",
  "interfaceKind: 'ai-analysis-lab'",
  "interfaceKind: 'medical-archive'"
].forEach((contract) => {
  assert(
    landingPage.includes(contract),
    `Patient hero preview is missing real interface contract ${contract}`
  );
});

assert(
  landingPage.includes('data-hero-action-interface-preview'),
  'Each hover window must expose a miniature of the corresponding real interface'
);

assert(
  landingPage.includes('Лаборатория ИИ') && landingPage.includes('Медицинский архив') && landingPage.includes('Дата и время'),
  'Analysis, archive, and booking previews must use real screen labels from their destination interfaces'
);

assert(
  landingPage.includes('Видео-консультация') && landingPage.includes('Takhet AI'),
  'AI consultation and Takhet AI previews must use real interface labels'
);

assert(
  landingPage.includes('portalFrame') && landingPage.includes('screenPreview'),
  'Login-gated actions must use screenshot-like portal frames'
);

assert(
  !landingPage.includes('screenshotLike'),
  'Old generic screenshotLike previews must be replaced with concrete interface previews'
);

assert(
  landingPage.includes('SMS') && landingPage.includes('PDF'),
  'Guest consultation preview must communicate SMS confirmation and one-time PDF flow'
);

console.log('Hero action hover preview contract passed');
