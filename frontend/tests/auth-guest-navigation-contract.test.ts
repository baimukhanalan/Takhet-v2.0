import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const app = read('src/App.tsx');
const sidebar = read('src/components/Sidebar.tsx');
const authPage = read('src/pages/AuthPage.tsx');
const guestPage = read('src/pages/GuestConsultationPage.tsx');
const roleApi = read('services/roleApi.ts');
const labsApp = read('src/pages/TakhetLabsApp.tsx');
const enterpriseApp = read('src/pages/EnterpriseApp.tsx');

const patientLinksBlock = sidebar.match(/const patientLinks = \[[\s\S]*?\];/)?.[0] || '';
assert(patientLinksBlock.includes("to: '/health-browser'"), 'Patient sidebar must keep AI Browser route');
assert(patientLinksBlock.includes('label: t.sidebar.healthBrowser'), 'Patient sidebar must keep AI Browser i18n label');
assert(app.includes("navigate('/', { replace: true })"), 'Main portal logout must route to landing page');
assert(labsApp.includes("navigate('/', { replace: true })"), 'Takhet Labs logout must route to landing page');
assert(enterpriseApp.includes("navigate('/', { replace: true })"), 'Enterprise logout must route to landing page');

assert(authPage.includes('goBackOrHome'), 'Auth back action must use previous page fallback');
assert(authPage.includes('type="email"'), 'Auth email field must use email input type');
assert(authPage.includes('showPassword'), 'Auth registration/login must allow password visibility toggle');
assert(authPage.includes("type={showPassword ? 'text' : 'password'}"), 'Auth password input must switch between hidden and visible');
assert(authPage.includes('emailRegex'), 'Auth page must validate email format before submit');

for (const removedCopy of ['Выбранный врач', 'Ваше имя', 'Email для одноразового PDF', 'Получить консультацию']) {
  assert(!guestPage.includes(removedCopy), `Guest consultation must remove old side form copy: ${removedCopy}`);
}

for (const marker of [
  'selectedDoctor',
  'selectedDate',
  'selectedSlot',
  'roleApi.publicDoctor',
  'roleApi.requestGuestPhoneOtp',
  'roleApi.verifyGuestPhoneOtp',
  'otpCode',
  'Подтвердить телефон'
]) {
  assert(guestPage.includes(marker), `Guest consultation must implement expanded doctor profile/OTP marker: ${marker}`);
}

for (const apiMethod of ['requestGuestPhoneOtp', 'verifyGuestPhoneOtp']) {
  assert(roleApi.includes(apiMethod), `roleApi must expose guest OTP method: ${apiMethod}`);
}
assert(roleApi.includes('startGoogleAuth'), 'roleApi must expose Google auth start method without changing auth UI');

assert(!labsApp.includes('<PublicHeader activePath="/takhet-labs" />'), 'Takhet Labs login must not render the public header inside auth template');
assert(!enterpriseApp.includes('<PublicHeader activePath="/enterprise" />') || enterpriseApp.includes('EnterpriseLanding'), 'Enterprise login should follow auth template, not duplicate public header in login form');

console.log('Auth, guest consultation and navigation frontend contract passed');
