import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const source = readFileSync(resolve(process.cwd(), 'src/pages/AIConsultationRoom.tsx'), 'utf8');
const viteConfig = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

assert(
  source.includes('import.meta.env.VITE_GEMINI_API_KEY'),
  'AI video consultation must read Gemini key from Vite public env in browser builds'
);

assert(
  source.includes('process.env.GEMINI_API_KEY') &&
    source.includes('process.env.API_KEY') &&
    !source.includes('getRuntimeEnvValue('),
  'AI video consultation browser build must read statically replaced Vite process.env keys, not dynamic process.env lookups'
);

for (const defineKey of [
  "'process.env.GEMINI_API_KEY'",
  "'process.env.API_KEY'",
  "'process.env.GEMINI_LIVE_MODEL'"
]) {
  assert(
    viteConfig.includes(defineKey),
    `Vite production build must statically define ${defineKey} for AI video consultation`
  );
}

assert(
  source.includes('import.meta.env.VITE_GEMINI_LIVE_MODEL'),
  'AI video consultation must allow overriding the current Gemini Live model from env'
);

assert(
  source.includes("gemini-3.1-flash-live-preview"),
  'AI video consultation must default to the current low-latency Gemini Live model'
);

assert(
  source.includes('preserveMediaStream'),
  'AI video consultation startup cleanup must be able to preserve an already authorized camera/microphone stream'
);

assert(
  source.includes('cleanupLive({ preserveMediaStream: true })'),
  'AI video consultation must not stop camera/microphone tracks just before connecting Live API'
);

assert(
  source.includes('await videoRef.current.play()'),
  'AI video consultation must actively start the local video element before streaming frames'
);

for (const hardcodedCopy of [
  'Payment completed',
  'Press the button below to activate microphone access and start the consultation.',
  'Enter room',
  'Could not access the microphone. Please check browser permissions.',
  'API Key Error. Please re-select your key.'
]) {
  assert(
    !source.includes(hardcodedCopy),
    `AI video consultation start UI must not use hardcoded English copy: ${hardcodedCopy}`
  );
}

for (const translationKey of [
  'payment.completedTitle',
  'payment.completedDesc',
  'payment.enterRoom',
  'room.mediaAccessError',
  'room.liveConfigError'
]) {
  assert(
    source.includes(`t('ai_consultation.${translationKey}')`) ||
      source.includes(`t.ai_consultation.${translationKey.split('.').join('.')}`),
    `AI video consultation start UI must use localized key: ai_consultation.${translationKey}`
  );
}

assert(
  source.includes('isLiveConfigurationError'),
  'AI video consultation must distinguish Live configuration errors from camera/microphone permission errors'
);

assert(
  source.includes('sendVideoFrame();'),
  'AI video consultation must send the first video frame immediately instead of waiting for the interval'
);

assert(
  source.indexOf("sendRealtimeInput({ text: cleaned })") < source.indexOf('sendClientContent({'),
  'AI video consultation must prefer realtime text input for current Gemini Live sessions before falling back to sendClientContent'
);

assert(
  source.includes('if (!isMicOnRef.current)'),
  'AI video consultation mic meter and streaming must use ref state so toggles do not create stale mute behavior'
);

assert(
  !source.includes('model: "gemini-2.5-flash-native-audio-preview-12-2025"'),
  'AI video consultation must not hardcode the old Live model string'
);

console.log('AI video consultation startup contract passed');
