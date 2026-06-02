import { cleanAiText, ensureAi, FAST_MODEL, handleAiError, Modality, sendJson } from './_shared.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const { text } = req.body || {};
  if (!text) {
    sendJson(res, 400, { error: 'Text is required' });
    return;
  }

  try {
    const ai = ensureAi();
    const response = await ai.models.generateContent({
      model: `${FAST_MODEL}-preview-tts`,
      contents: [{ parts: [{ text: cleanAiText(text) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    const audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    sendJson(res, 200, { audio: audio ? `data:audio/mp3;base64,${audio}` : null });
  } catch (error) {
    handleAiError(res, error);
  }
}
