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

console.log('Userflow critical regression contract passed');
