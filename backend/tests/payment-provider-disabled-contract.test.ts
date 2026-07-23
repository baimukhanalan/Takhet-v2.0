import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const paymentsService = readFileSync(resolve(process.cwd(), 'src/payments/payments.service.ts'), 'utf8');

assert(paymentsService.includes("env.paymentProvider !== 'kaspi'"), 'Disabled acquiring must be handled before creating a payment row');
assert(paymentsService.includes('available: false'), 'Disabled acquiring must return a stable unavailable response');
assert(paymentsService.includes('paymentRequired: false'), 'Disabled acquiring must not claim that payment was captured or required');
assert(paymentsService.includes('paymentUrl: null'), 'Disabled acquiring must not return a fake payment URL');

console.log('Disabled payment provider contract passed');
