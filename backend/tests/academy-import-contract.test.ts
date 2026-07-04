import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const servicePath = join(root, 'src', 'academy', 'academy.service.ts');
const controllerPath = join(root, 'src', 'academy', 'academy.controller.ts');

assert.ok(existsSync(servicePath), 'AcademyService must exist');
assert.ok(existsSync(controllerPath), 'AcademyController must exist');

const service = readFileSync(servicePath, 'utf8');
const controller = readFileSync(controllerPath, 'utf8');

for (const table of [
  'academy_article_imports',
  'academy_article_sources',
  'academy_article_review_tasks',
  'academy_article_seo',
  'academy_article_versions'
]) {
  assert.ok(service.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `Academy import bootstrap must create ${table}`);
}

for (const method of ['createImport', 'listImports', 'approveImport', 'rejectImport']) {
  assert.ok(service.includes(`async ${method}`), `AcademyService must expose ${method}()`);
}

assert.ok(controller.includes('UseGuards(AuthGuard, RolesGuard)'), 'Academy import endpoints must require auth and role checks');
assert.ok(controller.includes("@Roles('admin')"), 'Academy import endpoints must be admin-only');
assert.ok(controller.includes("@Post('imports')"), 'AcademyController must expose POST /academy/imports');
assert.ok(controller.includes("@Get('imports')"), 'AcademyController must expose GET /academy/imports');
assert.ok(controller.includes("@Patch('imports/:id/approve')"), 'AcademyController must expose PATCH /academy/imports/:id/approve');
assert.ok(controller.includes("@Patch('imports/:id/reject')"), 'AcademyController must expose PATCH /academy/imports/:id/reject');

for (const requiredRule of [
  'duplicate_slug',
  'medical_disclaimer_required',
  'system_prompt_leak',
  'source_file',
  'automation_run_id',
  'medical_review_required'
]) {
  assert.ok(service.includes(requiredRule), `Academy import pipeline must enforce ${requiredRule}`);
}

for (const longFormRule of [
  'article_length_out_of_range',
  'article_character_count_mismatch',
  'authoritative_sources_required',
  'medical_qa_not_approved',
  'medical_qa_artifact_required'
]) {
  assert.ok(service.includes(longFormRule), `Academy import pipeline must enforce ${longFormRule}`);
}

assert.ok(controller.includes('@Min(7000)'), 'Academy imports must reject articles shorter than 7000 characters');
assert.ok(controller.includes('@Max(10000)'), 'Academy imports must reject articles longer than 10000 characters');
assert.ok(controller.includes('characterCount'), 'Academy imports must require characterCount');
assert.ok(controller.includes('medicalQaStatus'), 'Academy imports must require Medical QA status');
assert.ok(controller.includes('medicalQaArtifact'), 'Academy imports must require a Medical QA artifact');
assert.ok(controller.includes('sourceUrls'), 'Academy imports must require authoritative source URLs');

assert.ok(service.includes("status = 'published'"), 'Public Academy queries must continue to expose only published articles');
assert.ok(service.includes('academy_article_versions'), 'Approved imports must preserve article versions');
assert.ok(service.includes('academy_article_seo'), 'Approved imports must persist SEO metadata');

console.log('Academy import contract passed');
