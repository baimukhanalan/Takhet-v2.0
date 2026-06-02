import { strict as assert } from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';

const source = readFileSync(join(process.cwd(), 'src', 'cases', 'cases.service.ts'), 'utf8');

assert.match(source, /BadRequestException/, 'invalid case ids must be rejected as client errors, not database 500s');
assert.match(source, /private assertUuid\(value: string, label: string\)/, 'case service must centralize UUID format validation');
assert.match(
  source,
  /findDoctorCaseById\(doctorId: string, caseId: string\)\s*\{\s*const found = await this\.findDoctorCaseEntityById\(doctorId, caseId\);/s,
  'doctor case lookup must validate case id before hitting TypeORM'
);
assert.match(
  source,
  /setDoctorCaseStatus\(caseId: string, doctorId: string,[\s\S]+?const found = await this\.findDoctorCaseEntityById\(doctorId, caseId\);/s,
  'doctor status updates must save the real entity, not a normalized response object'
);
assert.match(
  source,
  /resolveAppointmentDoctorId[\s\S]+?this\.assertUuid\(explicitDoctorId, 'Doctor id'\);/s,
  'patient booking must reject malformed explicit doctor ids before creating a case'
);

console.log('case id validation source smoke passed');
