import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const academyArticle = read('src/pages/AcademyArticlePage.tsx');
const legalPage = read('src/pages/LegalPage.tsx');
const consultationRoom = read('src/pages/ConsultationRoom.tsx');

assert(
  academyArticle.includes('onClick={() => navigate(-1)}') &&
    !academyArticle.includes('const backToAcademy') &&
    !academyArticle.includes('<Link to={backToAcademy}'),
  'Academy article back control must return to the exact previous page, not a fixed Academy route'
);

assert(
  legalPage.includes('onClick={() => navigate(-1)}') &&
    !legalPage.includes('<Link to="/"'),
  'Legal page back control must return to the exact previous page, not the landing page'
);

assert(
  consultationRoom.includes('onClick={() => navigate(-1)}') &&
    !consultationRoom.includes("onClick={() => navigate('/appointments')}"),
  'Consultation room back control must return to the exact previous page, not always appointments'
);

console.log('Back button history contract passed');
