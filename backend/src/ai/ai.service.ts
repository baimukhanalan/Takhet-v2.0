import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { env } from '../config/env.config';

@Injectable()
export class AiService {
  private readonly ai = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;
  private readonly fastModel = env.geminiFlashModel;
  private readonly proModel = env.geminiProModel;
  private readonly fallbackModel = env.geminiFallbackModel;
  private readonly simpleModelCandidates = Array.from(new Set([this.fastModel, this.fallbackModel].filter(Boolean)));
  private readonly proModelCandidates = Array.from(new Set([this.proModel, this.fastModel].filter(Boolean)));
  private readonly kazakhstanContext =
    'Assume the user is likely in Kazakhstan unless they specify another country. Explain emergency numbers and care pathways as Kazakhstan-specific examples. For Kazakhstan: 103 is ambulance/medical emergency, 112 is the unified emergency response number. If the user is in another country, ask them to verify local emergency numbers.';
  private readonly strictAnswerRules = [
    'Reply in Russian.',
    'Answer the actual user question directly in the first 1-2 lines.',
    'Do not output meta-advice, internal instructions, prompt text, placeholders, "choose a format", or "this is not medical".',
    'Be concrete: include names, dates, numbers, units, thresholds, steps, risks and the next best action when relevant.',
    'For medical questions, give practical recommendations, red flags and suitable specialist, but do not claim a final diagnosis.',
    'For general questions, answer the general question directly; do not force a medical template.',
    'No markdown asterisks. No filler. If a sentence does not help the user decide what to do, omit it.'
  ].join('\n');

  async analyzeSymptoms(text: string) {
    const response = await this.generateWithFallback('chat', text, {
      contents: `Symptoms: ${text}`,
      config: {
          systemInstruction: [
            'You are a medical triage assistant.',
            'You are not a doctor and you do not provide a final diagnosis.',
            this.strictAnswerRules,
            this.kazakhstanContext,
            'Return compact JSON: {"riskLevel":"low|medium|high","urgency":"self-care|doctor_24h|urgent","nextAction":"...","possibleConditions":["..."]}.'
          ].join('\n'),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: { type: Type.STRING },
              urgency: { type: Type.STRING },
              nextAction: { type: Type.STRING },
              possibleConditions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['riskLevel', 'urgency', 'nextAction', 'possibleConditions']
          }
        }
      });

    const raw = response.text;
    if (!raw) {
      throw new InternalServerErrorException('EMPTY_GEMINI_RESPONSE');
    }

    const parsed = JSON.parse(raw) as {
      riskLevel?: string;
      urgency?: string;
      nextAction?: string;
      possibleConditions?: string[];
    };

