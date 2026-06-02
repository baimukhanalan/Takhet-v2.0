import { strict as assert } from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';

const source = readFileSync(join(process.cwd(), 'src', 'profiles', 'profiles.service.ts'), 'utf8');

const aiFinalizeStart = source.indexOf('async finalizeAiConsultationReport');
const nextMethodStart = source.indexOf('\n  private async getSettingsValue', aiFinalizeStart);
const aiFinalizeBody = source.slice(aiFinalizeStart, nextMethodStart);

assert.ok(aiFinalizeStart >= 0, 'AI consultation finalize method must exist');
assert.doesNotMatch(
  aiFinalizeBody,
  /throw new NotFoundException\('Consultation draft not found'\)/,
  'AI consultation finalize must create a report even if draft was not saved before the user ends the room'
);
assert.match(aiFinalizeBody, /const baseReport: StoredConsultationReport = existing \?\?/);
assert.match(aiFinalizeBody, /status: 'confirmed'/);
assert.match(aiFinalizeBody, /pdfBase64/);

console.log('consultation report finalize smoke passed');
