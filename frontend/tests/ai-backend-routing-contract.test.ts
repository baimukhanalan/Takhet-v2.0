import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const gemini = read('src/services/gemini.ts');
const voice = read('src/services/voiceInput.ts');
const coordinator = read('src/components/SiteCoordinator.tsx');

for (const source of [gemini, voice, coordinator]) {
  assert(source.includes("from '../../services/api'"), 'AI clients must use the shared production API origin');
}

for (const route of [
  '/ai/public-health-insights',
  '/ai/public-chat',
  '/ai/public-chat-stream',
  '/ai/public-speech',
  '/ai/public-analyze'
]) {
  assert(gemini.includes(route), `Gemini client must route ${route} through the backend`);
}

assert(voice.includes('/ai/public-transcribe'), 'recorded voice input must use backend transcription');
assert(coordinator.includes('/ai/public-chat-stream'), 'landing coordinator must use backend streaming');
assert(gemini.includes('AI_FIRST_RESPONSE_TIMEOUT_MS = 25000'), 'cold backend starts must not be aborted after only 12 seconds');
assert(gemini.includes("callAiApi<{ text: string }>('/ai/public-chat'"), 'stream failure must retry through regular backend chat before local fallback');
assert(!gemini.includes("fetch('/api/ai/"), 'active Gemini client must not depend on duplicated Vercel AI credentials');
assert(!voice.includes("fetch('/api/ai/"), 'voice input must not depend on duplicated Vercel AI credentials');

console.log('Frontend AI backend routing contract passed');