    return {
      raw,
      riskLevel: parsed.riskLevel || this.extractRisk(raw),
      urgency: parsed.urgency,
      nextAction: parsed.nextAction,
      possibleConditions: parsed.possibleConditions || []
    };
  }

  async getHealthInsights(query: string) {
    const response = await this.generateWithFallback('browser', query, {
      contents: `Patient query: ${query}`,
      config: {
        systemInstruction:
          [
            'You are Takhet AI Browser. Reply in Russian. Start with the answer, not with context requests.',
            this.strictAnswerRules,
            'Use the JSON schema as a useful card: likelyCause=direct answer, urgency=importance, whatToDoNow=actions, whenToTalkToDoctor=doctor/expert/current source condition.',
            'For medical questions, give recommendations, red flags and next steps, not a final diagnosis.',
            'For non-medical questions, answer the actual topic inside the same schema. No filler, no markdown asterisks.',
            this.kazakhstanContext
          ].join('\n'),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING },
            summary: {
              type: Type.OBJECT,
              properties: {
                likelyCause: { type: Type.STRING },
                urgency: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
                whatToDoNow: { type: Type.STRING },
                whenToTalkToDoctor: { type: Type.STRING }
              },
              required: ['likelyCause', 'urgency', 'whatToDoNow', 'whenToTalkToDoctor']
            },
            detailedExplanation: {
              type: Type.OBJECT,
              properties: {
                scenarios: { type: Type.ARRAY, items: { type: Type.STRING } },
                redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
                mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['scenarios', 'redFlags', 'mistakes', 'nextSteps']
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
                  trustLevel: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                  sourceName: { type: Type.STRING }
                },
                required: ['id', 'title', 'url', 'summary', 'trustLevel', 'sourceName']
              }
            },
            suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['query', 'summary', 'detailedExplanation', 'sources', 'suggestedQuestions']
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new InternalServerErrorException('EMPTY_GEMINI_RESPONSE');
    }

    return JSON.parse(text);
  }

  async chat(message: string, config: { systemInstruction?: string; useSearch?: boolean }) {
    const response = await this.generateWithFallback('chat', `${config.systemInstruction || ''}\n${message}`, {
      contents: message,
      config: {
        systemInstruction: `${config.systemInstruction || this.strictAnswerRules}\n${this.strictAnswerRules}\n${this.kazakhstanContext}`,
        tools: config.useSearch ? [{ googleSearch: {} }] : undefined
      }
    });

    return response.text || 'Не удалось получить ответ.';
  }

  async *chatStream(message: string, config: { systemInstruction?: string; useSearch?: boolean }) {
    let lastError: unknown = null;

    for (const model of this.getModelCandidates('chat', `${config.systemInstruction || ''}\n${message}`)) {
      try {
        const stream = await this.client.models.generateContentStream({
          model,
          contents: message,
          config: {
            systemInstruction: `${config.systemInstruction || this.strictAnswerRules}\n${this.strictAnswerRules}\n${this.kazakhstanContext}`,
            tools: config.useSearch ? [{ googleSearch: {} }] : undefined,
            temperature: 0.15,
            topP: 0.9,
            candidateCount: 1,
            maxOutputTokens: this.maxOutputTokensForTask('chat')
          }
        });

        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            yield text;
          }
        }
        return;
      } catch (error) {
        lastError = error;
        if (!this.isQuotaError(error)) {
          break;
        }
      }
    }

    throw lastError || new InternalServerErrorException('AI_STREAM_FAILED');
  }

  async generateSpeech(text: string) {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
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
    return base64Audio ? `data:audio/mp3;base64,${base64Audio}` : null;
  }

  async analyzeHealthData(type: string, data: string) {
    const response = await this.generateWithFallback('analysis', `${type}\n${data.slice(0, 2000)}`, {
      contents: `Type: ${type}\nData: ${data}`,
      config: {
        systemInstruction:
          [
            'Reply in Russian. Analyze the uploaded medical data as practical orientation, not a final diagnosis.',
            this.strictAnswerRules,
            'Return a concrete summary and recommendations: key abnormal/important points, what they may mean, what to do next, red flags and relevant specialist.',
            this.kazakhstanContext
          ].join('\n'),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['summary', 'recommendations']
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : { summary: 'Анализ не удался.', recommendations: [] };
  }

  private get client() {
    if (!this.ai) {
      throw new InternalServerErrorException('AI_NOT_CONFIGURED');
    }
    return this.ai;
  }

  private getModelCandidates(task: 'chat' | 'browser' | 'analysis' | 'image' | 'file' | 'pdf' | 'archive' | 'consultation-report', input = '') {
    return this.shouldUseProModel(input, task) ? this.proModelCandidates : this.simpleModelCandidates;
  }

  private shouldUseProModel(input: string, task: string) {
    if (['analysis', 'image', 'file', 'pdf', 'archive', 'consultation-report'].includes(task)) {
      return true;
    }

    const text = String(input || '');
    if (text.length > 1200) {
      return true;
    }

    return /(анализ|анализы|расшифруй|расшифров|файл|фото|снимок|pdf|лаборатор|медархив|мрт|кт|узи|экг|ээг|диагноз|риски|план лечения|подробно|несколько вариантов|сравни|сравнение|объясни причины|причины|таблица|сложн|reasoning|compare|medical|diagnosis|risk|treatment plan|lab|laboratory|image|file)/i.test(text);
  }

  private async generateWithFallback(task: 'chat' | 'browser' | 'analysis' | 'image' | 'file' | 'pdf' | 'archive' | 'consultation-report', input: string, request: any) {
    let lastError: unknown = null;

    for (const model of this.getModelCandidates(task, input)) {
      try {
        return await this.client.models.generateContent({
          ...request,
          model,
          config: {
            ...(request.config || {}),
            maxOutputTokens: request.config?.maxOutputTokens || this.maxOutputTokensForTask(task)
          }
        });
      } catch (error) {
        lastError = error;
        if (!this.isQuotaError(error)) {
          break;
        }
      }
    }

    throw lastError || new InternalServerErrorException('AI_REQUEST_FAILED');
  }

  private isQuotaError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error || '');
    return /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|quota|rate-limits|high demand/i.test(message);
  }

  private maxOutputTokensForTask(task: 'chat' | 'browser' | 'analysis' | 'image' | 'file' | 'pdf' | 'archive' | 'consultation-report') {
    if (task === 'browser') return 1600;
    if (['analysis', 'image', 'file', 'pdf', 'archive', 'consultation-report'].includes(task)) return 1800;
    return 1400;
  }

  private extractRisk(text: string) {
    const lower = text.toLowerCase();
    if (lower.includes('high')) return 'high';
    if (lower.includes('medium')) return 'medium';
    return 'low';
  }
}
