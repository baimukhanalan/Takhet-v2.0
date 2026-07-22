import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const flow = read('src/components/DoctorNowFlow.tsx');
const roleApi = read('services/roleApi.ts');

assert(flow.includes('Продолжить без входа'), 'Guest Doctor Now must not require login');
assert(flow.includes('roleApi.requestGuestPhoneOtp'), 'Guest Doctor Now must verify the phone by SMS');
assert(flow.includes('roleApi.verifyGuestPhoneOtp'), 'Guest Doctor Now must validate the SMS code');
assert(flow.includes('roleApi.guestCreateUrgentConsultation'), 'Guest Doctor Now must create an urgent consultation');
assert(flow.includes('roleApi.createPaymentIntent'), 'Guest Doctor Now must continue to payment');
assert(flow.includes('window.location.assign(`/consultation/${caseId}`)'), 'Guest Doctor Now must open the protected video room');
assert(!flow.includes("navigate('/patient-auth'"), 'Guest Doctor Now must never redirect to patient login');
assert(roleApi.includes("api<any>('/guest/urgent-consultations'"), 'roleApi must expose the guest urgent consultation endpoint');

for (const consent of ['acceptedTerms', 'acceptedPrivacy', 'acceptedTelemedicine']) {
  assert(flow.includes(consent), `Guest Doctor Now must collect ${consent}`);
}

console.log('Doctor Now guest frontend contract passed');
