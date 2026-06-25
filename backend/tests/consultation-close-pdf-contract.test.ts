import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const doctorController = readFileSync(resolve(process.cwd(), 'src/doctor/doctor.controller.ts'), 'utf8');
const profilesService = readFileSync(resolve(process.cwd(), 'src/profiles/profiles.service.ts'), 'utf8');

assert(
  profilesService.includes('finalizeConsultationReportOnClose'),
  'ProfilesService must expose an idempotent consultation close finalizer'
);
assert(
  doctorController.includes("if (dto.status === 'closed')") &&
    doctorController.includes('finalizeConsultationReportOnClose(id, doctorId)') &&
    doctorController.indexOf('finalizeConsultationReportOnClose(id, doctorId)') <
      doctorController.indexOf('setDoctorCaseStatus(id, doctorId, dto.status)'),
  'Doctor closing a case must finalize the consultation PDF before setting the case closed'
);

console.log('Consultation close PDF contract passed');
