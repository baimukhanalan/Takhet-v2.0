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

assert(authService.includes('env.enableDemoPortalLogin && env.isPresentationPortalLoginActive()'), 'Core demo portal login must be feature-flagged and time-limited');
assert(authService.includes('env.demoPortalEmail') && authService.includes('env.demoPortalPassword'), 'Core demo login must read credentials from protected server env');
assert(!authService.includes(`login: '${commonCredential}'`), 'Core auth service must not hardcode a demo login');

for (const key of ['appAdminEmail', 'appDoctorEmail', 'appPartnerEmail', 'appPatientEmail']) {
  assert(envConfig.includes(`${key}: process.env.`) && envConfig.includes('|| activeDemoPortalEmail'), `${key} must use demo credential only through the demo feature flag`);
}

for (const key of ['appAdminPassword', 'appDoctorPassword', 'appPartnerPassword', 'appPatientPassword']) {
  assert(envConfig.includes(`${key}: process.env.`) && envConfig.includes('|| activeDemoPortalPassword'), `${key} must use demo credential only through the demo feature flag`);
}

assert(envConfig.includes("process.env.ENABLE_DEMO_PORTAL_LOGIN === 'true'") && envConfig.includes("process.env.NODE_ENV !== 'production'"), 'Development demo portal login must be disabled in production');
assert(envConfig.includes('ENABLE_PRESENTATION_PORTAL_LOGIN') && envConfig.includes('PRESENTATION_PORTAL_EXPIRES_AT'), 'Production presentation access must be explicit and expiring');
assert(enterpriseService.includes('ENTERPRISE_BOOTSTRAP_PASSWORD') && enterpriseService.includes('env.enableDemoPortalLogin'), 'Enterprise bootstrap password must use explicit env or dev/demo gate');
assert(enterpriseService.includes('env.demoPortalEmail') && enterpriseService.includes('enterpriseDemoIdentifier'), 'Enterprise presentation login must map the configured username by role');
assert(enterpriseService.includes('env.demoPortalPassword'), 'Enterprise presentation accounts must use the configured server-side password');

assert(labsService.includes('env.demoPortalEmail') && labsService.includes('env.demoPortalPassword'), 'Takhet Labs presentation login must use protected server env credentials');
assert(!labsService.includes(`VALUES ($1, $2, $3, $4, 'admin')`), 'Takhet Labs must not seed admin/admin plaintext credentials');

console.log('Portal demo credentials contract passed');
