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
assert(flow.includes("result.channel === 'email'"), 'Guest Doctor Now must explain email OTP fallback');
assert(flow.includes('roleApi.guestCreateUrgentConsultation'), 'Guest Doctor Now must create an urgent consultation');
assert(flow.includes('roleApi.createPaymentIntent'), 'Guest Doctor Now must continue to payment');
assert(flow.includes('paymentUnavailable'), 'Guest Doctor Now must handle unavailable acquiring without an API error');
assert(flow.includes('Заявка принята без списания средств'), 'Guest Doctor Now must explain disabled online payment');
assert(flow.includes("setStage('searching')"), 'Guest Doctor Now must show a matching stage before the room');
assert(flow.includes("setStage('matched')"), 'Guest Doctor Now must show the matched doctor before the room');
assert(flow.includes('Подбираем свободного врача'), 'Guest Doctor Now must expose useful matching progress');
assert(flow.includes('roleApi.consultationIceServers'), 'Guest Doctor Now must preflight call connectivity');
assert(flow.includes('navigator.mediaDevices.getUserMedia'), 'Guest Doctor Now must preflight camera and microphone');
assert(flow.includes("mediaState !== 'ready'"), 'Guest Doctor Now must gate room entry on media readiness');
assert(flow.includes('window.location.assign(`/consultation/${caseId}`)'), 'Guest Doctor Now must open the protected video room');
assert(!flow.includes("navigate('/patient-auth'"), 'Guest Doctor Now must never redirect to patient login');
assert(roleApi.includes("api<any>('/guest/urgent-consultations'"), 'roleApi must expose the guest urgent consultation endpoint');

for (const consent of ['acceptedTerms', 'acceptedPrivacy', 'acceptedTelemedicine']) {
  assert(flow.includes(consent), `Guest Doctor Now must collect ${consent}`);
}

console.log('Doctor Now guest frontend contract passed');
