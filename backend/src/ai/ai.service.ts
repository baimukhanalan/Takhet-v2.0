import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.config';

@Injectable()
export class AiService {
  private readonly genAI = new GoogleGenerativeAI(env.geminiApiKey);

  async analyzeSymptoms(text: string) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = [
      'You are a medical triage assistant. You are not a doctor and you do not provide final diagnosis.',
      'Return compact JSON: {"riskLevel":"low|medium|high","urgency":"self-care|doctor_24h|urgent","nextAction":"...","possibleConditions":["..."]}.',
      `Symptoms: ${text}`
    ].join('\n');

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    return {
      raw,
      riskLevel: this.extractRisk(raw)
    };
  }

  private extractRisk(text: string) {
    const lower = text.toLowerCase();
    if (lower.includes('high')) return 'high';
    if (lower.includes('medium')) return 'medium';
    return 'low';
  }
}
