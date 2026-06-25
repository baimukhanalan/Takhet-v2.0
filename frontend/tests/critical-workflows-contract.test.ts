import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const enterpriseApp = read('src/pages/EnterpriseApp.tsx');
const labsApp = read('src/pages/TakhetLabsApp.tsx');
const patientAppointments = read('src/pages/PatientAppointments.tsx');
const roleApi = read('services/roleApi.ts');
const webRtc = read('src/services/webrtc.ts');
const consultationRoom = read('src/pages/ConsultationRoom.tsx');

const forbiddenAutoPostRoutes = [
  ['/enterprise/employee/ai-support', 'startAiSession'],
  ['/enterprise/employee/duty-doctor', 'requestConsultation'],
  ['/enterprise/employee/specialist', 'requestConsultation'],
  ['/enterprise/employee/psychology', 'requestConsultation']
] as const;

for (const [route, method] of forbiddenAutoPostRoutes) {
  const mutatingLoader = new RegExp(
    `${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]:\\s*\\{[\\s\\S]{0,700}?loader:\\s*\\(\\)\\s*=>\\s*enterpriseApi\\.${method}`
  );
  assert(!mutatingLoader.test(enterpriseApp), `${route} must not call enterpriseApi.${method} from a route loader`);
}

assert(enterpriseApp.includes('EmployeeActionPage'), 'Enterprise employee service routes must render an explicit action page');
assert(enterpriseApp.includes('handleEmployeeAction'), 'Enterprise employee mutations must be triggered by an explicit user action');
assert(enterpriseApp.includes('enterpriseApi.employeeBenefits'), 'Enterprise employee action pages must load read-only benefits/context first');
assert(
  enterpriseApp.includes('awaitingConfirmation') &&
    enterpriseApp.includes('setAwaitingConfirmation(true)') &&
    enterpriseApp.includes("setTimeout(() => setAwaitingConfirmation(false)") &&
    !enterpriseApp.includes('window.confirm(confirmEnterpriseDashboardAction'),
  'Enterprise employee dashboard cards must use an inline two-step confirmation before creating real sessions/consultation requests'
);

assert(labsApp.includes('resolveLabsPortalPage'), 'Takhet Labs app must route each menu path to a dedicated page resolver');
assert(!labsApp.includes('<LabsPortalPage role={role} />'), 'Takhet Labs app must not collapse every subpage into one generic dashboard');

for (const expectedPage of [
  'LabsMemberBiomarkersPage',
  'LabsMemberProtocolPage',
  'LabsPhysicianReviewQueuePage',
  'LabsAdminMembershipsPage'
]) {
  assert(labsApp.includes(expectedPage), `Takhet Labs standalone portal must include ${expectedPage}`);
}

assert(!patientAppointments.includes('createPaymentIntent(15000'), 'Patient appointments must not hardcode payment amount on the frontend');
assert(roleApi.includes('createPaymentIntent: (caseId: string)'), 'Frontend payment intent API must send case id only');
assert(!roleApi.includes('body: JSON.stringify({ amount, caseId })'), 'Frontend payment API must not send client-controlled amount');

assert(webRtc.includes('getConfiguredIceServers'), 'WebRTC must expose a configured ICE server resolver');
assert(roleApi.includes('consultationIceServers'), 'Role API must expose backend ICE server configuration');
assert(!webRtc.includes("iceServers.length > 0 ? iceServers : [{ urls: 'stun:stun.l.google.com:19302' }]"), 'WebRTC must not silently rely on STUN-only fallback inside the peer constructor');

assert(consultationRoom.includes('syncConsultationReport'), 'Consultation room must sync consultation report state while open');
assert(consultationRoom.includes("doctorUpdateCaseStatus(caseItem.id, 'closed')"), 'Doctor ending a consultation must close the case');
assert(consultationRoom.includes('patientSaveConsultationDraft'), 'Ending a consultation must persist the current patient-room context before navigation');
assert(consultationRoom.includes("consultationSignal(caseItem.id, { type: 'leave'"), 'Ending a consultation must notify the other participant with a leave signal');

console.log('Critical frontend workflow contract passed');
