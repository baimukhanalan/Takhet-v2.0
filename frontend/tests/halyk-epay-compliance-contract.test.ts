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

for (const legalValue of [
  'ИП "Алам"',
  '850707401371',
  'takhetplus@gmail.com',
  '+7 (778) 532 4978',
  'Казахстан',
  'Алматы',
  'Самал-3, дом 15',
  'пн-пт с 9:00 до 18:00',
  'без НДС'
]) {
  assert(footer.includes(legalValue) || legalPage.includes(legalValue), `Compliance layer must expose: ${legalValue}`);
}

for (const removedPlaceholder of ['COMPANY_NAME', 'SUPPORT_EMAIL', 'PHONE_NUMBER', 'ADDRESS']) {
  assert(!footer.includes(removedPlaceholder), `Footer must not keep placeholder ${removedPlaceholder}`);
  assert(!legalPage.includes(removedPlaceholder), `Legal pages must not keep placeholder ${removedPlaceholder}`);
}

for (const method of ['Halyk ePay', 'Visa', 'Mastercard', '3D Secure']) {
  assert(footer.includes(method), `Footer must show payment indicator ${method}`);
  assert(legalPage.includes(method), `Legal pages must mention payment method ${method}`);
}

assert(footer.includes('https://epayment.kz'), 'Footer must link the Halyk ePay informer to ePay');
assert(legalPage.includes('https://epayment.kz'), 'Legal pages must link the Halyk ePay informer to ePay');

for (const requiredCopy of [
  'Публичная оферта',
  'Политика конфиденциальности',
  'Соглашение о защите персональных данных',
  'Политика возврата',
  'Порядок оформления услуги',
  'Способы и условия оплаты',
  'Сроки оказания услуги',
  'Аннулирование и отмена заказа',
  'Замена услуги',
  'Возврат денежных средств',
  'Меры безопасности платежей',
  'Перечень платных услуг',
  'онлайн-консультация врача',
  '300 ₸',
  'стоимость указывается в казахстанских тенге',
  'данные банковских карт не сохраняются'
]) {
  assert(legalPage.includes(requiredCopy), `Legal page content must include: ${requiredCopy}`);
}

for (const dangerousClaim of [
  'AI diagnosis',
  'replaces doctors',
  'guaranteed treatment',
  'точный диагноз от AI',
  'заменяет врача',
  'гарантированное лечение'
]) {
  assert(!legalPage.includes(dangerousClaim), `Legal copy must not contain dangerous claim: ${dangerousClaim}`);
}

for (const marker of ['\u0420\u045f', '\u0420\u040e', '\u0420\u045c', 'Р‘', 'Р§', 'Рњ', '\u0432\u0402', '\ufffd', 'пїЅ']) {
  assert(!footer.includes(marker), `Footer must not contain mojibake marker ${marker}`);
  assert(!legalPage.includes(marker), `Legal page must not contain mojibake marker ${marker}`);
}

assert(landing.includes('ComplianceFooter'), 'Landing page must use the compliance footer');

console.log('Halyk ePay compliance contract tests passed');
