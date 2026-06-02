import { strict as assert } from 'assert';
import { readFileSync } from 'fs';
import { join } from 'path';

const source = readFileSync(join(process.cwd(), 'src', 'profiles', 'profiles.service.ts'), 'utf8');

assert.match(source, /'Разбор документов'/, 'PDF section parser must recognize doctor-report document section');
assert.match(source, /'Рекомендации по консультации'/, 'PDF section parser must recognize final consultation recommendations');
assert.match(source, /'Когда срочно обращаться за помощью'/, 'PDF section parser must recognize AI urgent-care section');

console.log('consultation PDF section smoke passed');
