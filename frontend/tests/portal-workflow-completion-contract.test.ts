import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const adminDashboard = read('src/pages/AdminDashboard.tsx');
const labsApp = read('src/pages/TakhetLabsApp.tsx');
const labsApi = read('src/services/takhetLabsApi.ts');
const enterpriseApp = read('src/pages/EnterpriseApp.tsx');

assert(!adminDashboard.includes('window.prompt'), 'Admin portal workflows must not use browser prompt dialogs');
assert(!adminDashboard.includes('window.alert'), 'Admin portal workflows must not use browser alert dialogs');
assert(adminDashboard.includes('AdminFormModal'), 'Admin portal must use an in-app form modal for CRUD workflows');
assert(adminDashboard.includes('adminNotice'), 'Admin portal must show generated credentials/notices inside the UI');

assert(labsApi.includes('createPhysicianReview'), 'Takhet Labs API client must expose physician review creation');
assert(labsApp.includes('handleGenerateReport'), 'Labs member reports must include an explicit generate report action');
assert(labsApp.includes('handleCreatePhysicianReview'), 'Labs physician portal must include an explicit review action');
assert(labsApp.includes('handleManualLabResult'), 'Labs admin portal must include an explicit manual lab result action');

assert(enterpriseApp.includes('type EnterpriseWorkflowAction'), 'Enterprise generic pages must support explicit workflow actions');
assert(enterpriseApp.includes('enterpriseApi.inviteEmployee'), 'Enterprise HR employee page must support employee invite workflow');
assert(enterpriseApp.includes('enterpriseApi.addProviderNote'), 'Enterprise provider/psychologist notes pages must support note workflow');

console.log('Portal workflow completion frontend contract passed');
