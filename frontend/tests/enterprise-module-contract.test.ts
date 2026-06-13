import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const app = read('src/App.tsx');
const enterprisePage = read('src/pages/EnterpriseApp.tsx');

const mustInclude = (source: string, value: string, message: string) => {
  assert(source.includes(value), message);
};

const forbidden = [
  'Вариант A',
  'Вариант B',
  'Вариант C',
  'approved for work',
  'medical clearance',
  'cleared for work',
  'диагноз от AI',
  'работодатель видит данные сотрудника',
  'внутренний тариф врача',
  'system prompt',
  'internal tariff',
  'Digital Workforce Health & Risk Monitoring Platform'
];

const mojibakeMarkers = ['\u0420\u2019', '\u0420\u045f', 'Р›', '\u0421\u0403', '\u0432\u0402', '\u0420\u045c'];

mustInclude(app, '/enterprise/login', 'App must expose separate Enterprise login route');
mustInclude(app, '/enterprise/*', 'App must expose Enterprise namespace route');
mustInclude(app, 'enterprise.takhet.com', 'App must route enterprise subdomain into Enterprise namespace');

mustInclude(enterprisePage, 'Takhet Enterprise', 'Enterprise must use product name');
mustInclude(enterprisePage, 'Цифровое медицинское сопровождение предприятий', 'Enterprise landing must use requested B2B healthcare hero');
mustInclude(enterprisePage, 'Корпоративная телемедицина', 'Enterprise landing must explain corporate healthcare positioning');
mustInclude(enterprisePage, 'AI-поддержка 24/7', 'Enterprise landing must include AI mental support positioning');
mustInclude(enterprisePage, 'обезличенная аналитика', 'Enterprise landing must emphasize anonymized analytics');
mustInclude(enterprisePage, 'Запросить пилот', 'Enterprise landing must have pilot CTA');
mustInclude(enterprisePage, 'Посчитать эффект', 'Enterprise landing must have ROI CTA');
mustInclude(enterprisePage, 'Starter', 'Enterprise landing must include Starter plan');
mustInclude(enterprisePage, 'Business', 'Enterprise landing must include Business plan');
mustInclude(enterprisePage, 'Enterprise', 'Enterprise landing must include Enterprise plan');
mustInclude(enterprisePage, 'Работодатель не видит личные медицинские данные', 'Enterprise must expose privacy promise');
mustInclude(enterprisePage, 'только агрегированные данные', 'Enterprise must say employer analytics are aggregate-only');
mustInclude(enterprisePage, 'группа меньше 10 сотрудников', 'Enterprise must explain minimum group privacy threshold');
mustInclude(enterprisePage, 'B2BLeadForm', 'Enterprise landing must persist B2B leads through a lead form');
mustInclude(enterprisePage, 'enterpriseApi.createLead', 'Lead form must use backend API, not localStorage');

for (const role of ['Employee', 'Employer / HR', 'Doctor', 'Psychologist', 'Takhet Admin', 'Clinical Supervisor']) {
  mustInclude(enterprisePage, role, `Enterprise login must include ${role} role`);
}

for (const menuItem of [
  'AI поддержка 24/7',
  'Срочно к врачу',
  'Записаться к специалисту',
  'Психологическая поддержка',
  'Мои лимиты',
  'История консультаций',
  'Privacy & Compliance',
  'Triage Summary',
  'Quality Review',
  'Doctor Notes Audit',
  'Risk / Pre-check'
]) {
  mustInclude(enterprisePage, menuItem, `Enterprise role menus must include ${menuItem}`);
}

mustInclude(enterprisePage, 'PublicHeader activePath="/enterprise"', 'Enterprise public/login pages must use Takhet public header');
mustInclude(enterprisePage, 'min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden', 'Enterprise login must follow Takhet auth shell');
mustInclude(enterprisePage, 'bg-background border-r border-border h-screen', 'Enterprise portals must follow Takhet portal sidebar shell');
mustInclude(enterprisePage, 'bg-background/70 backdrop-blur-xl border-b border-border', 'Enterprise portals must follow Takhet portal header shell');

for (const value of forbidden) {
  assert(!enterprisePage.includes(value), `Enterprise UI must not expose forbidden phrase: ${value}`);
}

for (const marker of mojibakeMarkers) {
  assert(!enterprisePage.includes(marker), `Enterprise source must not contain mojibake marker: ${marker}`);
}

console.log('Enterprise B2B module contract tests passed');
