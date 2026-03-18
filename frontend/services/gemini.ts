import { api } from './api';

interface TriageResponse {
  aiResult?: {
    raw?: string;
    riskLevel?: string;
  };
}

export const analyzeHealthData = async (type: string, data: string, _imageBase64?: string, _lang: string = 'ru') => {
  try {
    const triage = await api<TriageResponse>('/triage', {
      method: 'POST',
      body: JSON.stringify({ symptoms: `${type}: ${data}` })
    });

    const parsedText = triage.aiResult?.raw || 'AI response unavailable';

    return {
      summary: parsedText,
      riskLevel: triage.aiResult?.riskLevel || 'medium',
      probabilities: [],
      detectedAnomalies: [],
      recommendations: ['Записаться на консультацию врача для подтверждения рекомендаций ИИ.'],
      nextSteps: 'Создайте консультационный кейс и оплатите приём через Kaspi Pay.'
    };
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return null;
  }
};
