import { strict as assert } from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';

const source = readFileSync(join(process.cwd(), 'src', 'cases', 'cases.service.ts'), 'utf8');

assert.match(source, /\^Врач:\\s\*\(\.\+\)\$/);
assert.match(source, /\^Специальность:\\s\*\(\.\+\)\$/);
assert.match(source, /\^Дата:\\s\*\(\.\+\)\$/);
assert.match(source, /\^Время:\\s\*\(\.\+\)\$/);
assert.match(source, /Новая запись/);
assert.match(source, /Пациент записался/);

console.log('booking workflow source smoke passed');
