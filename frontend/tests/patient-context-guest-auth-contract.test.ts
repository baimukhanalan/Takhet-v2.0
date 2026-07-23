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
const doctorNowFlow = read('src/components/DoctorNowFlow.tsx');
const roleApi = read('services/roleApi.ts');

assert(app.includes('<Route path="/guest-consultation"'), 'App must expose /guest-consultation as a public route');
assert(app.includes('<Navigate to="/patient-auth"'), 'Legacy guest booking must redirect to patient login');
assert(landing.includes("path: '/urgent-doctor'"), 'Landing must point to Doctor Now for urgent care without login');

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

for (const copy of [
  'Без регистрации',
  'roleApi.guestCreateUrgentConsultation',
  'roleApi.requestGuestPhoneOtp',
  'roleApi.verifyGuestPhoneOtp'
]) {
  assert(doctorNowFlow.includes(copy), `Doctor Now guest flow must include: ${copy}`);
}

for (const marker of ['\u0420\u2019', '\u0420\u045f', '\u0421\u0403', '\u0432\u0402', '\u0432\u201a\u0451', '\ufffd\ufffd\ufffd\ufffd']) {
  assert(!doctorNowFlow.includes(marker), `Doctor Now source must not contain mojibake marker: ${marker}`);
}

console.log('Patient context, guest consultation and auth recovery frontend contract passed');
