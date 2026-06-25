import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pagePath = join(root, 'src', 'pages', 'AcademyPage.tsx');
const apiPath = join(root, 'src', 'services', 'academyApi.ts');

assert.ok(existsSync(pagePath), 'AcademyPage must exist');
assert.ok(existsSync(apiPath), 'academyApi service must exist');

const page = readFileSync(pagePath, 'utf8');
const api = readFileSync(apiPath, 'utf8');

assert.ok(api.includes("api<AcademyOverview>('/academy/overview'"), 'academyApi must load dynamic overview from backend');
assert.ok(api.includes("api<AcademySearchResult>('/academy/search"), 'academyApi must search backend content');
assert.ok(api.includes("api<AcademyArticleDetail>(`/academy/articles/"), 'academyApi must load article details by slug');
assert.ok(api.includes("api<{ ok: boolean }>('/academy/events'"), 'academyApi must track Academy events');

assert.ok(page.includes('academyApi.overview()'), 'AcademyPage must load overview dynamically');
assert.ok(page.includes('academyApi.search('), 'AcademyPage must search dynamically');
assert.ok(page.includes('loading'), 'AcademyPage must expose loading state');
assert.ok(page.includes('error'), 'AcademyPage must expose error state');
assert.ok(page.includes('fallbackOverview'), 'AcademyPage must keep safe fallback content');
assert.ok(page.includes("navigate('/auth'"), 'AI access must route guests to auth');
assert.ok(page.includes('/takhet-ai/doctor'), 'Doctor users must route to doctor AI');
assert.ok(page.includes('/takhet-ai/patient'), 'Patient users must route to patient AI');

for (const removedStatic of ['const categories = [', 'const materials = [', 'const latest = [']) {
  assert.ok(!page.includes(removedStatic), `AcademyPage must not use static top-level ${removedStatic}`);
}

for (const badText of ['Рџ', 'РЎ', 'Рќ', 'вЂ', '�']) {
  assert.ok(!page.includes(badText), `AcademyPage must not contain mojibake marker ${badText}`);
  assert.ok(!api.includes(badText), `academyApi must not contain mojibake marker ${badText}`);
}

console.log('Academy dynamic frontend contract passed');
