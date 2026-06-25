import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const adminPath = join(root, 'src', 'pages', 'AdminDashboard.tsx');
const roleApiPath = join(root, 'services', 'roleApi.ts');

assert.ok(existsSync(adminPath), 'AdminDashboard must exist');
assert.ok(existsSync(roleApiPath), 'roleApi must exist');

const admin = readFileSync(adminPath, 'utf8');
const roleApi = readFileSync(roleApiPath, 'utf8');

for (const apiMethod of ['academyImports', 'academyCreateImport', 'academyApproveImport', 'academyRejectImport']) {
  assert.ok(roleApi.includes(apiMethod), `roleApi must expose ${apiMethod}`);
}

assert.ok(roleApi.includes("'/academy/imports'"), 'roleApi must use /academy/imports endpoint');
assert.ok(roleApi.includes("`/academy/imports/${id}/approve`"), 'roleApi must use approve endpoint');
assert.ok(roleApi.includes("`/academy/imports/${id}/reject`"), 'roleApi must use reject endpoint');

assert.ok(admin.includes("id: 'academy'"), 'Admin nav must include Academy import tab');
assert.ok(admin.includes('Academy imports'), 'Admin UI must render Academy imports section');
assert.ok(admin.includes('handleCreateAcademyImport'), 'Admin UI must create Academy import drafts');
assert.ok(admin.includes('handleApproveAcademyImport'), 'Admin UI must approve Academy imports');
assert.ok(admin.includes('handleRejectAcademyImport'), 'Admin UI must reject Academy imports');
assert.ok(admin.includes('sourceFile'), 'Admin UI must expose source_file/source tracking');
assert.ok(admin.includes('automationRunId'), 'Admin UI must expose automation_run_id tracking');
assert.ok(admin.includes('medicalReviewRequired'), 'Admin UI must surface medical review status');

for (const badText of ['Рџ', 'РЎ', 'Рќ', 'вЂ', '�']) {
  assert.ok(!admin.includes(badText), `AdminDashboard must not contain mojibake marker ${badText}`);
}

console.log('Academy import admin contract passed');
