
import { NormalizedData, DigitalTwinState, DecisionRoute, SwarmCase } from '../types';

export const normalizeInput = async (type: string, rawValue: any): Promise<NormalizedData> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  let standardized = rawValue.toString();
  let confidence = 0.98;
  return {
    originalValue: rawValue,
    normalizedValue: standardized,
    units: standardized.split(' ')[1] || 'unit',
    confidenceScore: confidence,
    noiseLevel: 'low'
  };
};

export const calculateDecisionRoute = (type: string, aiData: any): DecisionRoute => {
  const riskValue = aiData.riskLevel === 'High' ? 0.85 : aiData.riskLevel === 'Medium' ? 0.42 : 0.12;
  const redFlags: string[] = [];
  
  if (riskValue > 0.8) redFlags.push("Критический уровень риска");
  if (aiData.detectedAnomalies?.length > 3) redFlags.push("Множественные отклонения");
  
  let specialist = "Терапевт";
  let timeframe = "48 часов";
  let urgency: DecisionRoute['urgency'] = 'Low';

  if (type.includes('Photo')) {
    specialist = "Дерматолог";
    if (riskValue > 0.6) {
      urgency = 'High';
      timeframe = '24 часа';
    }
  }

  return {
    riskScore: riskValue,
    urgency,
    timeframe,
    specialist,
    reason: aiData.nextSteps || "Требуется осмотр",
    redFlags
  };
};

// Added calculateWhatIfEffect to simulate life-style changes impact on health twin
export const calculateWhatIfEffect = (twin: DigitalTwinState, changes: Partial<DigitalTwinState>) => {
  let score = twin.overallScore;
  let bioAge = twin.bioAge;

  // Simple heuristics for lifestyle improvements
  if (changes.smoking === 0 && twin.smoking > 0) {
    score += 5;
    bioAge -= 2;
  }
  if (changes.weight !== undefined && changes.weight < twin.weight) {
    score += 3;
    bioAge -= 1;
  }
  if (changes.sleepHours !== undefined && changes.sleepHours > twin.sleepHours) {
    score += 2;
    bioAge -= 0.5;
  }

  return {
    score: Math.min(100, score),
    bioAge: Math.max(twin.age - 5, bioAge)
  };
};

export const checkSwarmEligibility = (route: DecisionRoute): boolean => {
  return route.riskScore > 0.65 || route.redFlags.length > 1;
};

export const generateMockSwarmConsensus = (specialty: string): SwarmCase => {
  return {
    id: 'swarm_' + Math.random().toString(36).substr(2, 9),
    originalRecordId: '',
    specialtyRequired: specialty,
    consensusScore: 82,
    status: 'Open',
    opinions: [
      { doctorId: 'doc_2', hypothesis: 'Атипичное течение', argument: 'Наблюдал похожий кейс в 2023. Требуется биопсия.', confidence: 0.9 },
      { doctorId: 'doc_3', hypothesis: 'Контактный дерматит', argument: 'Симптоматика соответствует аллергической реакции.', confidence: 0.75 },
      { doctorId: 'doc_4', hypothesis: 'Вторичная инфекция', argument: 'Вижу признаки бактериального процесса.', confidence: 0.85 }
    ]
  };
};