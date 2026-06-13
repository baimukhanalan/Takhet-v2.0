import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const commonCredential = 'baimukhanalan1@gmail.com';

const authService = read('src/auth/auth.service.ts');
const envConfig = read('src/config/env.config.ts');
const enterpriseService = read('src/enterprise/enterprise.service.ts');
const labsService = read('src/labs/labs.service.ts');

assert(authService.includes(`login: '${commonCredential}'`), 'Core portal temp login must use requested email');
assert(authService.includes(`password: '${commonCredential}'`), 'Core portal temp password must use requested value');
assert(authService.includes('env.enableDemoPortalLogin && this.isTempPortalLogin'), 'Core demo portal login must be feature-flagged');

for (const key of ['appAdminEmail', 'appDoctorEmail', 'appPartnerEmail', 'appPatientEmail']) {
  assert(envConfig.includes(`${key}: process.env.`) && envConfig.includes('|| demoPortalCredential'), `${key} must use demo credential only through the demo feature flag`);
}

for (const key of ['appAdminPassword', 'appDoctorPassword', 'appPartnerPassword', 'appPatientPassword']) {
  assert(envConfig.includes(`${key}: process.env.`) && envConfig.includes('|| demoPortalCredential'), `${key} must use demo credential only through the demo feature flag`);
}

assert(envConfig.includes("process.env.ENABLE_DEMO_PORTAL_LOGIN === 'true'") && envConfig.includes("process.env.NODE_ENV !== 'production'"), 'Demo portal login must be disabled in production');
assert(enterpriseService.includes('ENTERPRISE_BOOTSTRAP_PASSWORD') && enterpriseService.includes('env.enableDemoPortalLogin'), 'Enterprise bootstrap password must use explicit env or dev/demo gate');
assert(enterpriseService.includes(`'${commonCredential}'`) && enterpriseService.includes('env.enableDemoPortalLogin'), 'Enterprise demo resolver must accept requested email only when demo login is enabled');

assert(labsService.includes(`'${commonCredential}'`) && labsService.includes('env.enableDemoPortalLogin'), 'Takhet Labs seed demo password must be gated by demo login');
assert(!labsService.includes(`VALUES ($1, $2, $3, $4, 'admin')`), 'Takhet Labs must not seed admin/admin plaintext credentials');

console.log('Portal demo credentials contract passed');
