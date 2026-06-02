import { ensureAi, getModelCandidatesForTask, handleAiError, isQuotaError, schemas, sendJson } from './_shared.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const { type, data } = req.body || {};
  if (!type || !data) {
    sendJson(res, 400, { error: 'Type and data are required' });
    return;
  }

  try {
    const ai = ensureAi();
    const modelCandidates = getModelCandidatesForTask('analysis', `${type}\n${String(data).slice(0, 2000)}`);
    let response: any = null;
    let lastError: unknown = null;

    for (const model of modelCandidates) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: `Type: ${type}\nData: ${data}`,
          config: {
            systemInstruction:
              [
                'Reply in Russian. Analyze the uploaded medical data as a practical medical orientation, not a final diagnosis.',
                'Be concrete: summarize the key abnormal/important points, explain what they may mean, give next steps, red flags and which doctor/specialist is relevant.',
                'Do not output generic phrases like "consult a doctor" without saying why, when and which specialist.',
                'No markdown asterisks. No filler. If data is incomplete or unreadable, say exactly what is missing and what to upload next.'
              ].join('\n'),
            responseMimeType: 'application/json',
            responseSchema: schemas.healthData
          }
        });
        break;
      } catch (error) {
        lastError = error;
        console.error(`AI analysis failed on ${model}:`, error);
        if (!isQuotaError(error)) break;
      }
    }

    if (!response) {
      throw lastError || new Error('AI_ANALYSIS_EMPTY_RESPONSE');
    }

    sendJson(res, 200, JSON.parse(response.text || '{}'));
  } catch (error) {
    handleAiError(res, error);
  }
}
