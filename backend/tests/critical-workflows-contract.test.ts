import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const paymentsController = read('src/payments/payments.controller.ts');
const paymentsService = read('src/payments/payments.service.ts');
const envConfig = read('src/config/env.config.ts');
const guestService = read('src/guest/guest.service.ts');
const casesController = read('src/cases/cases.controller.ts');
const doctorsController = read('src/doctors/doctors.controller.ts');
const guestController = read('src/guest/guest.controller.ts');

assert(!paymentsController.includes('@Min(100)\n  amount!'), 'Payment controller must not validate a client-controlled amount');
assert(!paymentsController.includes('dto.amount'), 'Payment controller must not pass client-controlled amount into PaymentsService');
assert(paymentsController.includes('createIntent(req.user.id, dto.caseId)'), 'Payment controller must create intent from user id and case id only');
assert(paymentsService.includes('resolveCasePaymentAmount'), 'PaymentsService must resolve case payment amount server-side');
assert(paymentsService.includes('getDoctorProfile'), 'PaymentsService must use doctor profile pricing when a case has an assigned doctor');
assert(!paymentsService.includes('async createIntent(userId: string, amount: number, caseId: string)'), 'PaymentsService createIntent must not accept client amount');
assert(!paymentsService.includes('fallbackAmount = 15000'), 'PaymentsService must not silently fall back to 15000 when doctor/case price is missing');
assert(paymentsService.includes('Unable to determine consultation price'), 'PaymentsService must fail clearly when a payable consultation price cannot be resolved');

assert(doctorsController.includes("@Get('catalog')"), 'Doctors controller must expose /doctors/catalog before /doctors/:id');
assert(guestController.includes("@Get('doctors')"), 'Guest controller must expose /guest/doctors for guest consultation previews');

assert(envConfig.includes('turnIceServersJson'), 'Environment config must expose TURN/ICE server JSON');
assert(casesController.includes("@Get('ice-servers')"), 'Cases controller must expose ICE server configuration for consultation rooms');
assert(casesController.includes('turnIceServersJson'), 'Cases controller must read configured TURN/ICE servers from env');
assert(casesController.includes('relayConfigured: false'), 'ICE endpoint must explicitly report when TURN/relay is not configured');

assert(envConfig.includes('smsApiUrl'), 'Environment config must expose SMS API URL for real provider delivery');
assert(guestService.includes('sendSmsViaProvider'), 'Guest service must use a provider adapter for SMS OTP delivery');
assert(!guestService.includes('queued by provider'), 'Guest SMS delivery must not fake provider success when a provider is configured');
assert(guestService.includes("provider === 'mock'"), 'Guest SMS mock mode must be explicit and non-production only');

console.log('Critical backend workflow contract passed');
