import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const commonLogin = 'baimukhanalan1@gmail.com';

const authPage = read('src/pages/AuthPage.tsx');
const patientAuthPage = read('src/pages/PatientAuthPage.tsx');
const adminAuthPage = read('src/pages/AdminAuthPage.tsx');
const enterprisePage = read('src/pages/EnterpriseApp.tsx');
const labsApp = read('src/pages/TakhetLabsApp.tsx');
const labsPage = read('src/pages/TakhetLabsPage.tsx');
const partnersPage = read('src/pages/PartnersPage.tsx');
const doctorsPage = read('src/pages/DoctorsPage.tsx');

for (const [name, source] of [
  ['AuthPage', authPage],
  ['PatientAuthPage', patientAuthPage],
  ['AdminAuthPage', adminAuthPage],
  ['EnterpriseApp', enterprisePage],
  ['TakhetLabsApp', labsApp]
] as const) {
  assert(!source.includes(`useState('${commonLogin}')`), `${name} must not prefill shared credentials into auth inputs`);
  assert(!source.includes(`useState("${commonLogin}")`), `${name} must not prefill shared credentials into auth inputs`);
}

assert(enterprisePage.includes('Цифровое медицинское сопровождение предприятий'), 'Enterprise hero must use requested headline');
assert(!enterprisePage.includes('Корпоративный доступ к помощи без слежки за сотрудниками'), 'Enterprise must not keep old hero headline');
assert(!enterprisePage.includes('2 000 ₸ / сотрудник'), 'Enterprise visible pricing must not expose Starter price');
assert(!enterprisePage.includes('4 000-6 000 ₸ / сотрудник'), 'Enterprise visible pricing must not expose Business price');
assert(enterprisePage.includes('data-enterprise-roi-calculator'), 'Enterprise must include restored ROI calculator');
assert(enterprisePage.includes('data-enterprise-final-section'), 'Enterprise must include a clear final section');

assert(partnersPage.includes('data-partner-roi-calculator'), 'Partners page must include a partner ROI calculator');
assert(labsPage.includes('data-labs-problem-solution'), 'Takhet Labs must include a problem/solution section');
assert(labsPage.includes('data-labs-final-section'), 'Takhet Labs must include a clear final section');
assert(doctorsPage.includes('data-doctors-hero-shell'), 'Doctors hero must be rebuilt as a Takhet landing hero shell');
assert(doctorsPage.includes('inline-flex items-center gap-2 px-4 py-2 bg-primary/5'), 'Doctors hero must use the same badge style as other public landings');

console.log('Public sections and demo login contract passed');
