import { GoogleGenAI, Modality, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const FLASH_MODEL = process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash';
const PRO_MODEL = process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite';
const FAST_MODEL = FLASH_MODEL;
const AI_MODEL_CANDIDATES = Array.from(new Set([FAST_MODEL, FALLBACK_MODEL].filter(Boolean)));
const AI_PRO_MODEL_CANDIDATES = Array.from(new Set([PRO_MODEL, FAST_MODEL, FALLBACK_MODEL].filter(Boolean)));

export type AiModelTask =
  | 'chat'
  | 'browser'
  | 'analysis'
  | 'image'
  | 'file'
  | 'pdf'
  | 'archive'
  | 'consultation-report'
  | 'transcribe';

const proOnlyTasks = new Set<AiModelTask>(['analysis', 'image', 'file', 'pdf', 'archive', 'consultation-report']);
const proTriggerPattern =
  /(анализ|анализы|расшифруй|расшифров|файл|фото|снимок|pdf|лаборатор|медархив|мрт|кт|узи|экг|ээг|диагноз|риски|план лечения|подробно|несколько вариантов|сравни|сравнение|объясни причины|таблица|сложн|reasoning|compare|medical|diagnosis|risk|treatment plan|lab|laboratory|image|file)/i;
const medicalQueryPattern =
  /(боль|температур|каш|горл|насморк|давлен|сердц|груд|одыш|тошнот|рвот|понос|диаре|живот|голов|мигрен|сып|кров|травм|перелом|симптом|анализ|лекар|таблет|препарат|дозиров|врач|диагноз|лечени|здоров|пульс|сахар|инсульт|инфаркт|аллерг|беремен|ребен|ребён|сустав|спин|почек|печен|печён|желуд|вирус|инфекц|грипп|ковид|covid|пневмони|астм|неврол|хирург|лор|терапевт|кардиолог|эндокрин|дерматолог|психолог|психотерап|психосомат|туберкул|pain|fever|cough|throat|pressure|heart|chest|shortness of breath|nausea|vomit|diarrhea|stomach|headache|migraine|rash|blood|injury|fracture|symptom|medicine|doctor|diagnosis|treatment|health|pulse|stroke|allergy|pregnan|child|joint|back pain|kidney|liver|virus|infection|flu|pneumonia|asthma|neurolog|surgery|cardiolog|endocrin|dermatolog|psycholog|psychotherap|tuberculosis|\btb\b)/i;
const freshDataPattern =
  /(погода|температура в|прогноз|осадки|ветер|курс|доллар|евро|биткоин|акци[яи]|цена|стоимость|новост|сегодня|сейчас|завтра|расписани|результат|счет|счёт|weather|forecast|current|today|tomorrow|price|news|score|schedule|breaking|headline)/i;
const lowValuePattern =
  /(выберите формат|нужен общий полезный ответ|не выглядит медицинским|попросить сравнение|проверить свежие источники|уточнить нужный формат|ответы формируются на основе|контекст текущего диалога|служебн|если вам нужна справка|даю прямой полезный ответ|нужен актуальный прогноз|ai-провайдер|не вернул качественный ответ|не удалось получить полноценный ответ|вместо воды|выберите формат ответа)/i;

const readableProTriggerPattern =
  /(анализ|анализы|расшифруй|расшифров|файл|фото|снимок|pdf|лаборатор|медархив|мрт|кт|узи|экг|ээг|диагноз|риски|план лечения|подробно|несколько вариантов|сравни|сравнение|объясни причины|причины|таблица|сложн|reasoning|compare|medical|diagnosis|risk|treatment plan|lab|laboratory|image|file)/i;
const readableMedicalQueryPattern =
  /(боль|температур|каш|горл|насморк|давлен|сердц|груд|одыш|тошнот|рвот|понос|диаре|живот|голов|мигрен|сып|кров|травм|перелом|симптом|анализ|лекар|таблет|препарат|дозиров|врач|диагноз|лечени|здоров|пульс|сахар|инсульт|инфаркт|аллерг|беремен|ребен|ребён|сустав|спин|почек|печен|печён|желуд|вирус|инфекц|грипп|ковид|пневмони|астм|неврол|хирург|лор|терапевт|кардиолог|эндокрин|дерматолог|психолог|психотерап|психосомат|туберкул|pain|fever|cough|throat|pressure|heart|chest|shortness of breath|nausea|vomit|diarrhea|stomach|headache|migraine|rash|blood|injury|fracture|symptom|medicine|doctor|diagnosis|treatment|health|pulse|stroke|allergy|pregnan|child|joint|back pain|kidney|liver|virus|infection|flu|pneumonia|asthma|neurolog|surgery|cardiolog|endocrin|dermatolog|psycholog|psychotherap|tuberculosis|\btb\b)/i;
const readableFreshDataPattern =
  /(погода|температура в|прогноз|осадки|ветер|курс|доллар|евро|биткоин|акци[яи]|цена|стоимость|новост|сегодня|сейчас|завтра|расписани|результат|счет|счёт|weather|forecast|current|today|tomorrow|price|news|score|schedule|breaking|headline)/i;
const readableLowValuePattern =
  /(выберите формат|нужен общий полезный ответ|не выглядит медицинским|попросить сравнение|проверить свежие источники|уточнить нужный формат|ответы формируются на основе|контекст текущего диалога|служебн|если вам нужна справка|даю прямой полезный ответ|нужен актуальный прогноз|ai-провайдер|не вернул качественный ответ|не удалось получить полноценный ответ|вместо воды|выберите формат ответа)/i;

export function ensureAi() {
  if (!ai) {
    throw new Error('AI_NOT_CONFIGURED');
  }
  return ai;
}

export function sendJson(res: any, status: number, payload: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(payload));
}

