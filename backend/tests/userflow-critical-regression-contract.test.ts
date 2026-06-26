import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const usersService = read('src/users/users.service.ts');
const adminPortalService = read('src/admin/admin-portal.service.ts');
const aiService = read('src/ai/ai.service.ts');

assert(usersService.includes('toPublicUser'), 'UsersService must sanitize users before returning them to admin-facing APIs');
assert(!/return\s+this\.usersRepo\.find\(\{[\s\S]*?\}\);/.test(usersService), 'UsersService.findAll must not return raw User entities with passwordHash');
assert(!/passwordHash\s*[:=]\s*user\.passwordHash/.test(usersService), 'Sanitized users must not include passwordHash');

assert(
  adminPortalService.includes("case when jsonb_typeof(value) = 'array' then value else '[]'::jsonb end"),
  'Admin portal review query must safely handle non-array settings.value before jsonb_array_elements'
);

assert(aiService.includes('buildHealthInsightsFallback'), 'Backend AI Browser must have a local fallback response shape');
assert(aiService.includes('catch (error)') && aiService.includes('return this.buildHealthInsightsFallback(query);'), 'Backend AI Browser must return fallback instead of 500 on AI provider failure');
assert(aiService.includes('isTakhetNavigationQuery'), 'Backend AI Browser must detect Takhet booking/navigation questions locally');
assert(aiService.includes('buildTakhetNavigationInsight'), 'Backend AI Browser must answer Takhet booking/navigation questions with a product-specific local response');
assert(aiService.includes('return this.buildTakhetNavigationInsight(query);'), 'Backend AI Browser must not send Takhet booking/navigation questions to a generic model first');
assert(aiService.includes('/guest-consultation'), 'Backend Takhet navigation answer must point users to guest consultation');
assert(!aiService.includes('Takhet является ИИ-браузером и не предоставляет прямую запись к врачу'), 'Backend AI Browser must not deny Takhet doctor booking capability');

console.log('Userflow critical regression contract passed');
