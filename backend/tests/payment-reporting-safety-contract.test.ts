import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const paymentsService = read('src/payments/payments.service.ts');
const adminPortalService = read('src/admin/admin-portal.service.ts');

assert(paymentsService.includes('isCapturedPaymentForReporting'), 'Payment reporting must use a named captured-payment guard');
assert(paymentsService.includes("payment.provider === 'kaspi'"), 'Captured-payment guard must accept only real Kaspi provider records');
assert(paymentsService.includes('Boolean(payment.providerPaymentId)'), 'Captured-payment guard must require a provider transaction id');
assert(!paymentsService.includes('kaspi_stub'), 'Payment service must not reference kaspi_stub as a valid provider');
assert(adminPortalService.includes('this.paymentsService.isCapturedPaymentForReporting(payment)'), 'Admin revenue history must exclude unsafe legacy stub-paid records');

console.log('Payment reporting safety contract passed');
