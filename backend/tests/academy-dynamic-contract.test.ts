import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const servicePath = join(root, 'src', 'academy', 'academy.service.ts');
const controllerPath = join(root, 'src', 'academy', 'academy.controller.ts');
const modulePath = join(root, 'src', 'academy', 'academy.module.ts');
const appModulePath = join(root, 'src', 'app.module.ts');

assert.ok(existsSync(servicePath), 'AcademyService must exist');
assert.ok(existsSync(controllerPath), 'AcademyController must exist');
assert.ok(existsSync(modulePath), 'AcademyModule must exist');

const service = readFileSync(servicePath, 'utf8');
const controller = readFileSync(controllerPath, 'utf8');
const moduleSource = readFileSync(modulePath, 'utf8');
const appModule = readFileSync(appModulePath, 'utf8');

for (const table of [
  'academy_categories',
  'academy_articles',
  'academy_tags',
  'academy_article_tags',
  'academy_article_events'
]) {
  assert.ok(service.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `Academy DB bootstrap must create ${table}`);
}

for (const method of ['overview', 'search', 'articleBySlug', 'trackEvent']) {
  assert.ok(service.includes(`async ${method}`), `AcademyService must expose ${method}()`);
}

assert.ok(controller.includes("@Controller('academy')"), 'AcademyController must use /academy prefix');
assert.ok(controller.includes("@Get('overview')"), 'AcademyController must expose GET /academy/overview');
assert.ok(controller.includes("@Get('search')"), 'AcademyController must expose GET /academy/search');
assert.ok(controller.includes("@Get('articles/:slug')"), 'AcademyController must expose GET /academy/articles/:slug');
assert.ok(controller.includes("@Post('events')"), 'AcademyController must expose POST /academy/events');
assert.ok(moduleSource.includes('AcademyService'), 'AcademyModule must provide AcademyService');
assert.ok(appModule.includes('AcademyModule'), 'AppModule must import AcademyModule');

for (const badText of ['Рџ', 'РЎ', 'Рќ', 'вЂ', '�']) {
  assert.ok(!service.includes(badText), `AcademyService must not contain mojibake marker ${badText}`);
  assert.ok(!controller.includes(badText), `AcademyController must not contain mojibake marker ${badText}`);
}

console.log('Academy dynamic backend contract passed');
