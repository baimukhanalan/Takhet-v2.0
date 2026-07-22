import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const authController = read('src/auth/auth.controller.ts');
const authService = read('src/auth/auth.service.ts');
const guestController = read('src/guest/guest.controller.ts');
const guestService = read('src/guest/guest.service.ts');
const envConfig = read('src/config/env.config.ts');
const main = read('src/main.ts');

for (const marker of [
  'assertEmailVerifiedBeforePortalAccess',
  'verification_required',
  'pending_admin_approval',
  'portal_applications',
  'auth.email_verification.required',
  'auth.application.pending'
]) {
  assert(authService.includes(marker), `AuthService must include email/application gate marker: ${marker}`);
}

assert(authController.includes("return this.authService.register"), 'AuthController must return registration status from service');
assert(!authController.includes('const session = await this.authService.register'), 'Register endpoint must not issue a portal session immediately');
assert(!authController.includes('res.cookie(cookie.name, cookie.value, cookie.options);\\n    return session;'), 'Register endpoint must not set session cookie before email verification');
assert(main.includes('ValidationPipe'), 'Backend must enable class-validator ValidationPipe');
assert(main.includes('app.useGlobalPipes(new ValidationPipe'), 'Backend must register global validation pipe');
const authEmailActionDto = authController.match(/class AuthEmailActionDto[\s\S]*?class ConfirmEmailVerificationDto/)?.[0] || '';
assert(authEmailActionDto.includes('@IsEmail()'), 'Email verification and reset DTO must validate email format');
assert(authService.includes('const delivery = await this.sendAuthEmail'), 'Email verification/reset must use the real email provider delivery result');
assert(authService.includes('buildTokenDeliveryResponse(token, delivery)'), 'Auth email responses must include actual provider delivery diagnostics');
assert(authService.includes("'email_sent'"), 'Auth email delivery diagnostics must expose a successful email_sent state');
assert(authService.includes("'email_provider_failed'"), 'Auth email delivery diagnostics must expose a failed provider state');
assert(!authService.includes("'email_provider_attempted'"), 'Auth email delivery must not report attempted when provider failed');
assert(authController.includes("@Post('google/start')"), 'AuthController must expose Google OAuth start placeholder');
assert(authService.includes('createGoogleOAuthStart'), 'AuthService must build Google OAuth start URL');
assert(envConfig.includes('googleOAuthClientId'), 'env config must expose Google OAuth client id');
assert(envConfig.includes('googleOAuthClientSecret'), 'env config must expose Google OAuth client secret');
assert(envConfig.includes('googleOAuthRedirectUrl'), 'env config must expose Google OAuth redirect URL');

for (const route of ["@Post('phone-otp/request')", "@Post('phone-otp/verify')", "@Post('consultations')", "@Post('urgent-consultations')"]) {
  assert(guestController.includes(route), `GuestController must expose ${route}`);
}

for (const marker of [
  'requestPhoneOtp',
  'verifyPhoneOtp',
  'guest_phone_otps',
  'phone_verified_at',
  'otp_hash',
  'expires_at',
  'attempts',
  'consultation_reminders',
  'remind_at',
  'encryptSensitiveValue',
  'decryptSensitiveValue',
  'PII_ENCRYPTION_KEY',
  'SMS_PROVIDER'
]) {
  assert(guestService.includes(marker) || envConfig.includes(marker), `Guest/security backend must include marker: ${marker}`);
}
assert(guestService.includes("process.env.NODE_ENV === 'production'"), 'PII encryption must have production key guard');
assert(guestService.includes('PII_ENCRYPTION_KEY is required in production'), 'Production must fail clearly when PII_ENCRYPTION_KEY is missing');
assert(guestController.includes('issueGuestSession'), 'Guest Doctor Now must issue a session without asking for login credentials');
assert(guestController.includes('buildSessionCookie'), 'Guest Doctor Now must persist its protected session in an HTTP-only cookie');
assert(guestService.includes('createUrgentConsultation'), 'Guest service must create Doctor Now consultations');
assert(guestService.includes("'[DOCTOR_NOW]'"), 'Guest Doctor Now case must retain its server-side fixed-price marker');
assert(guestService.includes("'awaiting_payment'"), 'Guest Doctor Now request must wait for payment confirmation');
assert(guestService.includes('sendGuestOtpEmail'), 'Guest OTP must fall back to configured email delivery when SMS is unavailable');
assert(guestService.includes("channel = 'email'"), 'Guest OTP response must identify email fallback delivery');

for (const value of ['smsProvider', 'smsApiKey', 'smsSender', 'piiEncryptionKey']) {
  assert(envConfig.includes(value), `env config must expose ${value}`);
}

console.log('Auth, guest consultation and PII security backend contract passed');
