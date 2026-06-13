import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const envConfig = read('src/config/env.config.ts');
const communityService = read('src/community/community.service.ts');

assert(envConfig.includes("feedbackEmailRecipient: process.env.FEEDBACK_EMAIL_RECIPIENT || 'takhetplus@gmail.com'"), 'Default feedback recipient must be takhetplus@gmail.com');
assert(communityService.includes('await this.notifyPublicFeedback(nextItem)'), 'Public feedback submission must trigger email notification');
assert(communityService.includes('env.feedbackEmailRecipient'), 'Feedback email must use configured recipient');
assert(communityService.includes('env.resendApiKey'), 'Feedback email must use Resend when configured');
assert(communityService.includes('feedbackEmailWebhookUrl'), 'Feedback email must support webhook fallback');
assert(communityService.includes('public.feedback.email.pending'), 'Feedback email must audit pending provider configuration instead of silently doing nothing');

console.log('Public feedback email contract passed');
