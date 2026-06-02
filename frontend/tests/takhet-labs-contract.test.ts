import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const app = read('src/App.tsx');
const publicHeader = read('src/components/PublicHeader.tsx');
const sidebar = read('src/components/Sidebar.tsx');
const labsPage = read('src/pages/TakhetLabsPage.tsx');
const labsApi = read('src/services/takhetLabsApi.ts');
const labsApp = read('src/pages/TakhetLabsApp.tsx');

for (const value of [
  "const TakhetLabsPage = lazy(() => import('./pages/TakhetLabsPage'))",
  "const TakhetLabsApp = lazy(() => import('./pages/TakhetLabsApp'))",
  '<Route path="/takhet-labs"',
  '<Route path="/takhet-labs/login"',
  '<Route path="/takhet-labs/portal/*"',
  '<Route path="/labs"'
]) {
  assert(app.includes(value), `App must include Takhet Labs route wiring: ${value}`);
}

assert(publicHeader.includes("Takhet Labs"), 'Public desktop header and mobile burger menu must include Takhet Labs');
assert(publicHeader.includes("path: '/takhet-labs'"), 'Public Takhet Labs link must point to /takhet-labs');
assert(sidebar.includes("Takhet Labs"), 'Patient dashboard sidebar must include Takhet Labs');
assert(sidebar.includes("to: '/labs'"), 'Patient dashboard Takhet Labs link must point to authenticated /labs module');

for (const copy of [
  'AI-powered health intelligence layer',
  'preventive healthcare system',
  'Final medical decisions belong to licensed physicians',
  'Профилактическая аналитика здоровья',
  'Личный кабинет Takhet Labs',
  'Biological Age',
  'Health Scores',
  'Family Health',
  'Executive Health',
  'CORE',
  'PLUS',
  'EXECUTIVE',
  'CBC',
  'ApoB',
  'Lipoprotein(a)',
  'HbA1c',
  'cortisol',
  'PDF upload parsing',
  'physician review'
]) {
  assert(labsPage.includes(copy), `Takhet Labs page must include: ${copy}`);
}

assert(!labsPage.includes("bg-[#060914]"), 'Takhet Labs must not use the old standalone dark product shell');
assert(labsPage.includes('bg-background'), 'Takhet Labs public landing must follow the light Takhet public shell');
assert(labsPage.includes('max-w-7xl mx-auto'), 'Takhet Labs patient portal must follow the existing portal content width pattern');
assert(labsPage.includes('Войти в Takhet Labs'), 'Takhet Labs landing must include a separate login button');
assert(labsPage.includes('/takhet-labs/login'), 'Takhet Labs login button must point to /takhet-labs/login');

assert(labsApp.includes("const loginRoleOptions: LabsRole[] = ['member', 'physician', 'admin'];"), 'Takhet Labs login must expose only member, physician and admin role options');
assert(!labsApp.includes('(Object.keys(roleConfigs) as LabsRole[]).map'), 'Takhet Labs login must not render every Labs role automatically');
assert(labsApp.includes('md:grid-cols-3'), 'Takhet Labs login role selector must use a three-role grid');

for (const roleLabel of ['Member', 'Physician Reviewer', 'Labs Admin']) {
  assert(labsApp.includes(roleLabel), `Takhet Labs login must expose role tab: ${roleLabel}`);
}

for (const route of ['/takhet-labs/portal/member', '/takhet-labs/portal/physician', '/takhet-labs/portal/admin', '/takhet-labs/portal/family']) {
  assert(labsApp.includes(route), `Takhet Labs role portal route must exist: ${route}`);
}

for (const portalCopy of ['Личный кабинет Takhet Labs', 'Врачебный review', 'Labs Admin', 'Family Health']) {
  assert(labsApp.includes(portalCopy), `Takhet Labs portal must include: ${portalCopy}`);
}

for (const section of [
  'Overview Dashboard',
  'Biomarkers',
  'Health Systems',
  'Monitored Issues',
  'AI Insights',
  'Personalized Protocol',
  'Trends & Analytics',
  'Reports & PDFs'
]) {
  assert(labsPage.includes(section), `Takhet Labs patient module must include ${section}`);
}

for (const endpoint of [
  '/labs/memberships',
  '/labs/memberships/subscribe',
  '/labs/dashboard',
  '/labs/biomarkers',
  '/labs/health-systems',
  '/labs/issues',
  '/labs/insights',
  '/labs/protocol',
  '/labs/family',
  '/labs/reports',
  '/labs/lab-results',
  '/labs/reports/generate',
  '/labs/physician/review-queue',
  '/labs/admin/overview',
  '/labs/auth/login',
  '/labs/auth/session',
  '/labs/auth/logout',
  '/labs/portal/dashboard'
]) {
  assert(labsApi.includes(endpoint), `Takhet Labs API client must expose ${endpoint}`);
}

for (const action of [
  'subscribeMembership',
  'uploadLabResult',
  'generateReport',
  'addFamilyProfile',
  'physicianReviewQueue',
  'adminOverview',
  'handleMembershipOrder',
  'handleManualLabResult',
  'handleGenerateReport',
  'handleAddFamilyProfile',
  'labsLogin',
  'labsSession',
  'labsLogout',
  'labsPortalDashboard'
]) {
  assert(labsApi.includes(action) || labsPage.includes(action) || labsApp.includes(action), `Takhet Labs must include working action: ${action}`);
}

const forbidden = [
  'AI diagnoses diseases',
  'diagnosis from AI',
  'диагноз от AI',
  'Takhet Labs is a laboratory',
  'replace physicians'
];

for (const value of forbidden) {
  assert(!labsPage.includes(value), `Takhet Labs UI must not expose forbidden positioning: ${value}`);
}

for (const marker of ['Р’', 'Рџ', 'СЃ', 'вЂ', 'в‚ё', '����']) {
  assert(!labsPage.includes(marker), `Takhet Labs source must not contain mojibake marker: ${marker}`);
}

console.log('Takhet Labs frontend contract tests passed');
