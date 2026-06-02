import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const appModule = read('src/app.module.ts');
const patientController = read('src/patient/patient.controller.ts');
const profilesService = read('src/profiles/profiles.service.ts');
const authController = read('src/auth/auth.controller.ts');
const authService = read('src/auth/auth.service.ts');

for (const route of [
  "@Get('context-export')",
  "@Get('case/:id/export-context')",
  "@Post('case/:id/share-context')"
]) {
  assert(patientController.includes(route), `PatientController must expose ${route}`);
}

for (const method of [
  'exportPatientContext',
  'exportPatientCaseContext',
  'sharePatientContextToCase',
  'Контекст пациента для врача',
  'Медицинский архив',
  'Хронические и важные особенности'
]) {
  assert(profilesService.includes(method), `ProfilesService must implement patient context export marker: ${method}`);
}

assert(appModule.includes('GuestModule'), 'AppModule must register GuestModule');
const guestController = read('src/guest/guest.controller.ts');
const guestService = read('src/guest/guest.service.ts');

for (const route of ["@Controller('guest')", "@Post('consultations')"]) {
  assert(guestController.includes(route), `GuestController must expose ${route}`);
}

for (const value of [
  'createGuestConsultation',
  'guest consultation',
  'oneTimePdfToken',
  'summary_not_stored_in_med_archive'
]) {
  assert(guestService.includes(value), `GuestService must include ${value}`);
}

for (const route of [
  "@Post('request-email-verification')",
  "@Post('confirm-email-verification')",
  "@Post('request-password-reset')",
  "@Post('reset-password')"
]) {
  assert(authController.includes(route), `AuthController must expose ${route}`);
}

for (const value of [
  'requestEmailVerification',
  'confirmEmailVerification',
  'requestPasswordReset',
  'resetPassword',
  'sendAuthEmail',
  'buildEmailVerificationUrl',
  'buildPasswordResetUrl',
  'assertPasswordSafe',
  'checkPasswordBreach',
  'api.pwnedpasswords.com/range',
  'auth.email.delivery.sent',
  'auth.email.delivery.failed',
  'auth_tokens',
  'auth_email_status',
  'token_hash'
]) {
  assert(authService.includes(value), `AuthService must implement ${value}`);
}

const envConfig = read('src/config/env.config.ts');
for (const value of ['resendApiKey', 'authEmailFrom', 'RESEND_API_KEY', 'AUTH_EMAIL_FROM']) {
  assert(envConfig.includes(value), `env config must expose ${value}`);
}

for (const marker of ['Р’', 'Рџ', 'СЃ', 'вЂ', 'в‚ё', '����']) {
  for (const [name, source] of [
    ['patient.controller', patientController],
    ['auth.controller', authController],
    ['auth.service', authService],
    ['guest.controller', guestController],
    ['guest.service', guestService]
  ] as const) {
    assert(!source.includes(marker), `${name} must not contain mojibake marker: ${marker}`);
  }
}

console.log('Patient context, guest consultation and auth recovery backend contract passed');
