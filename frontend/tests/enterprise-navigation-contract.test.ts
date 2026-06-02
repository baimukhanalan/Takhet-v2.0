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
const enterprisePage = read('src/pages/EnterpriseApp.tsx');
const enterpriseApi = read('src/services/enterpriseApi.ts');

assert(publicHeader.includes("path: '/enterprise'"), 'Public header must keep Enterprise navigation link');
assert(publicHeader.includes('overflow-y-auto'), 'Mobile/tablet burger menu must remain scrollable');
assert(app.includes('<Route path="/enterprise/login"'), 'Enterprise login must remain a separate route');
assert(app.includes('<Route path="/enterprise/*"'), 'Enterprise namespace route must remain available');

for (const role of ['employee', 'employer_admin', 'doctor', 'psychologist', 'takhet_admin', 'clinical_supervisor']) {
  assert(enterpriseApi.includes(`'${role}'`), `Enterprise API role union must include ${role}`);
}

for (const endpoint of [
  '/enterprise/leads',
  '/enterprise/employee/dashboard',
  '/enterprise/employee/benefits',
  '/enterprise/employee/consultation-requests',
  '/enterprise/employer/dashboard',
  '/enterprise/employer/trends',
  '/enterprise/provider/queue',
  '/enterprise/takhet-admin/companies',
  '/enterprise/supervisor/quality-review',
  '/enterprise/employee/risk-precheck'
]) {
  assert(enterpriseApi.includes(endpoint), `Enterprise API client must expose ${endpoint}`);
}

assert(enterpriseApi.includes('resolveEnterpriseDemoIdentifier(identifier, role)'), 'Enterprise demo admin/admin credentials must map by selected role');
assert(enterpriseApi.includes('createLead'), 'Enterprise API client must persist B2B leads');
assert(enterpriseApi.includes('requestConsultation'), 'Employee consultation request must use backend');
assert(enterprisePage.includes('riskPrecheck'), 'Old pre-shift flow must remain hidden under Risk / Pre-check, not deleted');
assert(!enterprisePage.includes('Start Today’s Check'), 'Old pre-shift workflow must not remain primary Enterprise CTA');

console.log('Enterprise navigation and API contract tests passed');
