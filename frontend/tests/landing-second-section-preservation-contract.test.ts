import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/pages/LandingPage.tsx'), 'utf8');
const sectionStart = source.indexOf('<section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-slate-50');
const closingTag = '</section>';
const sectionEnd = source.indexOf(closingTag, sectionStart) + closingTag.length;

if (sectionStart < 0 || sectionEnd < 0) {
  throw new Error('The protected second landing section could not be located');
}

const protectedSection = source.slice(sectionStart, sectionEnd);
const fingerprint = createHash('sha256').update(protectedSection).digest('hex');

if (fingerprint !== '744a15b76fb3333dc21fc1146b5d9d34551a84a466e7b5e44ff308acff7f5caf') {
  throw new Error('The second landing section must remain unchanged during the header and hero redesign');
}

console.log('Landing second section preservation contract passed');
