import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const readProjectFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const roleApi = readProjectFile('services/roleApi.ts');
const medicalArchive = readProjectFile('src/pages/MedicalArchive.tsx');

assert(
  !/import\s+\{\s*uploadMedicalFileResumable\s*\}\s+from\s+['"]\.\.\/src\/services\/resumableUpload['"]/.test(roleApi),
  'roleApi must not statically import resumable upload because it is loaded by the app shell'
);
assert(
  roleApi.includes("await import('../src/services/resumableUpload')"),
  'roleApi must lazy-load resumable upload only for heavy medical files'
);

assert(
  !/import\s+\{\s*uploadMedicalFileResumable\s*\}\s+from\s+['"]\.\.\/services\/resumableUpload['"]/.test(medicalArchive),
  'MedicalArchive must not statically import resumable upload before the user starts an upload'
);
assert(
  medicalArchive.includes("await import('../services/resumableUpload')"),
  'MedicalArchive must lazy-load resumable upload inside the upload handler'
);

console.log('Upload vendor lazy-loading tests passed');