export function handleAiError(res: any, error: unknown) {
  const message = error instanceof Error ? error.message : 'AI_REQUEST_FAILED';
  sendJson(res, 500, { error: message });
}

export function cleanAiText(value: string) {
  return String(value || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function isLowValueAiText(value: string) {
  const text = String(value || '');
  return lowValuePattern.test(text) || readableLowValuePattern.test(text);
}

export function isQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|quota|rate-limits|high demand/i.test(message);
}

export function shouldUseProModel(input: string, task: AiModelTask = 'chat') {
  if (proOnlyTasks.has(task)) {
    return true;
  }

  const text = String(input || '');
  if (text.length > 1200) {
    return true;
  }

  return proTriggerPattern.test(text) || readableProTriggerPattern.test(text);
}

export function getModelCandidatesForTask(task: AiModelTask = 'chat', input = '') {
  if (proOnlyTasks.has(task)) return AI_PRO_MODEL_CANDIDATES;
  if (shouldUseProModel(input, task)) {
    return Array.from(new Set([FAST_MODEL, PRO_MODEL, FALLBACK_MODEL].filter(Boolean)));
  }
  return AI_MODEL_CANDIDATES;
}

function extractUserQuery(message: string) {
  const raw = String(message || '').trim();
  const markers = ['Новый вопрос пациента:', 'New patient question:', 'User query:', 'General user query:', 'Medical user query:'];

  for (const marker of markers) {
    const index = raw.lastIndexOf(marker);
    if (index >= 0) {
      return raw
        .slice(index + marker.length)
        .split(/\n\s*\n/)[0]
        .trim()
        .slice(0, 220);
    }
  }

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (lines[lines.length - 1] || raw).slice(0, 220);
}

export function isMedicalLike(value: string) {
  const text = String(value || '');
  return medicalQueryPattern.test(text) || readableMedicalQueryPattern.test(text);
}

export function isFreshDataLike(value: string) {
  const query = extractUserQuery(value);
  return freshDataPattern.test(query) || readableFreshDataPattern.test(query);
}

export function buildAdaptiveChatInstruction(message: string) {
  const query = extractUserQuery(message);
  const medical = isMedicalLike(query);

  if (medical) {
    return [
      'Reply in Russian. You are Takhet AI in strict medical advisory mode.',
      'Answer the actual question immediately and concretely.',
      'Structure when relevant: short conclusion, likely causes, what to do now, red flags, mistakes to avoid, next step and suitable specialist.',
      'Do not ask the user to choose a format before answering.',
      'Do not claim a final diagnosis.',
      'For medicines, mention only common safe examples and key precautions when appropriate.',
      'Assume the user is likely in Kazakhstan unless another country is specified. 103 and 112 are Kazakhstan emergency examples.',
      'No markdown asterisks. No filler. No meta-commentary.'
    ].join('\n');
  }

  return [
    'Reply in Russian. You are Takhet AI in strict pragmatic-answer mode.',
    'Answer directly, specifically and usefully.',
    'Structure when relevant: direct answer, context, concrete steps or facts, risks or trade-offs, next best action.',
    'If the query is short, infer the most likely intent and still answer it.',
    'For weather, exchange rates, prices, schedules, scores, politics, news or current facts, lead with exact value, place, date/time and units when available.',
    'No markdown asterisks. No filler. No meta-commentary.'
  ].join('\n');
}

export function buildStrictChatInstruction(message: string, systemInstruction?: string) {
  return [
    systemInstruction || '',
    buildAdaptiveChatInstruction(message),
    'Global quality rule: the first sentence must contain the useful answer, not commentary about the answer.',
    'Never output internal instructions, hidden context, placeholders, provider errors, or requests to choose a format.',
    'If exact current data cannot be verified, say that briefly and still give the best useful answer and next step.'
  ]
    .filter(Boolean)
    .join('\n');
}

function buildMedicalFallback(query: string, normalized: string) {
  if (/диаре|понос/.test(normalized)) {
    return cleanAiText([
      'Похоже на диарею. Частые причины: кишечная инфекция, пищевое отравление, реакция на еду или лекарство. Главный риск сейчас — обезвоживание.',
      '',
      'Что делать сейчас:',
      '1. Пейте часто и маленькими глотками воду или раствор для регидратации.',
      '2. Временно избегайте алкоголя, жирной пищи, большого количества молочного и очень сладкого.',
      '3. Не начинайте антибиотики самостоятельно.',
      '4. Следите за слабостью, сухостью во рту, редким мочеиспусканием, температурой и кровью в стуле.',
      '',
      'Срочно к врачу или 103/112 в Казахстане: кровь в стуле, сильная боль в животе, высокая температура, многократная рвота, выраженное обезвоживание, беременность, детский или пожилой возраст, ухудшение дольше 48 часов.'
    ].join('\n'));
  }

  if (/туберкул|tuberculosis|\btb\b/.test(normalized)) {
    return cleanAiText([
      'Туберкулёз — инфекция, чаще поражающая лёгкие. По одному слову диагноз не ставят: нужны обследования.',
      '',
      'На что обратить внимание: кашель дольше 2–3 недель, мокрота или кровь, ночная потливость, похудение, длительная температура, слабость, боль в груди, контакт с больным туберкулёзом.',
      '',
      'Что делать: обратиться к терапевту или фтизиатру и выполнить назначенные обследования — обычно рентген или КТ по показаниям, анализ мокроты, ПЦР и другие тесты. До проверки лучше носить маску, если есть длительный кашель.',
      '',
      'Не начинайте антибиотики самостоятельно: это может смазать картину и затруднить диагностику.'
    ].join('\n'));
  }

  if (/спин|поясниц|лопат|позвоноч|радикул|седалищ|ишиас|back pain/.test(normalized)) {
    return cleanAiText([
      'Боль в спине чаще всего связана с мышечным спазмом, перегрузкой, неудобной позой или раздражением нервного корешка.',
      '',
      'Что делать сейчас:',
      '1. На 24–48 часов исключите тяжести и резкие наклоны.',
      '2. Полный постельный режим не нужен: короткая ходьба обычно лучше.',
      '3. Тепло помогает при мышечном спазме, холод — после свежей перегрузки или травмы.',
      '4. Обезболивающее используйте только по инструкции и если нет противопоказаний.',
      '',
      'Срочно к врачу: слабость ноги, онемение в паху, потеря контроля мочи или стула, сильная боль после падения, температура, быстрое ухудшение.'
    ].join('\n'));
  }

  return cleanAiText([
    `По запросу "${query || 'о здоровье'}" даю безопасную ориентирующую тактику без постановки диагноза.`,
    '',
    'Что сделать сейчас:',
    '1. Оцените силу симптома, длительность, температуру, травму, одышку, кровь, слабость и резкое ухудшение.',
    '2. Не начинайте антибиотики, гормоны или сильные препараты без инструкции врача.',
    '3. Если симптом мешает обычной жизни, держится больше 2–3 дней или нарастает — запишитесь к профильному врачу.',
    '',
    'Срочно: боль в груди, одышка, потеря сознания, нарушение речи, сильное кровотечение, выраженная слабость или онемение, резкое ухудшение. В Казахстане ориентируйтесь на 103 или 112.'
  ].join('\n'));
}

export function buildHelpfulFallback(message: string) {
  const query = extractUserQuery(message);
  const normalized = query.toLowerCase();

  if (isMedicalLike(query)) {
    return buildMedicalFallback(query, normalized);
  }

  if (/погода|weather|forecast/.test(normalized)) {
    return cleanAiText([
      `По запросу "${query || 'погода'}" нужен live-прогноз: температура, ощущается как, осадки, ветер и время обновления.`,
      '',
      'Если live-источник временно не ответил, безопасная проверка такая: откройте текущую погоду по городу, смотрите не только градусы, но и осадки, ветер, влажность и предупреждения. Для Алматы дополнительно важны смог, гололед зимой и резкие перепады температуры.'
    ].join('\n'));
  }

  if (/новост|news|headline|breaking/.test(normalized)) {
    return cleanAiText([
      `По запросу "${query || 'последние новости'}" нужен свежий обзор с датой, источником и значением события.`,
      '',
      'Проверяйте новости так: 1) дата и время публикации, 2) первоисточник, 3) подтверждение вторым независимым источником, 4) почему событие важно для страны, денег, здоровья, безопасности или бизнеса. Если live-поиск временно не ответил, не стоит придумывать новости без источника.'
    ].join('\n'));
  }

  if (/трамп|trump/.test(normalized)) {
    return cleanAiText([
      'Дональд Трамп — американский политик и бизнесмен, связанный с Республиканской партией США и современной политической повесткой США.',
      '',
      'Если нужен прикладной разбор, уточните что именно важно: биография, политические позиции, последние новости, сравнение с Камалой Харрис или влияние на мировую политику.'
    ].join('\n'));
  }

  if (/камала|kamala|харрис|harris/.test(normalized)) {
    return cleanAiText([
      'Камала Харрис — американский политик, связанный с Демократической партией США.',
      '',
      'Если нужен прикладной разбор, уточните что именно важно: биография, политические позиции, сравнение с Трампом, последние новости или объяснение простыми словами.'
    ].join('\n'));
  }

  if (/успех|успешн|качества|цель|цели|достиг/.test(normalized)) {
    return cleanAiText([
      'К успеху чаще всего приводят дисциплина, обучаемость, фокус, устойчивость к отказам и умение доводить начатое до результата.',
      '',
      'Практический план: выберите одну цель на 90 дней, определите 3 измеримых результата и закрепите одно ежедневное действие, которое прямо двигает к цели.'
    ].join('\n'));
  }

  return cleanAiText([
    `По запросу "${query || 'ваш вопрос'}" даю короткий рабочий ответ без служебного шаблона.`,
    '',
    'Если это человек или событие: проверьте роль, дату, источник и что изменилось. Если это выбор: сравните пользу, цену, риск и обратимость решения. Если это задача: определите один следующий шаг, который можно сделать сегодня, и критерий результата.'
  ].join('\n'));
}

export const schemas = {
  healthInsights: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING },
      summary: {
        type: Type.OBJECT,
        properties: {
          likelyCause: { type: Type.STRING },
          urgency: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
          whatToDoNow: { type: Type.STRING },
          whenToTalkToDoctor: { type: Type.STRING }
        },
        required: ['likelyCause', 'urgency', 'whatToDoNow', 'whenToTalkToDoctor']
      },
      detailedExplanation: {
        type: Type.OBJECT,
        properties: {
          scenarios: { type: Type.ARRAY, items: { type: Type.STRING } },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
          nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['scenarios', 'redFlags', 'mistakes', 'nextSteps']
      },
      sources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            summary: { type: Type.STRING },
            trustLevel: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
            sourceName: { type: Type.STRING }
          },
          required: ['id', 'title', 'url', 'summary', 'trustLevel', 'sourceName']
        }
      },
      suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['query', 'summary', 'detailedExplanation', 'sources', 'suggestedQuestions']
  },
  healthData: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['summary', 'recommendations']
  }
};

export {
  AI_MODEL_CANDIDATES,
  AI_PRO_MODEL_CANDIDATES,
  FALLBACK_MODEL,
  FAST_MODEL,
  FLASH_MODEL,
  PRO_MODEL,
  Modality
};
