import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const source = readFileSync(resolve(process.cwd(), 'src/pages/AIConsultationRoom.tsx'), 'utf8');

for (const marker of ['Р’', 'Рџ', 'СЃ', 'вЂ', 'в‚ё', '����']) {
  assert(!source.includes(marker), `AI consultation room must not contain mojibake marker: ${marker}`);
}

assert(source.includes('LIVE_AI_BEHAVIOR_INSTRUCTION'), 'AI consultation must keep a live behavior instruction');
assert(source.includes('sendLiveTextTurn('), 'AI consultation text messages must be sent as explicit live turns');
assert(source.includes('turnComplete: true'), 'AI consultation live text turns must be marked complete');
assert(source.includes("audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }"), 'AI consultation must send microphone PCM as Gemini Live audio input');
assert(source.includes("video: { data: frame, mimeType: 'image/jpeg' }"), 'AI consultation must send camera frames as Gemini Live video input');
assert(source.includes('const LIVE_VIDEO_FRAME_INTERVAL_MS = 2500'), 'AI consultation must stream video often enough for visual context');
assert(source.includes('thinkingLevel: ThinkingLevel.LOW'), 'AI consultation Live API should use low thinking latency');

console.log('AI consultation live audio/video contract passed');
