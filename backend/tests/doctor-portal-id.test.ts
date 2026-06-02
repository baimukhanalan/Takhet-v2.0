import { strict as assert } from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';

const source = readFileSync(join(process.cwd(), 'src', 'doctors', 'doctors.service.ts'), 'utf8');

assert.match(
  source,
  /if\s*\(directDoctor\)\s*\{\s*return\s+directDoctor\.id;\s*\}/s,
  'doctor portal identity must prefer the doctor row directly linked to the logged-in doctor user'
);

const directDoctorIndex = source.indexOf('if (directDoctor) {');
const singleActiveFallbackIndex = source.indexOf('if (activeDoctors.length === 1)');

assert.ok(directDoctorIndex >= 0, 'direct doctor branch must exist');
assert.ok(singleActiveFallbackIndex >= 0, 'single active fallback must exist for legacy unlinked doctor users');
assert.ok(
  directDoctorIndex < singleActiveFallbackIndex,
  'direct doctor branch must run before single-active-doctor legacy fallback'
);

console.log('doctor portal identity smoke passed');
