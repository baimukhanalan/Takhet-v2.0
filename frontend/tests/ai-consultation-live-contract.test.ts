import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const source = readFileSync(resolve(process.cwd(), 'src/pages/AIConsultationRoom.tsx'), 'utf8');
const vercelConfig = readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8');

for (const marker of ['\u0420\u2019', '\u0420\u045f', '\u0421\u0403', '\u0432\u0402', '\u0432\u201a\u0451', '\ufffd\ufffd\ufffd\ufffd']) {
  assert(!source.includes(marker), `AI consultation room must not contain mojibake marker: ${marker}`);
}

assert(source.includes('LIVE_AI_BEHAVIOR_INSTRUCTION'), 'AI consultation must keep a live behavior instruction');
assert(source.includes('LIVE_BASE_SYSTEM_INSTRUCTION'), 'AI consultation must use a Live-specific base prompt');
assert(source.includes('sendLiveTextTurn('), 'AI consultation text messages must be sent as explicit live turns');
assert(source.includes('turnComplete: true'), 'AI consultation live text turns must be marked complete');
assert(source.includes("audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }"), 'AI consultation must send microphone PCM as Gemini Live audio input');
assert(source.includes("video: { data: frame, mimeType: 'image/jpeg' }"), 'AI consultation must send camera frames as Gemini Live video input');
assert(source.includes('const LIVE_VIDEO_FRAME_INTERVAL_MS = 1000'), 'AI consultation must stream video at the Gemini Live supported 1 FPS cadence');
assert(source.includes('const LIVE_AUDIO_PROCESSOR_BUFFER_SIZE = 512'), 'AI consultation must use lower-latency audio chunks');
assert(source.includes('const LIVE_BARGE_IN_RMS_THRESHOLD = 0.025'), 'AI consultation must interrupt assistant speech on clear user speech');
assert(source.includes('stopAssistantAudioForUserSpeech'), 'AI consultation must stop assistant audio when the user starts speaking');
assert(source.includes('lastUserSpeechInterruptAtRef'), 'AI consultation local interruption must be debounced');
assert(!source.includes('t.ai_consultation.room.systemInstruction,\n        LIVE_AI_BEHAVIOR_INSTRUCTION'), 'AI consultation must not mix old generic prompt with Live behavior prompt');
assert(source.includes('thinkingLevel: ThinkingLevel.LOW'), 'AI consultation Live API should use low thinking latency');

assert(
  vercelConfig.includes('wss://generativelanguage.googleapis.com') &&
    vercelConfig.includes('wss://*.googleapis.com'),
  'AI consultation production CSP must allow Gemini Live WebSocket connections'
);

console.log('AI consultation live audio/video contract passed');
