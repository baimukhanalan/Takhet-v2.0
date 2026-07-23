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

if (fingerprint !== '5a3a2065c00d8e67c11772e8da9be182c054cae6fba7558a121d3fe0fa5f34a6') {
  throw new Error('The second landing section must remain unchanged during the header and hero redesign');
}

console.log('Landing second section preservation contract passed');
