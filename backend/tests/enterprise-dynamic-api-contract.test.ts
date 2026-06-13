import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const controller = read('src/enterprise/enterprise.controller.ts');
const service = read('src/enterprise/enterprise.service.ts');
const riskEngine = read('src/enterprise/enterprise-risk.engine.ts');

for (const role of ['employee', 'employer_admin', 'doctor', 'psychologist', 'takhet_admin', 'clinical_supervisor']) {
  assert(service.includes(`'${role}'`), `EnterpriseRole must include ${role}`);
}

for (const route of [
  "@Post('leads')",
  "@Post('auth/login')",
  "@Post('auth/register')",
  "@Get('employee/dashboard')",
  "@Get('employee/benefits')",
  "@Post('employee/consultation-requests')",
  "@Get('employer/dashboard')",
  "@Get('employer/trends')",
  "@Get('provider/queue')",
  "@Post('provider/notes')",
  "@Get('takhet-admin/companies')",
  "@Get('supervisor/quality-review')",
  "@Post('employee/risk-precheck')"
]) {
  assert(controller.includes(route), `Enterprise controller must expose ${route}`);
}

for (const table of [
  'enterprise_leads',
  'company_plans',
  'employee_benefits',
  'benefit_usage',
  'doctor_verifications',
  'doctor_training',
  'doctor_tariffs',
  'enterprise_consultations',
  'consultation_notes',
  'ai_sessions',
  'mental_checkins',
  'risk_scores',
  'aggregate_reports',
  'billing_invoices',
  'enterprise_payments',
  'payouts',
  'plan_limits',
  'pricing_rules',
  'consent_records',
  'escalation_events'
]) {
  assert(service.includes(table), `Enterprise schema must include ${table}`);
}

assert(service.includes('MIN_AGGREGATE_GROUP_SIZE = 10'), 'Employer analytics must enforce minimum aggregate group size');
assert(service.includes('insufficient_group_size'), 'Employer analytics must return insufficient_group_size below threshold');
assert(service.includes('assertRole(user, [\'employer_admin\'])'), 'Employer endpoints must be restricted to employer_admin');
assert(service.includes('assertRole(user, [\'takhet_admin\'])'), 'Admin endpoints must be restricted to takhet_admin');
assert(service.includes('assertProviderRole'), 'Provider endpoints must support doctor and psychologist roles');
assert(service.includes('calculateConsultationAccess'), 'Employee booking must check credits, triage, co-pay and surcharge rules');
assert(service.includes('hideInternalTariff'), 'Employee-facing provider/service responses must hide internal tariffs');
assert(service.includes('payerPolicy'), 'Benefits logic must support company, employee and split payer policy');
assert(service.includes('triageRequired'), 'Specialist access must support triage-required routing');
assert(service.includes('enterprise.registration.requested'), 'Enterprise auth/register actions must be audit logged');
assert(service.includes('enterprise.lead.created'), 'B2B lead form must be audit logged');
assert(riskEngine.includes('No significant risks detected'), 'Old pre-check engine must remain available internally');

const forbidden = [
  'approved for work',
  'medical clearance',
  'cleared for work',
  'employer sees employee medical data',
  'diagnosis from AI'
];

for (const value of forbidden) {
  assert(!service.toLowerCase().includes(value), `Enterprise backend must not expose forbidden phrase: ${value}`);
}

for (const marker of ['\u0420\u2019', '\u0420\u045f', 'Р›', '\u0421\u0403', '\u0432\u0402']) {
  assert(!service.includes(marker), `Enterprise service must not contain mojibake marker: ${marker}`);
  assert(!controller.includes(marker), `Enterprise controller must not contain mojibake marker: ${marker}`);
}

console.log('Enterprise B2B backend API contract tests passed');
