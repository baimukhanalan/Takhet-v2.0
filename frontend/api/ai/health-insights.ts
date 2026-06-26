import {
  buildHelpfulFallback,
  cleanAiText,
  ensureAi,
  getModelCandidatesForTask,
  isFreshDataLike,
  isLowValueAiText,
  isMedicalLike,
  isQuotaError,
  schemas,
  sendJson
} from './_shared.js';

const HEALTH_BROWSER_CACHE_TTL_MS = 3 * 60 * 1000;
const HEALTH_BROWSER_CACHE_MAX_ITEMS = 80;
const HEALTH_BROWSER_AI_DEADLINE_MS = 6500;
const HEALTH_BROWSER_SINGLE_PASS = true;
const healthBrowserCache = new Map<string, { expiresAt: number; value: any }>();
const inFlightHealthBrowserRequests = new Map<string, Promise<any>>();

const generalSources = [
  {
    id: 'source-check-current',
    title: 'Проверка актуальных источников',
    url: 'https://news.google.com/',
    summary: 'Для тем, где факты быстро меняются, сверяйте свежие публикации и первоисточники.',
    trustLevel: 'Medium' as const,
    sourceName: 'Current sources'
  },
  {
    id: 'source-reference',
    title: 'Справочная проверка темы',
    url: 'https://www.britannica.com/',
    summary: 'Подходит для базового контекста по людям, событиям, странам, понятиям и истории.',
    trustLevel: 'Medium' as const,
    sourceName: 'Reference'
  }
];

const medicalSources = [
  {
    id: 'who-primary-care',
    title: 'WHO: health advice and care seeking',
    url: 'https://www.who.int/',
    summary: 'Базовые ориентиры по безопасному обращению за медицинской помощью.',
    trustLevel: 'High' as const,
    sourceName: 'WHO'
  },
  {
    id: 'medlineplus-symptoms',
    title: 'MedlinePlus: Symptoms',
    url: 'https://medlineplus.gov/symptoms.html',
    summary: 'Справочник симптомов и частых причин для первичной ориентации.',
    trustLevel: 'High' as const,
    sourceName: 'MedlinePlus'
  },
  {
    id: 'mayo-symptom-checker',
    title: 'Mayo Clinic: Symptoms',
    url: 'https://www.mayoclinic.org/symptom-checker',
    summary: 'Справочные материалы по симптомам и признакам, требующим внимания.',
    trustLevel: 'High' as const,
    sourceName: 'Mayo Clinic'
  }
];

const stripTags = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

const isNewsQuery = (value: string) => /(новост|событи|последн|свеж|headlines|news)/i.test(String(value || ''));

const normalizeQueryKey = (query: string) => String(query || '').trim().toLowerCase();

const getCachedInsight = (query: string) => {
  const key = normalizeQueryKey(query);
  const cached = healthBrowserCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    healthBrowserCache.delete(key);
    return null;
  }
  return cached.value;
};

const setCachedInsight = (query: string, value: any) => {
  healthBrowserCache.set(normalizeQueryKey(query), {
    expiresAt: Date.now() + HEALTH_BROWSER_CACHE_TTL_MS,
    value
  });
  trimHealthBrowserCache();
};

const trimHealthBrowserCache = () => {
  const now = Date.now();
  for (const [key, cached] of healthBrowserCache.entries()) {
    if (cached.expiresAt <= now) {
      healthBrowserCache.delete(key);
    }
  }

  while (healthBrowserCache.size > HEALTH_BROWSER_CACHE_MAX_ITEMS) {
    const oldestKey = healthBrowserCache.keys().next().value;
    if (!oldestKey) break;
    healthBrowserCache.delete(oldestKey);
  }
};

