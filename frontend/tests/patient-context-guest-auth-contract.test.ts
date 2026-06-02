import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const app = read('src/App.tsx');
const landing = read('src/pages/LandingPage.tsx');
const dashboard = read('src/pages/PatientDashboard.tsx');
const archive = read('src/pages/MedicalArchive.tsx');
const consultationRoom = read('src/pages/ConsultationRoom.tsx');
const authPage = read('src/pages/AuthPage.tsx');
const roleApi = read('services/roleApi.ts');

assert(app.includes("GuestConsultationPage"), 'App must lazy-load GuestConsultationPage');
assert(app.includes('<Route path="/guest-consultation"'), 'App must expose /guest-consultation as a public route');
assert(landing.includes("path: '/guest-consultation'"), 'Landing consultation CTA must point to the guest consultation catalog');

for (const expected of [
  'patientExportContext',
  'patientExportCase',
  'patientShareContextToCase',
  'guestCreateConsultation',
  'requestEmailVerification',
  'confirmEmailVerification',
  'requestPasswordReset',
  'resetPassword'
]) {
  assert(roleApi.includes(expected), `roleApi must expose ${expected}`);
}

assert(dashboard.includes('Экспорт контекста'), 'Patient dashboard must expose the context export action');
assert(dashboard.includes('roleApi.patientExportContext'), 'Patient dashboard must call patientExportContext');
assert(archive.includes('Экспорт кейса'), 'Medical archive must expose a single-case export action');
assert(archive.includes('roleApi.patientExportCase'), 'Medical archive must call patientExportCase');
assert(consultationRoom.includes('roleApi.patientShareContextToCase'), 'Consultation room must auto-share patient context to doctor chat');

for (const copy of [
  'Подтвердить почту',
  'Восстановить доступ',
  'requestEmailVerification',
  'requestPasswordReset'
]) {
  assert(authPage.includes(copy), `Auth page must expose email verification/recovery flow: ${copy}`);
}

const guestPage = read('src/pages/GuestConsultationPage.tsx');
for (const copy of [
  'Консультация без регистрации',
  'финальное PDF-заключение доступно один раз',
  'саммари консультации не сохраняется в медархиве',
  'roleApi.publicDoctors',
  'roleApi.guestCreateConsultation'
]) {
  assert(guestPage.includes(copy), `Guest consultation page must include: ${copy}`);
}

for (const marker of ['Р’', 'Рџ', 'СЃ', 'вЂ', 'в‚ё', '����']) {
  assert(!guestPage.includes(marker), `Guest consultation source must not contain mojibake marker: ${marker}`);
}

console.log('Patient context, guest consultation and auth recovery frontend contract passed');
