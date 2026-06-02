import { evaluateEnterpriseRisk } from '../src/enterprise/enterprise-risk.engine';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const baseline = {
  sleepHours: 7,
  fatigueLevel: 2,
  dizziness: false,
  headache: false,
  nausea: false,
  painLevel: 1,
  stressLevel: 2,
  medications: '',
  temperature: 36.6,
  systolic: 120,
  diastolic: 78,
  symptomsToday: '',
  fitToWork: true
};

const green = evaluateEnterpriseRisk(baseline);
assert(green.status === 'green', 'Healthy baseline must be green');
assert(green.label === 'No significant risks detected', 'Green label must not imply work approval');

const yellow = evaluateEnterpriseRisk({
  ...baseline,
  sleepHours: 4,
  fatigueLevel: 7,
  stressLevel: 8
});
assert(yellow.status === 'yellow', 'Fatigue and poor sleep must route to yellow review');
assert(yellow.reasons.some((reason) => /fatigue|sleep|stress/i.test(reason)), 'Yellow status must explain fatigue/sleep/stress reasons');

const red = evaluateEnterpriseRisk({
  ...baseline,
  fatigueLevel: 9,
  dizziness: true,
  fitToWork: false
});
assert(red.status === 'red', 'High fatigue with dizziness and not-fit self report must be red');
assert(red.label === 'Immediate review recommended', 'Red label must request review, not clearance');

const combinedText = [green.label, yellow.label, red.label, ...red.reasons].join(' ').toLowerCase();
assert(!combinedText.includes('approved for work'), 'Risk engine must never say approved for work');
assert(!combinedText.includes('medical clearance'), 'Risk engine must never claim medical clearance');

console.log('Enterprise risk engine tests passed');
