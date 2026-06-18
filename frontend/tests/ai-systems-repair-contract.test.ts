import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const normalizeNewlines = (source: string) => source.replace(/\r\n/g, '\n');

const chatSource = read('api/ai/chat.ts');
const chatStreamSource = read('api/ai/chat-stream.ts');
const browserSource = read('api/ai/health-insights.ts');
const liveRoomSource = normalizeNewlines(read('src/pages/AIConsultationRoom.tsx'));
const geminiClientSource = read('src/services/gemini.ts');
const mentalPageSource = read('src/pages/MentalPage.tsx');
const coordinatorSource = read('src/components/AIChatOverlay.tsx');
const siteCoordinatorSource = read('src/components/SiteCoordinator.tsx');
const siteCoordinatorApiSource = read('api/site-coordinator.ts');

for (const [name, source] of [
  ['chat', chatSource],
  ['chat-stream', chatStreamSource],
  ['ai-browser', browserSource],
  ['live-consultation', liveRoomSource],
  ['gemini-client', geminiClientSource],
  ['mental-page', mentalPageSource],
  ['coordinator-overlay', coordinatorSource],
  ['site-coordinator', siteCoordinatorSource],
  ['site-coordinator-api', siteCoordinatorApiSource]
] as const) {
  for (const marker of ['\u0420\u2019', '\u0420\u045f', '\u0420\u045c', '\u0420\u040e', '\u0432\u0402', '\u0432\u201a\u0451', '\ufffd\ufffd\ufffd\ufffd']) {
    assert(!source.includes(marker), `${name} must not contain mojibake marker ${marker}`);
  }
}

assert(!chatSource.includes('if (canUseFastPath(activeQuestion'), 'Takhet AI must not bypass Gemini for short user questions');
assert(!chatStreamSource.includes('if (canUseFastPath(activeQuestion'), 'Streaming chat must not bypass Gemini for short user questions');
assert(!browserSource.includes('if (medical && query.trim().length <= 80 && canUseFastMedicalAnswer(query))'), 'AI Browser must not replace short medical answers with local fallback');
assert(!geminiClientSource.includes('нужен прямой ответ по сути без воды'), 'Client fallback must not expose low-value answer-format wording');
assert(!geminiClientSource.includes('Нужный формат ответа'), 'Client fallback must not ask the user for an answer format');
assert(!geminiClientSource.includes('Коротко по запросу'), 'Client fallback must not use template filler');

assert(liveRoomSource.includes('LIVE_AUDIO_PROCESSOR_BUFFER_SIZE = 512'), 'AI consultation should stream smaller audio chunks for lower latency');
assert(liveRoomSource.includes('LIVE_VIDEO_FRAME_INTERVAL_MS = 900'), 'AI consultation should send visual context frequently enough');
assert(liveRoomSource.includes('stopAssistantAudioForUserSpeech'), 'AI consultation must locally stop assistant audio when the user starts talking');
assert(liveRoomSource.includes('lastUserSpeechInterruptAtRef'), 'AI consultation interruption must be debounced');
assert(liveRoomSource.includes('LIVE_BASE_SYSTEM_INSTRUCTION'), 'AI consultation must use a local low-latency Live prompt instead of a generic translated prompt');
assert(/const liveSystemInstruction = \[\n\s+LIVE_BASE_SYSTEM_INSTRUCTION,\n\s+LIVE_AI_BEHAVIOR_INSTRUCTION\n\s+\]\.join\('\\n'\);/.test(liveRoomSource), 'AI consultation Live prompt must combine base and behavior instructions');
assert(!liveRoomSource.includes('t.ai_consultation.room.systemInstruction,\n        LIVE_AI_BEHAVIOR_INSTRUCTION'), 'AI consultation Live prompt must not reintroduce the old talk-over prompt');
assert(!liveRoomSource.includes('systemInstruction: `${t.ai_consultation.room.systemInstruction}'), 'AI consultation advanced/search prompts must not use the old generic prompt');
assert(liveRoomSource.includes('Ask one concise question, then stop and let the patient answer.'), 'AI consultation prompt must prevent the assistant from talking over the patient');
assert(mentalPageSource.includes('do not give generic motivational text'), 'Mental assistant prompt must block generic support filler');
assert(mentalPageSource.includes('Ask at most one short clarifying question'), 'Mental assistant should not interrogate the user with many questions');

assert(coordinatorSource.includes('first give the exact route/action'), 'Coordinator overlay must keep route-first instruction');
assert(siteCoordinatorSource.includes('give the exact route first'), 'Site coordinator must keep route-first instruction');
assert(siteCoordinatorApiSource.includes('route the user to the exact platform action'), 'Coordinator API must use route-first instructions');
assert(siteCoordinatorApiSource.includes('Do not ask the user to choose a format'), 'Coordinator API must prevent vague format requests');
assert(!siteCoordinatorApiSource.includes('../src/content/siteContent'), 'Coordinator API must not import the heavy legacy siteContent bundle');
assert(siteCoordinatorApiSource.includes('Не удалось сформировать ответ.'), 'Coordinator API fallback must be readable UTF-8');
assert(siteCoordinatorApiSource.includes('Самал-3, дом 15'), 'Coordinator API must keep the readable address');
assert(chatStreamSource.includes('Новый вопрос пациента:'), 'Streaming chat must extract the readable Russian patient-question marker');

console.log('AI systems repair contract passed');
