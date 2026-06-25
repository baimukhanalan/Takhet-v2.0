import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const app = read('src/App.tsx');
const header = read('src/components/PublicHeader.tsx');
const sidebar = read('src/components/Sidebar.tsx');
const ru = read('src/locales/ru.json');
const kk = read('src/locales/kk.json');
const en = read('src/locales/en.json');

assert(app.includes("const AcademyPage = lazy(() => import('./pages/AcademyPage'))"), 'Academy page must be lazy-loaded in App');
assert(app.includes("const AcademyArticlePage = lazy(() => import('./pages/AcademyArticlePage'))"), 'Academy article page must be lazy-loaded in App');
assert(app.includes('<Route path="/academy" element={<AcademyPage user={user || undefined} />} />'), 'Public /academy route must render AcademyPage');
assert(app.includes('<Route path="/academy/:slug" element={<AcademyArticlePage user={user || undefined} />} />'), 'Public /academy/:slug route must render AcademyArticlePage');
assert(
  app.includes('<Route path="/portal/academy" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT, UserRole.DOCTOR]} redirectTo="/patient-auth"><AcademyPage user={user!} portal /></PrivateRoute>} />'),
  'Portal Academy route must be private for patient and doctor roles'
);
assert(
  app.includes('<Route path="/portal/academy/:slug" element={<PrivateRoute user={user} allowed={[UserRole.PATIENT, UserRole.DOCTOR]} redirectTo="/patient-auth"><AcademyArticlePage user={user!} portal /></PrivateRoute>} />'),
  'Portal Academy article route must be private for patient and doctor roles'
);

const navOrder = [
  't.nav.partners',
  't.nav.academy',
  't.nav.mental'
].map((needle) => header.indexOf(needle));

assert(navOrder.every((index) => index >= 0), 'Public header must include partners, Academy and mental nav labels');
assert(navOrder[0] < navOrder[1] && navOrder[1] < navOrder[2], 'Academy must be placed after Partners and before Mental');
assert(header.includes("{ name: t.nav.academy, path: '/academy' }"), 'Public header Academy link must point to /academy');

assert(sidebar.includes("{ to: '/portal/academy', icon: GraduationCap, label: t.sidebar.academy }"), 'Patient and doctor sidebars must link to private Academy');
assert(sidebar.includes("import { LayoutDashboard, BrainCircuit, Truck, MessageSquare, Settings, CalendarCheck2, Wallet, LogOut, Archive, Users, Stethoscope, BarChart3, Menu, X, Heart, Search, Microscope, GraduationCap }"), 'Sidebar must import GraduationCap for Academy');

for (const [name, content] of [['ru', ru], ['kk', kk], ['en', en]] as const) {
  assert(content.includes('"academy"'), `${name} locale must include Academy label`);
}

const academyPage = read('src/pages/AcademyPage.tsx');
assert(academyPage.includes('handleAiAccess'), 'Academy page must centralize AI access handling');
assert(academyPage.includes("navigate('/auth'"), 'Unauthenticated Academy AI CTA must route to auth');
assert(academyPage.includes("navigate(user.role === UserRole.DOCTOR ? '/takhet-ai/doctor' : '/takhet-ai/patient')"), 'Authenticated Academy AI CTA must route to role AI');
assert(academyPage.includes('PublicHeader activePath="/academy"'), 'Public Academy must use the existing public header');
assert(academyPage.includes('portal = false'), 'Academy page must support portal mode without changing public style');
assert(academyPage.includes("'/portal/academy'"), 'Academy page must support portal article links');

const academyArticlePage = read('src/pages/AcademyArticlePage.tsx');
assert(academyArticlePage.includes('useAcademyArticleSeo'), 'Academy article page must set article SEO metadata');
assert(academyArticlePage.includes('Only a qualified doctor can make a diagnosis.'), 'Academy article page must include medical disclaimer');
assert(academyArticlePage.includes('PublicHeader activePath="/academy"'), 'Public Academy article must use the existing public header');

console.log('Academy integration contract passed');
