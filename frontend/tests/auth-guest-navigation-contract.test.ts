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
const doctorNowFlow = read('src/components/DoctorNowFlow.tsx');
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

for (const marker of [
  'roleApi.requestGuestPhoneOtp',
  'roleApi.verifyGuestPhoneOtp',
  'otpCode',
  'Без регистрации',
  'Продолжить без входа'
]) {
  assert(doctorNowFlow.includes(marker), `Doctor Now guest flow must implement marker: ${marker}`);
}

assert(
  app.includes('<Route path="/guest-consultation" element={<Navigate to="/patient-auth"'),
  'Legacy guest booking route must redirect to patient login'
);
assert(sidebar.includes("to: '/takhet-ai/patient?urgent=1'"), 'Patient sidebar must expose Doctor Now');

for (const apiMethod of ['requestGuestPhoneOtp', 'verifyGuestPhoneOtp']) {
  assert(roleApi.includes(apiMethod), `roleApi must expose guest OTP method: ${apiMethod}`);
}
assert(roleApi.includes('startGoogleAuth'), 'roleApi must expose Google auth start method without changing auth UI');

assert(!labsApp.includes('<PublicHeader activePath="/takhet-labs" />'), 'Takhet Labs login must not render the public header inside auth template');
assert(!enterpriseApp.includes('<PublicHeader activePath="/enterprise" />') || enterpriseApp.includes('EnterpriseLanding'), 'Enterprise login should follow auth template, not duplicate public header in login form');

console.log('Auth, guest consultation and navigation frontend contract passed');
