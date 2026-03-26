import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface TrustedSource {
  id: string;
  title: string;
  url: string;
  summary: string;
  trustLevel: 'High' | 'Medium' | 'Low';
  sourceName: string;
}

export interface AISearchResult {
  query: string;
  summary: {
    likelyCause: string;
    urgency: 'Critical' | 'High' | 'Medium' | 'Low';
    whatToDoNow: string;
    whenToTalkToDoctor: string;
  };
  detailedExplanation: {
    scenarios: string[];
    redFlags: string[];
    mistakes: string[];
    nextSteps: string[];
  };
  sources: TrustedSource[];
  suggestedQuestions: string[];
}

export async function getHealthInsights(query: string): Promise<AISearchResult> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `Вы — сверхбыстрый профессиональный медицинский ИИ-браузер Takhet+. Ваша цель — мгновенно предоставлять точную, проверенную и практически применимую информацию о здоровье.
  
  ПРИНЦИПЫ РАБОТЫ:
  1. СКОРОСТЬ: Генерируйте ответ максимально быстро. Используйте лаконичный, но информативный стиль.
  2. КОНТЕКСТ: 
     - Если пациент просто задает вопрос (например, "Что такое диабет?"), дайте глубокое пояснение болезни, причин и современных методов.
     - Если у пациента что-то случилось (например, "Сильно болит живот справа"), СРАЗУ дайте четкий ПУТЬ ЛЕЧЕНИЯ (treatment path), рекомендации по первой помощи и определите уровень срочности.
  3. ИСТОЧНИКИ: Вы ОБЯЗАНЫ предоставить минимум 10 РЕАЛЬНЫХ проверенных медицинских источников (WHO, Mayo Clinic, NHS, CDC, PubMed, Cochrane, Medscape, WebMD, Cleveland Clinic, Johns Hopkins и др.).
  4. ЯЗЫК: Только русский.
  5. ПРЕДУПРЕЖДЕНИЕ: Всегда напоминайте, что это не заменяет очного врача.
  
  Структура JSON:
  {
    "query": "строка",
    "summary": {
      "likelyCause": "строка (пояснение причины относительно контекста: общее или специфическое)",
      "urgency": "Critical" | "High" | "Medium" | "Low",
      "whatToDoNow": "строка (конкретный путь лечения или первые шаги)",
      "whenToTalkToDoctor": "строка (четкие критерии обращения)"
    },
    "detailedExplanation": {
      "scenarios": ["строка (варианты развития)"],
      "redFlags": ["строка (опасные симптомы)"],
      "mistakes": ["строка (чего НЕ делать)"],
      "nextSteps": ["строка (план действий)"]
    },
    "sources": [
      {
        "id": "строка",
        "title": "строка",
        "url": "строка",
        "summary": "строка (суть источника)",
        "trustLevel": "High" | "Medium" | "Low",
        "sourceName": "строка"
      }
    ],
    "suggestedQuestions": ["строка"]
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: `Query: ${query}` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING },
            summary: {
              type: Type.OBJECT,
              properties: {
                likelyCause: { type: Type.STRING },
                urgency: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low"] },
                whatToDoNow: { type: Type.STRING },
                whenToTalkToDoctor: { type: Type.STRING }
              },
              required: ["likelyCause", "urgency", "whatToDoNow", "whenToTalkToDoctor"]
            },
            detailedExplanation: {
              type: Type.OBJECT,
              properties: {
                scenarios: { type: Type.ARRAY, items: { type: Type.STRING } },
                redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
                mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["scenarios", "redFlags", "mistakes", "nextSteps"]
            },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  trustLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  sourceName: { type: Type.STRING }
                },
                required: ["id", "title", "url", "summary", "trustLevel", "sourceName"]
              }
            },
            suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["query", "summary", "detailedExplanation", "sources", "suggestedQuestions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    return JSON.parse(text) as AISearchResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function advancedChat(message: string, config: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: config.systemInstruction,
        tools: config.useSearch ? [{ googleSearch: {} }] : []
      }
    });
    return response.text;
  } catch (error) {
    console.error("Advanced Chat Error:", error);
    return "Извините, произошла ошибка при обработке вашего запроса.";
  }
}

export async function fastChat(message: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: message }] }]
    });
    return response.text;
  } catch (error) {
    console.error("Fast Chat Error:", error);
    return "Извините, произошла ошибка.";
  }
}

export async function generateSpeech(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return `data:audio/mp3;base64,${base64Audio}`;
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
  return null;
}

export async function analyzeHealthData(type: string, data: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: `Type: ${type}\nData: ${data}` }] }],
      config: {
        systemInstruction: "You are a medical data analyst. Analyze the provided data and provide a concise summary and recommendations in Russian.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "recommendations"]
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text) : { summary: "Анализ не удался.", recommendations: [] };
  } catch (error) {
    console.error("Analyze Health Data Error:", error);
    return { summary: "Ошибка при анализе данных.", recommendations: [] };
  }
}
