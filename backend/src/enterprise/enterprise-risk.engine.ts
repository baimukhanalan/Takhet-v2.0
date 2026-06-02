export type EnterpriseRiskStatus = 'green' | 'yellow' | 'red';

export type EnterpriseCheckInput = {
  sleepHours?: number;
  fatigueLevel?: number;
  dizziness?: boolean;
  headache?: boolean;
  nausea?: boolean;
  painLevel?: number;
  stressLevel?: number;
  medications?: string;
  temperature?: number;
  systolic?: number;
  diastolic?: number;
  symptomsToday?: string;
  fitToWork?: boolean;
};

export type EnterpriseRiskResult = {
  status: EnterpriseRiskStatus;
  label: 'No significant risks detected' | 'Additional review recommended' | 'Immediate review recommended';
  reasons: string[];
  score: number;
  completionPercent: number;
  recommendation: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const hasText = (value?: string) => Boolean(value && value.trim().length > 0);

export const evaluateEnterpriseRisk = (input: EnterpriseCheckInput): EnterpriseRiskResult => {
  const reasons: string[] = [];
  let score = 0;
  let red = false;

  const sleepHours = Number(input.sleepHours ?? 0);
  const fatigueLevel = Number(input.fatigueLevel ?? 0);
  const painLevel = Number(input.painLevel ?? 0);
  const stressLevel = Number(input.stressLevel ?? 0);
  const temperature = Number(input.temperature ?? 0);
  const systolic = Number(input.systolic ?? 0);
  const diastolic = Number(input.diastolic ?? 0);

  if (sleepHours > 0 && sleepHours < 5) {
    score += 2;
    reasons.push('Short sleep duration detected');
  }

  if (fatigueLevel >= 8) {
    score += 3;
    reasons.push('High fatigue level detected');
  } else if (fatigueLevel >= 6) {
    score += 2;
    reasons.push('Elevated fatigue level detected');
  }

  if (input.dizziness) {
    score += 3;
    reasons.push('Dizziness reported');
  }

  if (input.headache) {
    score += 1;
    reasons.push('Headache reported');
  }

  if (input.nausea) {
    score += 2;
    reasons.push('Nausea reported');
  }

  if (painLevel >= 7) {
    score += 3;
    reasons.push('High pain level reported');
  } else if (painLevel >= 4) {
    score += 1;
    reasons.push('Pain reported');
  }

  if (stressLevel >= 8) {
    score += 2;
    reasons.push('High stress level detected');
  } else if (stressLevel >= 6) {
    score += 1;
    reasons.push('Elevated stress level detected');
  }

  if (hasText(input.medications)) {
    score += 1;
    reasons.push('Medication intake reported');
  }

  if (temperature >= 38) {
    red = true;
    score += 5;
    reasons.push('High temperature reported');
  } else if (temperature >= 37.3) {
    score += 2;
    reasons.push('Elevated temperature reported');
  }

  if (systolic >= 180 || diastolic >= 120) {
    red = true;
    score += 5;
    reasons.push('Critical blood pressure range reported');
  } else if (systolic >= 140 || diastolic >= 90) {
    score += 2;
    reasons.push('Elevated blood pressure reported');
  }

  if (hasText(input.symptomsToday)) {
    score += 1;
    reasons.push('Symptoms reported today');
  }

  if (input.fitToWork === false) {
    red = true;
    score += 5;
    reasons.push('Worker requested additional review');
  }

  if (input.dizziness && fatigueLevel >= 8) {
    red = true;
    reasons.push('High fatigue + dizziness detected');
  }

  const answered = [
    input.sleepHours,
    input.fatigueLevel,
    input.dizziness,
    input.headache,
    input.nausea,
    input.painLevel,
    input.stressLevel,
    input.medications,
    input.temperature,
    input.systolic || input.diastolic,
    input.symptomsToday,
    input.fitToWork
  ].filter((value) => value !== undefined && value !== null && value !== '').length;

  const completionPercent = clamp(Math.round((answered / 12) * 100), 0, 100);

  if (red || score >= 8) {
    return {
      status: 'red',
      label: 'Immediate review recommended',
      reasons: reasons.length ? reasons : ['Risk threshold reached'],
      score,
      completionPercent,
      recommendation: 'Route this worker to authorized enterprise medical or safety review before any high-risk task decision.'
    };
  }

  if (score >= 3) {
    return {
      status: 'yellow',
      label: 'Additional review recommended',
      reasons: reasons.length ? reasons : ['Additional context recommended'],
      score,
      completionPercent,
      recommendation: 'Request additional review according to enterprise safety procedures.'
    };
  }

  return {
    status: 'green',
    label: 'No significant risks detected',
    reasons: reasons.length ? reasons : ['No major risk signals reported in this pre-check'],
    score,
    completionPercent,
    recommendation: 'Continue standard enterprise safety procedure. This is not a medical clearance decision.'
  };
};
