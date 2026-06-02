import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const appModule = read('src/app.module.ts');
const controller = read('src/labs/labs.controller.ts');
const service = read('src/labs/labs.service.ts');

assert(appModule.includes('LabsModule'), 'AppModule must register LabsModule');

for (const route of [
  "@Get('memberships')",
  "@Post('memberships/subscribe')",
  "@Get('dashboard')",
  "@Get('biomarkers')",
  "@Get('health-systems')",
  "@Get('issues')",
  "@Get('insights')",
  "@Get('protocol')",
  "@Get('family')",
  "@Get('reports')",
  "@Post('lab-results')",
  "@Post('reports/generate')",
  "@Post('family')",
  "@Get('physician/review-queue')",
  "@Get('admin/overview')",
  "@Post('physician-reviews')",
  "@Post('auth/login')",
  "@Get('auth/session')",
  "@Post('auth/logout')",
  "@Get('portal/dashboard')"
]) {
  assert(controller.includes(route), `Labs controller must expose ${route}`);
}

for (const table of [
  'labs_memberships',
  'labs_biomarkers',
  'labs_lab_results',
  'labs_biomarker_history',
  'labs_health_scores',
  'labs_protocols',
  'labs_supplements',
  'labs_monitored_issues',
  'labs_physician_reviews',
  'labs_family_profiles',
  'labs_notifications',
  'labs_ai_insights',
  'labs_reports',
  'labs_membership_orders',
  'labs_users'
]) {
  assert(service.includes(table), `Labs schema must include ${table}`);
}

for (const capability of [
  'biomarkerInterpretationEngine',
  'riskScoringEngine',
  'correlationEngine',
  'personalizedProtocolGenerator',
  'longitudinalMonitoringEngine',
  'aiHealthConcierge',
  'pdfUploadParsing',
  'ocrExtraction',
  'biomarkerNormalization'
]) {
  assert(service.includes(capability), `Labs service must include ${capability}`);
}

for (const method of [
  'createMembershipOrder',
  'generateReport',
  'addFamilyProfile',
  'physicianReviewQueue',
  'adminOverview',
  'recalculateScoresFromBiomarkers',
  'labsLogin',
  'labsSession',
  'labsLogoutCookie',
  'labsPortalDashboard'
]) {
  assert(service.includes(method), `Labs service must implement ${method}`);
}

for (const role of ['member', 'physician', 'admin', 'family']) {
  assert(service.includes(role), `Labs auth must support role: ${role}`);
}

for (const biomarker of ['CBC', 'CMP', 'ApoB', 'Lipoprotein(a)', 'HbA1c', 'ferritin', 'vitamin D', 'cortisol', 'hsCRP']) {
  assert(service.includes(biomarker), `Labs service must support ${biomarker}`);
}

const forbidden = ['AI diagnosis', 'diagnosis from AI', 'medical clearance', 'replace physicians'];
for (const value of forbidden) {
  assert(!service.includes(value), `Labs backend must not expose forbidden phrase: ${value}`);
}

for (const marker of ['Р’', 'Рџ', 'СЃ', 'вЂ', 'в‚ё', '����']) {
  assert(!service.includes(marker), `Labs service must not contain mojibake marker: ${marker}`);
  assert(!controller.includes(marker), `Labs controller must not contain mojibake marker: ${marker}`);
}

console.log('Takhet Labs backend API contract tests passed');
