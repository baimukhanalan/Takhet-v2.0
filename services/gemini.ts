
import { GoogleGenAI, Type } from "@google/genai";

/* Use direct reference to process.env.API_KEY per SDK guidelines */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeHealthData = async (type: string, data: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional medical AI assistant for Takhet+. 
      Analyze the following ${type} data and provide a concise summary, key takeaways, and potential questions for a doctor.
      Data: ${data}`,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            riskLevel: { type: Type.STRING, description: 'Low, Medium, or High' },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            nextSteps: { type: Type.STRING }
          },
          required: ['summary', 'riskLevel', 'recommendations', 'nextSteps']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
};
