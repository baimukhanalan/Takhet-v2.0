import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const browserPage = read('src/pages/AIHealthBrowser.tsx');
const geminiClient = read('src/services/gemini.ts');
const healthInsightsApi = read('api/ai/health-insights.ts');

assert(
  geminiClient.includes('export async function getHealthInsightsFast'),
  'AI Browser client must expose a fast streaming health-insights function'
);

assert(
  geminiClient.includes('buildTakhetNavigationInsight') &&
    geminiClient.includes('isTakhetNavigationQuery') &&
    geminiClient.includes('guest-consultation'),
  'AI Browser must answer Takhet navigation and booking questions locally instead of waiting for a slow general AI call'
);

assert(
  healthInsightsApi.includes('buildTakhetNavigationInsight') &&
    healthInsightsApi.includes('isTakhetNavigationQuery') &&
    healthInsightsApi.includes('return buildTakhetNavigationInsight(query);'),
  'AI Browser Vercel endpoint must answer Takhet booking/navigation questions locally instead of using generic medical fallback'
);

assert(
  browserPage.includes('getHealthInsightsFast') &&
    browserPage.includes('streamingPreview') &&
    browserPage.includes('onDelta'),
  'AI Browser page must show streamed first words while the final answer is being generated'
);

assert(
  healthInsightsApi.includes('HEALTH_BROWSER_AI_DEADLINE_MS') &&
    healthInsightsApi.includes('withAiDeadline') &&
    healthInsightsApi.includes('Promise.race'),
  'AI Browser server endpoint must have a bounded AI deadline to avoid long hanging requests'
);

assert(
  healthInsightsApi.includes('HEALTH_BROWSER_CACHE_MAX_ITEMS') &&
    healthInsightsApi.includes('trimHealthBrowserCache'),
  'AI Browser cache must be bounded so speed improvements do not grow memory forever'
);

console.log('AI Browser speed contract passed');
