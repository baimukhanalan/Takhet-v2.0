import { strict as assert } from 'assert';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
const scriptPath = join(process.cwd(), 'scripts', 'migrate-functional-schema.js');

assert.equal(packageJson.scripts?.['migrate:functional'], 'node scripts/migrate-functional-schema.js');
assert.equal(existsSync(scriptPath), true, 'functional schema migration script must exist');

const script = readFileSync(scriptPath, 'utf8');
assert.match(script, /CREATE TABLE IF NOT EXISTS consultation_signals/);
assert.match(script, /idx_consultation_signals_case_id_id/);
assert.match(script, /process\.env\.DATABASE_URL/);

console.log('functional migration smoke passed');
