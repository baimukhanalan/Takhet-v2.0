import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const source = readFileSync(resolve(process.cwd(), 'src/pages/AIConsultationRoom.tsx'), 'utf8');

assert(
  source.includes('import.meta.env.VITE_GEMINI_API_KEY'),
  'AI video consultation must read Gemini key from Vite public env in browser builds'
);

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

assert(
  source.includes('sendVideoFrame();'),
  'AI video consultation must send the first video frame immediately instead of waiting for the interval'
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
