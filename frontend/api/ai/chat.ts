import {
  buildHelpfulFallback,
  buildStrictChatInstruction,
  cleanAiText,
  ensureAi,
  getModelCandidatesForTask,
  isFreshDataLike,
  isLowValueAiText,
  isQuotaError,
  sendJson
} from './_shared.js';

const CHAT_CACHE_TTL_MS = 2 * 60 * 1000;
const chatCache = new Map<string, { expiresAt: number; text: string }>();
const inFlightChats = new Map<string, Promise<string>>();

const extractActiveQuestion = (message: string) => {
  const raw = String(message || '').trim();
  const markers = ['Новый вопрос пациента:', 'New patient question:', 'User query:', 'General user query:', 'Medical user query:'];

  for (const marker of markers) {
    const index = raw.lastIndexOf(marker);
    if (index >= 0) {
      return raw
        .slice(index + marker.length)
        .split(/\n\s*\n/)[0]
        .trim()
        .slice(0, 220);
    }
  }

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const lastLine = lines[lines.length - 1] || raw;
  return lastLine.includes(':') ? lastLine.split(':').slice(1).join(':').trim().slice(0, 220) : lastLine.slice(0, 220);
};

const normalizeChatKey = (message: string, systemInstruction?: string, useSearch?: boolean) =>
  JSON.stringify({
    message: String(message || '').trim(),
    systemInstruction: String(systemInstruction || '').trim(),
    useSearch: Boolean(useSearch)
  });

const getCachedChat = (key: string) => {
  const cached = chatCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    chatCache.delete(key);
    return null;
  }
  return cached.text;
};

const setCachedChat = (key: string, text: string) => {
  chatCache.set(key, { expiresAt: Date.now() + CHAT_CACHE_TTL_MS, text });
};

async function generateChatText(message: string, systemInstruction?: string, useSearch?: boolean) {
  const activeQuestion = extractActiveQuestion(message);

  const ai = ensureAi();
  const strictInstruction = buildStrictChatInstruction(activeQuestion, systemInstruction);
  const modelCandidates = getModelCandidatesForTask('chat', `${systemInstruction || ''}\n${activeQuestion}`);
  let text = '';
  let lastError: unknown = null;

  for (const model of modelCandidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: message,
        config: {
          systemInstruction: strictInstruction,
          tools: useSearch || isFreshDataLike(activeQuestion) ? [{ googleSearch: {} }] : undefined,
          temperature: 0.15,
          topP: 0.9,
          candidateCount: 1,
          maxOutputTokens: 700
        }
      });
      text = cleanAiText(response.text || buildHelpfulFallback(activeQuestion));
      break;
    } catch (error) {
      lastError = error;
      console.error(`AI chat failed on ${model}:`, error);
      if (!isQuotaError(error)) break;
    }
  }

  if (!text && lastError) {
    throw lastError;
  }

  if (isLowValueAiText(text)) {
    for (const model of getModelCandidatesForTask('chat', `${activeQuestion}\n${text}`)) {
      try {
        const refined = await ai.models.generateContent({
          model,
          contents: [
            `User question:\n${activeQuestion}`,
            '',
            `Weak answer to fix:\n${text}`,
            '',
            'Rewrite the answer in Russian. Give the direct answer first, then concrete facts or steps, risks and next action. Remove water, meta-instructions, placeholders and any request to choose a format.'
          ].join('\n'),
          config: {
            systemInstruction: strictInstruction,
            tools: useSearch || isFreshDataLike(activeQuestion) ? [{ googleSearch: {} }] : undefined,
            temperature: 0.1,
            topP: 0.9,
            candidateCount: 1,
            maxOutputTokens: 650
          }
        });
        text = cleanAiText(refined.text || text);
        break;
      } catch (error) {
        console.error(`AI chat refine failed on ${model}:`, error);
        if (!isQuotaError(error)) break;
      }
    }
  }

  if (!text || isLowValueAiText(text)) {
    return buildHelpfulFallback(activeQuestion);
  }

  return text;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const { message, systemInstruction, useSearch } = req.body || {};
  if (!message) {
    sendJson(res, 400, { error: 'Message is required' });
    return;
  }

  const activeQuestion = extractActiveQuestion(message);
  const cacheKey = normalizeChatKey(activeQuestion, systemInstruction, useSearch);

  try {
    const cached = getCachedChat(cacheKey);
    if (cached) {
      sendJson(res, 200, { text: cached });
      return;
    }

    const existing = inFlightChats.get(cacheKey);
    if (existing) {
      sendJson(res, 200, { text: await existing });
      return;
    }

    const task = generateChatText(message, systemInstruction, useSearch);
    inFlightChats.set(cacheKey, task);
    const text = await task;
    setCachedChat(cacheKey, text);
    sendJson(res, 200, { text });
  } catch (error) {
    console.error('AI chat fallback:', error);
    sendJson(res, 200, { text: buildHelpfulFallback(activeQuestion) });
  } finally {
    inFlightChats.delete(cacheKey);
  }
}
