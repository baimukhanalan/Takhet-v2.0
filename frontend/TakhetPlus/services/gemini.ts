
import { GoogleGenAI, Type } from "@google/genai";

export const analyzeHealthData = async (type: string, data: string, imageBase64?: string, lang: string = 'ru') => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const languageNames: { [key: string]: string } = {
      'ru': 'Russian',
      'kz': 'Kazakh',
      'en': 'English'
    };

    const isPhoto = type.toLowerCase().includes('photo') || type.toLowerCase().includes('symptom');

    const contents: any[] = [
      {
        text: `You are a professional medical AI assistant for Takhet+. 
        IMPORTANT: YOUR ENTIRE JSON OUTPUT MUST BE STRICTLY IN ${languageNames[lang] || 'Russian'}. 
        
        Analyze the following ${type} data. 
        ${isPhoto ? `This is a visual diagnostic. Extract signs, compare with datasets, and provide PROBABILITIES for potential conditions (e.g., "Dermatitis: 70%").` : `If it's a lab test, extract values and compare with norms.`}
        
        Provide a concise summary, risk level, and recommendations.
        Context: ${data}`
      }
    ];

    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64.split(',')[1]
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: contents },
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            riskLevel: { type: Type.STRING, description: 'Low, Medium, or High' },
            probabilities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.NUMBER, description: 'Percentage from 0 to 100' }
                },
                required: ['label', 'value']
              }
            },
            detectedAnomalies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
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
