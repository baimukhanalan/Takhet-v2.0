import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const controller = read('src/ai/ai.controller.ts');
const service = read('src/ai/ai.service.ts');
const main = read('src/main.ts');

for (const route of [
  'public-health-insights',
  'public-chat',
  'public-chat-stream',
  'public-speech',
  'public-analyze',
  'public-transcribe'
]) {
  assert(controller.includes(`@Post('${route}')`), `backend must expose the rate-limited ${route} route`);
}

assert(controller.includes('@Throttle({ default:'), 'public AI endpoints must use explicit throttling');
assert(service.includes('transcribeAudio(audio: string, mimeType: string)'), 'backend must provide voice transcription');
assert(service.includes(".find((part) => Boolean(part.inlineData?.data))"), 'TTS must find audio beyond the first response part');
assert(service.includes('data:audio/wav;base64'), 'raw PCM TTS output must be wrapped as playable WAV');
assert(service.includes('isRetryableModelError'), 'AI model failover must handle transient and unavailable models');
assert(main.includes("express.json({ limit: '8mb' })"), 'backend must accept bounded image and audio AI payloads');

console.log('Backend AI production routing contract passed');
