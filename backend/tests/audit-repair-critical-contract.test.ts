import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const envConfig = read('src/config/env.config.ts');
const paymentsService = read('src/payments/payments.service.ts');
const authService = read('src/auth/auth.service.ts');
const main = read('src/main.ts');
const aiModule = read('src/ai/ai.module.ts');
const aiController = read('src/ai/ai.controller.ts');
const aiService = read('src/ai/ai.service.ts');
const enterpriseService = read('src/enterprise/enterprise.service.ts');
const labsService = read('src/labs/labs.service.ts');

assert(envConfig.includes('enableDemoPortalLogin'), 'env config must expose ENABLE_DEMO_PORTAL_LOGIN');
assert(
  envConfig.includes("process.env.ENABLE_DEMO_PORTAL_LOGIN === 'true'") && envConfig.includes("process.env.NODE_ENV !== 'production'"),
  'demo portal login must be disabled by default and impossible in production'
);

assert(!paymentsService.includes("status = 'paid'") || paymentsService.includes('verifyKaspiWebhook'), 'payments must not mark direct Kaspi fallback as paid');
assert(!paymentsService.includes('kaspi_stub'), 'payments must not use kaspi_stub auto-paid fallback');
assert(paymentsService.includes("payment.status = 'failed'"), 'failed Kaspi payment attempts must be persisted as failed');
assert(paymentsService.includes('ServiceUnavailableException'), 'unavailable payment provider must return a clear non-paid error');

assert(authService.includes('env.enableDemoPortalLogin && this.isTempPortalLogin'), 'demo portal login must be behind feature flag');
assert(authService.includes('Подтверждение почты Takhet+'), 'email verification subject must be readable UTF-8');
assert(authService.includes('Восстановление доступа Takhet+'), 'password reset subject must be readable UTF-8');
assert(!authService.includes('Рџ') && !authService.includes('вЂ') && !authService.includes('�'), 'auth emails must not contain mojibake');

const requiredApiPrefixes = ['/auth', '/payments', '/files', '/cases', '/notifications', '/profiles', '/community', '/enterprise', '/labs', '/guest', '/triage', '/ai'];
assert(main.includes('apiPrefixes'), 'SPA fallback must use an explicit API prefix allowlist');
assert(main.includes('req.path === prefix') && main.includes('req.path.startsWith(`${prefix}/`)'), 'SPA fallback must exclude exact API prefixes and nested API paths');
for (const prefix of requiredApiPrefixes) {
  assert(main.includes(`'${prefix}'`), `SPA fallback must exclude ${prefix}`);
}

assert(aiController.includes('@UseGuards(AuthGuard)'), 'private backend AI endpoints must use AuthGuard');
assert(aiModule.includes("import { AuthModule } from '../auth/auth.module'") && aiModule.includes('imports: [AuthModule]'), 'AiModule must import AuthModule so AuthGuard can resolve AuthService in production');
for (const route of ["@Post('chat')", "@Post('chat-stream')", "@Post('speech')", "@Post('analyze')"]) {
  assert(aiController.includes(route), `AI controller must keep ${route}`);
}
assert(aiController.includes("@Post('public-health-insights')"), 'public AI Browser endpoint must remain explicitly public');
assert(aiService.includes('maxOutputTokensForTask'), 'AI service must centralize max output token limits');
assert(aiService.includes('maxOutputTokens: this.maxOutputTokensForTask'), 'AI service requests must set output token limits');
assert(!aiService.includes('Рџ') && !aiService.includes('вЂ') && !aiService.includes('�'), 'AI service must not contain mojibake');

assert(!enterpriseService.includes("this.hashPassword('temporary-admin')"), 'Enterprise invites must not use temporary-admin plaintext password');
assert(enterpriseService.includes('ENTERPRISE_BOOTSTRAP_PASSWORD'), 'Enterprise seed credentials must use an explicit bootstrap secret or random password');
assert(enterpriseService.includes('env.enableDemoPortalLogin'), 'Enterprise demo identifier remap must be behind demo flag');

assert(labsService.includes('scryptSync') && labsService.includes('timingSafeEqual'), 'Labs passwords must use hashed verification');
assert(labsService.includes('env.enableDemoPortalLogin'), 'Labs legacy plaintext compatibility must be dev/demo gated');
assert(!labsService.includes('passwordHash !== normalizedPassword'), 'Labs login must not compare plaintext passwords directly');

console.log('Backend audit repair critical contract passed');