const withAiDeadline = async <T>(promise: Promise<T>, timeoutMs = HEALTH_BROWSER_AI_DEADLINE_MS): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(new Error('AI_BROWSER_DEADLINE_EXCEEDED')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const ensureArray = (value: unknown, fallback: string[]) =>
  Array.isArray(value) && value.length ? value.map(String).filter(Boolean) : fallback;

const ensureSources = (value: unknown, medical: boolean) =>
  Array.isArray(value) && value.length
    ? value.map((source: any, index) => ({
        id: String(source?.id || `source-${index + 1}`),
        title: String(source?.title || 'Источник'),
        url: String(source?.url || 'https://www.google.com/search'),
        summary: String(source?.summary || 'Справочный источник для проверки ответа.'),
        trustLevel: ['High', 'Medium', 'Low'].includes(source?.trustLevel) ? source.trustLevel : 'Medium',
        sourceName: String(source?.sourceName || source?.title || 'Source')
      }))
    : medical
      ? medicalSources
      : generalSources;

const ensureInsightShape = (value: any, query: string, medical: boolean) => ({
  query: String(value?.query || query),
  summary: {
    likelyCause: cleanAiText(
      String(
        value?.summary?.likelyCause ||
          (medical
            ? 'Это медицинский запрос. Для полезного ответа нужны главный симптом, длительность, сила проявлений и красные флаги.'
            : 'Запрос требует прямого ответа по сути, контекста и проверки актуальных источников.')
      )
    ),
    urgency: ['Critical', 'High', 'Medium', 'Low'].includes(value?.summary?.urgency) ? value.summary.urgency : 'Low',
    whatToDoNow: cleanAiText(
      String(
        value?.summary?.whatToDoNow ||
          (medical
            ? 'Опишите главный симптом, когда он начался, что усиливает или облегчает состояние, температуру и сопутствующие признаки.'
            : 'Сверьте дату, источник, регион и ключевой факт. Для текущих тем используйте 2–3 независимых источника.')
      )
    ),
    whenToTalkToDoctor: cleanAiText(
      String(
        value?.summary?.whenToTalkToDoctor ||
          (medical
            ? 'Если состояние ухудшается или есть красные флаги, обратитесь к врачу. В Казахстане при угрозе жизни ориентируйтесь на 103 или 112.'
            : 'Врач нужен только если тема связана со здоровьем. Для денег, права, политики и бизнеса важны профильные эксперты и первоисточники.')
      )
    )
  },
  detailedExplanation: {
    scenarios: ensureArray(
      value?.detailedExplanation?.scenarios,
      medical
        ? ['Лёгкие симптомы можно сначала структурировать по началу, длительности, провоцирующим факторам и тому, что облегчает состояние.']
        : ['Для актуальной темы важны дата, регион, первоисточник и подтверждение минимум из двух независимых источников.']
    ),
    redFlags: ensureArray(
      value?.detailedExplanation?.redFlags,
      medical
        ? ['Одышка', 'Боль в груди', 'Потеря сознания', 'Нарушение речи', 'Сильное кровотечение', 'Резкое ухудшение состояния']
        : ['Нет даты публикации', 'Источник неизвестен', 'Один источник пишет без подтверждения другими', 'Тема влияет на деньги, документы или безопасность']
    ),
    mistakes: ensureArray(
      value?.detailedExplanation?.mistakes,
      medical
        ? ['Самолечение сильными препаратами без показаний', 'Игнорирование красных флагов']
        : ['Делать выводы без уточнения периода или региона', 'Опираться на один источник']
    ),
    nextSteps: ensureArray(
      value?.detailedExplanation?.nextSteps,
      medical
        ? ['Оценить красные флаги', 'Подготовить симптомы, анализы и длительность проблемы', 'При необходимости перейти к врачу']
        : ['Проверить первоисточник', 'Сверить дату и регион', 'Сравнить с другим независимым источником']
    )
  },
  sources: ensureSources(value?.sources, medical),
  suggestedQuestions: ensureArray(
    value?.suggestedQuestions,
    medical
      ? ['Какие красные флаги опасны?', 'К какому врачу обратиться?', 'Что можно сделать до консультации?', 'Что ещё важно уточнить?']
      : ['Объясни простыми словами', 'Сравни варианты', 'Что важно проверить?', 'Дай короткий вывод']
  ).slice(0, 4)
});

const fetchNewsInsightWithTimeout = async (query: string, timeoutMs = 1800) => {
  if (!isNewsQuery(query)) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const topNews = /^(последние|свежие|главные)?\s*(мировые\s*)?новости\s*$/i.test(query.trim());
    const url = topNews
      ? 'https://news.google.com/rss?hl=ru&gl=KZ&ceid=KZ:ru'
      : `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ru&gl=KZ&ceid=KZ:ru`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'TakhetAI/1.0' },
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const xml = await response.text();
    const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))
      .map((match) => {
        const item = match[1] || '';
        const title = stripTags(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
        const link = stripTags(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '');
        const pubDate = stripTags(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '');
        const sourceName = stripTags(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || 'Google News');
        return { title, link, pubDate, sourceName };
      })
      .filter((item) => item.title && item.link)
      .slice(0, 5);

    if (!items.length) {
      return null;
    }

    const headlines = items.map((item, index) => `${index + 1}. ${item.title}${item.pubDate ? ` (${item.pubDate})` : ''}`);

    return ensureInsightShape(
      {
        query,
        summary: {
          likelyCause: `Главное по запросу "${query}":\n${headlines.join('\n')}`,
          urgency: 'Low',
          whatToDoNow:
            'Откройте 2–3 источника из списка, сверьте дату публикации и первоисточник. Для политики, права и денег не делайте выводы по одному заголовку.',
          whenToTalkToDoctor:
            'Врач нужен только если новость связана с вашим здоровьем. Для остальных тем важнее первоисточники и профильные эксперты.'
        },
        detailedExplanation: {
          scenarios: [
            'Для быстро меняющихся тем важны дата, время и подтверждение из нескольких источников.',
            'Если новость влияет на деньги, документы или безопасность, сначала проверьте первоисточник.',
            'Если нужен краткий разбор последствий, продолжите в Takhet AI с конкретным заголовком или ссылкой.'
          ],
          redFlags: ['Нет даты публикации.', 'Источник неизвестен.', 'Один источник пишет без подтверждения другими.'],
          mistakes: ['Делать вывод только по заголовку.', 'Не проверять дату публикации.', 'Смешивать факт, мнение и прогноз.'],
          nextSteps: ['Открыть главный источник.', 'Сверить дату и регион.', 'Проверить второе подтверждение.', 'Попросить Takhet AI объяснить последствия.']
        },
        sources: items.map((item, index) => ({
          id: `news-${index + 1}`,
          title: item.title,
          url: item.link,
          summary: item.pubDate ? `Опубликовано: ${item.pubDate}` : 'Свежая публикация из Google News.',
          trustLevel: 'Medium',
          sourceName: item.sourceName
        })),
        suggestedQuestions: ['Объясни простыми словами', 'Почему это важно?', 'Что изменилось сегодня?', 'Сравни позиции источников']
      },
      query,
      false
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const buildSystemInstruction = (medical: boolean) =>
  [
    'You are Takhet AI Browser. Reply in Russian.',
    'Always answer the actual user question first.',
    'Use one stable structure for every topic: direct answer, context, what to do now, risks, mistakes, next steps and sources.',
    'Do not output meta-advice, prompt text, or requests to choose a format.',
    medical
      ? 'For medical topics, provide triage, likely causes, urgency, red flags, mistakes, safe next steps and suitable specialist. Do not claim a final diagnosis.'
      : 'For non-medical topics, answer directly with concrete facts, context, practical next steps and relevant sources.',
    'For current facts, if you cannot verify an exact live number, say that briefly and still give the best useful answer.',
    'Assume Kazakhstan unless another country is specified. 103 and 112 are Kazakhstan examples.',
    'No markdown asterisks. No filler. No fake facts.'
  ].join('\n');

const buildPrompt = (query: string, medical: boolean) =>
  [
    `User query: ${query}`,
    `Current ISO date: ${new Date().toISOString()}`,
    `Mode: ${medical ? 'medical' : 'general'}`,
    '',
    'Return valid JSON only. Fill all fields with concrete, useful content.',
    'Rules:',
    '1. summary.likelyCause = direct answer in 2-5 sentences with specifics.',
    '2. summary.whatToDoNow = practical next actions.',
    '3. summary.whenToTalkToDoctor = doctor, expert or official-source condition.',
    '4. detailedExplanation lists must be concrete, not generic.',
    '5. sources = 2-4 relevant sources.',
    '6. suggestedQuestions = exactly 4 useful follow-up questions.',
    '7. Do not include instructions for the AI in the answer.'
  ].join('\n');

const buildPlainPrompt = (query: string, medical: boolean) =>
  [
    `User query: ${query}`,
    `Mode: ${medical ? 'medical' : 'general'}`,
    '',
    medical
      ? 'Answer in Russian with this structure: 1) direct medical orientation, 2) what to do now, 3) red flags, 4) mistakes to avoid, 5) next steps.'
      : 'Answer in Russian with this structure: 1) direct answer, 2) useful context, 3) practical next steps, 4) risks or mistakes, 5) what to check next.',
    'No markdown asterisks. No JSON. No meta-commentary.'
  ].join('\n');

const isTakhetNavigationQuery = (query: string) =>
  /(запис|запись|консультац|консульт|каталог|найти врача|подобрать врача|онлайн[-\s]?при[её]м|стоимость приема|цена приема|слот|расписан)/i.test(
    query
  );

const buildTakhetNavigationInsight = (query: string) =>
  ensureInsightShape(
    {
      query,
      summary: {
        likelyCause:
          'Чтобы записаться к врачу в Takhet+, откройте гостевой каталог врачей, выберите карточку специалиста, дату и свободное время. После выбора слота система попросит подтвердить номер телефона по SMS перед оплатой и созданием записи.',
        urgency: 'Low',
        whatToDoNow:
          'Нажмите “Поговорить с врачом” или перейдите на /guest-consultation. В карточке врача проверьте специализацию, опыт, формат приема, цену и ближайшие слоты.',
        whenToTalkToDoctor:
          'Если есть сильная боль, одышка, боль в груди, потеря сознания, кровотечение или резкое ухудшение состояния, не ждите онлайн-записи и обращайтесь в 103 или 112.'
      },
      detailedExplanation: {
        scenarios: [
          'Без регистрации: можно выбрать врача в гостевом каталоге и получить консультацию, но итоговое PDF-заключение доступно один раз, а саммари не сохраняется в медархив.',
          'С аккаунтом пациента: консультации, заключения и файлы сохраняются в личном кабинете и медархиве.',
          'Если нужный слот занят, выберите другую дату или другого специалиста.'
        ],
        redFlags: ['Сильная боль', 'Одышка', 'Боль в груди', 'Потеря сознания', 'Кровотечение', 'Резкое ухудшение состояния'],
        mistakes: [
          'Не выбирайте врача только по цене: проверьте специализацию, опыт и ближайшее доступное время.',
          'Не откладывайте срочную помощь, если есть красные флаги.',
          'Не закрывайте страницу гостевой записи до подтверждения телефона и оплаты.'
        ],
        nextSteps: [
          'Откройте /guest-consultation.',
          'Выберите карточку врача и подходящий слот.',
          'Подтвердите номер телефона по SMS.',
          'Перейдите к оплате и дождитесь подтверждения записи.'
        ]
      },
      sources: [
        {
          id: 'takhet-guest-consultation',
          title: 'Takhet+ guest consultation',
          url: '/guest-consultation',
          summary: 'Гостевой каталог врачей, карточка специалиста, календарь и запись на онлайн-консультацию.',
          trustLevel: 'High',
          sourceName: 'Takhet+'
        },
        {
          id: 'takhet-patient-portal',
          title: 'Takhet+ patient portal',
          url: '/patient-auth',
          summary: 'Вход пациента для сохранения консультаций, PDF-заключений и медархива.',
          trustLevel: 'High',
          sourceName: 'Takhet+'
        }
      ],
      suggestedQuestions: ['Как выбрать врача?', 'Что будет без регистрации?', 'Как подтвердить номер?', 'Где будет PDF-заключение?']
    },
    query,
    false
  );

const extractJson = (value: string) => {
  const raw = String(value || '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start >= 0 && end > start) {
    return candidate.slice(start, end + 1);
  }

  return candidate;
};

const buildGenerateConfig = (query: string, medical: boolean) => ({
  systemInstruction: buildSystemInstruction(medical),
  responseMimeType: 'application/json',
  responseSchema: schemas.healthInsights,
  tools: isFreshDataLike(query) ? [{ googleSearch: {} }] : undefined,
  temperature: medical ? 0.15 : 0.2,
  topP: 0.9,
  candidateCount: 1,
  maxOutputTokens: medical ? 1600 : 1400
});

const textToInsight = (text: string, query: string, medical: boolean) =>
  ensureInsightShape(
    {
      query,
      summary: {
        likelyCause: cleanAiText(text),
        urgency: 'Low',
        whatToDoNow: medical
          ? 'Следуйте рекомендациям из ответа и переходите к врачу, если есть красные флаги или состояние нарастает.'
          : 'Используйте прямой ответ выше как основу и при необходимости уточните место, дату, период или критерий сравнения.',
        whenToTalkToDoctor: medical
          ? 'Обратитесь к врачу при ухудшении, сильной боли, одышке, нарушении сознания, кровотечении или длительных симптомах.'
          : 'Врач нужен только для вопросов здоровья. Для права, денег, политики и бизнеса сверяйтесь с профильным экспертом и первоисточниками.'
      },
      detailedExplanation: {
        scenarios: medical
          ? ['Лёгкие симптомы можно сначала структурировать: начало, длительность, провоцирующие факторы, что помогает и что ухудшает.']
          : ['Для фактов и текущих событий важны дата, регион, первоисточник и подтверждение минимум из двух источников.'],
        redFlags: medical
          ? ['Одышка', 'Боль в груди', 'Потеря сознания', 'Нарушение речи', 'Сильное кровотечение', 'Резкое ухудшение состояния']
          : ['Нет даты или источника', 'Тема влияет на деньги, документы или безопасность', 'Нужны актуальные данные, а их нет в ответе'],
        mistakes: medical
          ? ['Самолечение сильными препаратами без показаний', 'Игнорирование красных флагов']
          : ['Делать выводы без уточнения периода или региона', 'Опираться на один источник'],
        nextSteps: medical
          ? ['Оценить красные флаги', 'Подготовить симптомы, анализы и длительность проблемы', 'При необходимости перейти к врачу']
          : ['Проверить источник', 'Сверить дату и регион', 'При необходимости продолжить диалог в Takhet AI']
      },
      sources: medical ? medicalSources : generalSources,
      suggestedQuestions: medical
        ? ['Какие красные флаги опасны?', 'К какому врачу обратиться?', 'Что можно сделать до консультации?', 'Что ещё важно уточнить?']
        : ['Объясни простыми словами', 'Сравни варианты', 'Что важно проверить?', 'Дай короткий вывод']
    },
    query,
    medical
  );

const generateInsight = async (query: string, medical: boolean) => {
  if (isTakhetNavigationQuery(query)) {
    return buildTakhetNavigationInsight(query);
  }

  const newsInsight = await fetchNewsInsightWithTimeout(query);
  if (newsInsight) {
    return newsInsight;
  }

  const ai = ensureAi();
  const modelCandidates = getModelCandidatesForTask('browser', query);
  const prompt = buildPrompt(query, medical);
  const plainPrompt = buildPlainPrompt(query, medical);
  const generateConfig = buildGenerateConfig(query, medical);
  let lastError: unknown = null;

  for (const model of modelCandidates) {
    if (HEALTH_BROWSER_SINGLE_PASS) {
      try {
        const response = await withAiDeadline(
          ai.models.generateContent({
            model,
            contents: plainPrompt,
            config: {
              systemInstruction: buildSystemInstruction(medical),
              tools: isFreshDataLike(query) ? [{ googleSearch: {} }] : undefined,
              temperature: medical ? 0.15 : 0.2,
              topP: 0.9,
              candidateCount: 1,
              maxOutputTokens: medical ? 1600 : 1400
            }
          })
        );
        const plainText = cleanAiText(String(response.text || '').trim());
        if (plainText && !isLowValueAiText(plainText)) {
          return textToInsight(plainText, query, medical);
        }
      } catch (error) {
        lastError = error;
        console.error(`health-insights single-pass mode failed on ${model}:`, error);
        if (!isQuotaError(error)) {
          break;
        }
      }
      continue;
    }

    try {
      const response = await withAiDeadline(
        ai.models.generateContent({
          model,
          contents: prompt,
          config: generateConfig
        })
      );
      const responseText = String(response.text || '').trim();
      if (responseText) {
        const insight = ensureInsightShape(JSON.parse(extractJson(responseText)), query, medical);
        if (!isLowValueAiText(insight.summary.likelyCause)) {
          return insight;
        }
      }
    } catch (error) {
      lastError = error;
      console.error(`health-insights JSON mode failed on ${model}:`, error);
    }

    try {
      const response = await withAiDeadline(
        ai.models.generateContent({
          model,
          contents: plainPrompt,
          config: {
            systemInstruction: buildSystemInstruction(medical),
            tools: isFreshDataLike(query) ? [{ googleSearch: {} }] : undefined,
            temperature: medical ? 0.15 : 0.2,
            topP: 0.9,
            candidateCount: 1,
            maxOutputTokens: medical ? 1600 : 1400
          }
        })
      );
      const plainText = cleanAiText(String(response.text || '').trim());
      if (plainText && !isLowValueAiText(plainText)) {
        return textToInsight(plainText, query, medical);
      }
    } catch (error) {
      lastError = error;
      console.error(`health-insights plain mode failed on ${model}:`, error);
      if (!isQuotaError(error)) {
        break;
      }
    }
  }

  if (lastError) {
    console.error('health-insights fallback:', lastError);
  }

  return textToInsight(buildHelpfulFallback(query), query, medical);
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const { query } = req.body || {};
  const normalizedQuery = String(query || '').trim();

  if (!normalizedQuery) {
    sendJson(res, 400, { error: 'Query is required' });
    return;
  }

  const cached = getCachedInsight(normalizedQuery);
  if (cached) {
    sendJson(res, 200, cached);
    return;
  }

  const inFlight = inFlightHealthBrowserRequests.get(normalizeQueryKey(normalizedQuery));
  if (inFlight) {
    const result = await inFlight;
    sendJson(res, 200, result);
    return;
  }

  const promise = (async () => {
    const medical = isMedicalLike(normalizedQuery);
    const result = await generateInsight(normalizedQuery, medical);
    setCachedInsight(normalizedQuery, result);
    return result;
  })();

  inFlightHealthBrowserRequests.set(normalizeQueryKey(normalizedQuery), promise);

  try {
    const result = await promise;
    sendJson(res, 200, result);
  } catch (error) {
    console.error('AI Browser error:', error);
    const medical = isMedicalLike(normalizedQuery);
    sendJson(res, 200, textToInsight(buildHelpfulFallback(normalizedQuery), normalizedQuery, medical));
  } finally {
    inFlightHealthBrowserRequests.delete(normalizeQueryKey(normalizedQuery));
  }
}
