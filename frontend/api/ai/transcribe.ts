import { ensureAi, FAST_MODEL } from './_shared.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const { audio, mimeType } = req.body || {};
  if (!audio || !mimeType) {
    res.status(400).setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ error: 'Audio is required' }));
    return;
  }

  try {
    const ai = ensureAi();
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: [
        {
          parts: [
            { inlineData: { data: audio, mimeType } },
            { text: 'Transcribe this Russian/Kazakh medical voice input. Return only the spoken text, no comments.' }
          ]
        }
      ]
    });

    res.status(200).setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ text: (response.text || '').trim() }));
  } catch (error) {
    res.status(500).setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ error: error instanceof Error ? error.message : 'TRANSCRIBE_FAILED' }));
  }
}
