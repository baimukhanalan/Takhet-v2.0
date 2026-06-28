import { buildHelpfulFallback, getModelCandidatesForTask, isFreshDataLike, isMedicalLike, shouldUseProModel } from '../api/ai/_shared';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const simpleChat = getModelCandidatesForTask('chat', 'как снизить тревогу перед сном');
assert(simpleChat[0] === 'gemini-2.5-flash', 'Simple chat must start with Flash');
assert(simpleChat.includes('gemini-2.5-flash-lite'), 'Simple chat must fallback to Flash-Lite');

const simpleBrowser = getModelCandidatesForTask('browser', 'боль в спине');
assert(simpleBrowser[0] === 'gemini-2.5-flash', 'Simple AI Browser query must start with Flash');
assert(isMedicalLike('боль в спине'), 'Russian medical query must be detected');
assert(isMedicalLike('туберкулез'), 'Tuberculosis query must be detected');
assert(isFreshDataLike('погода Алматы сейчас'), 'Fresh-data query must be detected');
assert(isFreshDataLike('последние мировые новости'), 'News query must be detected');

const analysis = getModelCandidatesForTask('analysis', 'общий анализ крови');
assert(analysis[0] === 'gemini-2.5-pro', 'Analysis task must start with Pro');
assert(analysis.includes('gemini-2.5-flash'), 'Analysis task must fallback to Flash');

const complexChat = getModelCandidatesForTask('chat', 'расшифруй анализы, сравни риски и дай подробный план лечения');
assert(complexChat[0] === 'gemini-2.5-flash', 'Complex text chat must start with Flash for lower first-token latency');
assert(complexChat.includes('gemini-2.5-pro'), 'Complex text chat must retain Pro as a fallback');
assert(shouldUseProModel('фото анализа PDF', 'chat'), 'Photo/file/PDF trigger must use Pro');

const longText = 'обычный текст '.repeat(130);
assert(shouldUseProModel(longText, 'chat'), 'Long input must use Pro');

const fallbackWeather = buildHelpfulFallback('погода Алматы');
assert(!/нужен актуальный прогноз|укажите город и период/i.test(fallbackWeather), 'Weather fallback must not ask for another format instead of helping');
assert(/Алматы|температур|осад|ветер/i.test(fallbackWeather), 'Weather fallback must give concrete weather-check points');

const fallbackNews = buildHelpfulFallback('последние новости');
assert(!/сформулируйте цель|нужен прямой ответ|выберите формат/i.test(fallbackNews), 'News fallback must not return format-selection water');
assert(/новост|источник|дата|важно/i.test(fallbackNews), 'News fallback must explain useful news-check output');

console.log('AI model routing tests passed');
