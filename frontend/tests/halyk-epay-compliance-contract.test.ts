import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const app = read('src/App.tsx');
const footer = read('src/components/ComplianceFooter.tsx');
const legalPage = read('src/pages/LegalPage.tsx');
const landing = read('src/pages/LandingPage.tsx');

for (const route of ['/offer', '/privacy', '/refund', '/terms', '/contacts']) {
  assert(app.includes(`path="${route}"`), `Missing legal route ${route}`);
  assert(footer.includes(`to: '${route}'`), `Footer must link to ${route}`);
}

for (const legalValue of ['ИП "Алам"', '850707401371', 'takhetplus@gmail.com', '+7 (778) 532 4978']) {
  assert(footer.includes(legalValue), `Footer must expose legal value ${legalValue}`);
  assert(legalPage.includes(legalValue), `Legal pages must expose legal value ${legalValue}`);
}

for (const removedPlaceholder of ['COMPANY_NAME', 'SUPPORT_EMAIL', 'PHONE_NUMBER']) {
  assert(!footer.includes(removedPlaceholder), `Footer must not keep placeholder ${removedPlaceholder}`);
  assert(!legalPage.includes(removedPlaceholder), `Legal pages must not keep placeholder ${removedPlaceholder}`);
}

for (const method of ['Visa', 'Mastercard', 'Halyk QR']) {
  assert(footer.includes(method), `Footer must show payment indicator ${method}`);
  assert(legalPage.includes(method), `Legal pages must mention payment method ${method}`);
}

for (const copy of ['Refund Policy', 'Privacy Policy', 'Offer / Terms', 'Contacts']) {
  assert(footer.includes(copy), `Footer must include ${copy}`);
}

for (const title of ['Публичная оферта', 'Политика конфиденциальности', 'Политика возврата', 'Пользовательские условия', 'Контакты']) {
  assert(legalPage.includes(title), `Legal page content must include ${title}`);
}

for (const dangerousClaim of ['AI diagnosis', 'replaces doctors', 'guaranteed treatment', 'точный диагноз от AI', 'заменяет врача', 'гарантированное лечение']) {
  assert(!legalPage.includes(dangerousClaim), `Legal copy must not contain dangerous claim: ${dangerousClaim}`);
}

assert(landing.includes('ComplianceFooter'), 'Landing page must use the compliance footer');

console.log('Halyk ePay compliance contract tests passed');
