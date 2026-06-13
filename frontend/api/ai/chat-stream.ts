import {
  buildHelpfulFallback,
  buildStrictChatInstruction,
  cleanAiText,
  ensureAi,
  getModelCandidatesForTask,
  isFreshDataLike,
  isQuotaError
} from './_shared.js';

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

const streamText = async (res: any, text: string) => {
  const words = cleanAiText(text).split(/(\s+)/).filter(Boolean);
  let emitted = '';

  for (const part of words) {
    emitted += part;
    res.write(part);
    await new Promise((resolve) => setTimeout(resolve, /\s+/.test(part) ? 1 : 5));
  }

  return emitted;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const { message, systemInstruction, useSearch } = req.body || {};
  if (!message) {
    res.status(400).setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify({ error: 'Message is required' }));
    return;
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const activeQuestion = extractActiveQuestion(message);

    const ai = ensureAi();
    const strictInstruction = buildStrictChatInstruction(activeQuestion, systemInstruction);
    const modelCandidates = getModelCandidatesForTask('chat', `${systemInstruction || ''}\n${activeQuestion}`);
    let streamed = false;
    let lastError: unknown = null;

    for (const model of modelCandidates) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: message,
          config: {
            systemInstruction: strictInstruction,
            tools: useSearch || isFreshDataLike(activeQuestion) ? [{ googleSearch: {} }] : undefined,
            temperature: 0.15,
            topP: 0.9,
            candidateCount: 1,
            maxOutputTokens: 1400
          }
        });

        for await (const chunk of stream) {
          const text = String(chunk.text || '');
          if (text) {
            streamed = true;
            res.write(text);
          }
        }
        break;
      } catch (error) {
        lastError = error;
        console.error(`AI chat stream failed on ${model}:`, error);
        if (streamed || !isQuotaError(error)) break;
      }
    }

    if (!streamed && lastError) {
      throw lastError;
    }

    if (!streamed) {
      await streamText(res, buildHelpfulFallback(activeQuestion));
    }
  } catch (error) {
    console.error('AI chat stream fallback:', error);
    await streamText(res, buildHelpfulFallback(extractActiveQuestion(message)));
  } finally {
    res.end();
  }
}
