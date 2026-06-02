export interface TrustedSource {
  id: string;
  title: string;
  url: string;
  summary: string;
  trustLevel: 'High' | 'Medium' | 'Low';
  sourceName: string;
}

export interface AISearchResult {
  query: string;
  summary: {
    likelyCause: string;
    urgency: 'Critical' | 'High' | 'Medium' | 'Low';
    whatToDoNow: string;
    whenToTalkToDoctor: string;
  };
  detailedExplanation: {
    scenarios: string[];
    redFlags: string[];
    mistakes: string[];
    nextSteps: string[];
  };
  sources: TrustedSource[];
  suggestedQuestions: string[];
}

const medicalQueryPattern =
  /(боль|температур|каш|горл|насморк|давлен|сердц|груд|одыш|тошнот|рвот|понос|диаре|живот|голов|мигрен|сып|кров|травм|перелом|симптом|анализ|лекар|таблет|препарат|дозиров|врач|диагноз|лечени|здоров|пульс|сахар|инсульт|инфаркт|аллерг|беремен|ребен|ребён|сустав|спин|почек|печен|печён|желуд|вирус|инфекц|грипп|ковид|covid|пневмони|астм|неврол|хирург|лор|терапевт|кардиолог|эндокрин|дерматолог|психолог|психотерап|психосомат|tuberculosis|\btb\b|symptom|diagnosis|treatment|doctor|medicine|analysis|lab result)/i;

function cleanLocalText(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .trim();
}

function extractUserQuery(message: string) {
  const raw = String(message || '').trim();
  const markers = [
    'Новый вопрос пациента:',
    'New patient question:',
    'User query:',
    'General user query:',
    'Medical user query:'
  ];

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

function buildWeatherFallback(query: string) {
  return cleanLocalText(
    [
      `По запросу "${query || 'погода'}" нужен актуальный прогноз с live-данными.`,
      '',
      'Чтобы ответ был точным, проверьте текущую температуру, ощущается как, осадки, ветер, влажность и время обновления источника.',
      '',
      'Нужный формат ответа: город, сейчас +°C, ощущается как +°C, осадки, ветер м/с, влажность, прогноз на ближайшие часы и практический вывод что надеть или брать ли зонт.'
    ].join('\n')
  );
}

function buildPoliticalFallback(query: string, person: 'Трамп' | 'Камала Харрис') {
  const details =
    person === 'Трамп'
      ? 'Дональд Трамп — американский политик, бизнесмен и медиаперсона, связанный с Республиканской партией США и крупными политическими событиями последних лет.'
      : 'Камала Харрис — американский политик, представитель Демократической партии США, связанная с ключевыми вопросами внутренней и внешней политики США.';

  return cleanLocalText(
    [
      `По запросу "${query || person}" нужен предметный разбор: кто это, какие позиции занимает, что изменилось в последнее время и почему это важно.`,
      '',
      details,
      '',
      'Для актуальных новостей, заявлений, рейтингов и выборов обязательно проверяйте свежие источники и дату публикации, потому что эта информация быстро меняется.',
      '',
      'Если нужно, продолжу в одном формате: краткая справка, политические взгляды, сравнение, последние события или объяснение простыми словами.'
    ].join('\n')
  );
}

function buildMedicalFallback(query: string) {
  return cleanLocalText(
    [
      `Коротко по запросу "${query || 'о здоровье'}": это медицинский вопрос. Без деталей нельзя ставить диагноз, но можно определить ближайшие безопасные действия.`,
      '',
      'Что сделать сейчас: укажите главный симптом, когда он начался, насколько он сильный, что ухудшает или облегчает состояние, есть ли температура, одышка, боль в груди, слабость, кровь, потеря сознания, беременность, хронические болезни и какие лекарства уже принимались.',
      '',
      'Когда срочно нужна помощь: если есть боль в груди, выраженная одышка, потеря сознания, сильное кровотечение, нарушение речи, судороги или резкое ухудшение, в Казахстане ориентируйтесь на 103 или 112.',
      '',
      'Это первичная навигация, не окончательный диагноз.'
    ].join('\n')
  );
}

function buildGeneralFallback(query: string) {
  return cleanLocalText(
    [
      `По запросу "${query || 'ваш вопрос'}" нужен прямой ответ по сути без воды.`,
      '',
      'Если это справка, дам краткую суть и контекст. Если нужен выбор, сравню варианты по плюсам, минусам и рискам. Если нужна инструкция, дам шаги по порядку. Если тема зависит от свежих событий, отдельно отмечу что нужно перепроверить по актуальным источникам.',
      '',
      'Если хотите более точный ответ, уточните формат: кратко, подробно, сравнение, план действий или объяснение простыми словами.'
    ].join('\n')
  );
}

function buildLocalFallback(message: string) {
  const query = extractUserQuery(message);
  const normalized = query.toLowerCase();

  if (/(погода|weather|forecast)/i.test(normalized)) {
    return buildWeatherFallback(query);
  }

  if (/(трамп|trump)/i.test(normalized)) {
    return buildPoliticalFallback(query, 'Трамп');
  }

  if (/(камала|kamala|харрис|harris)/i.test(normalized)) {
    return buildPoliticalFallback(query, 'Камала Харрис');
  }

  if (medicalQueryPattern.test(query)) {
    return buildMedicalFallback(query);
  }

  return buildGeneralFallback(query);
}

async function callAiApi<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const raw = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    throw new Error(`AI ${response.status}: ${raw}`);
  }

  if (!raw.trim()) {
    return null as T;
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(raw) as T;
  }

  return raw as T;
}

export async function getHealthInsights(query: string): Promise<AISearchResult> {
  return callAiApi<AISearchResult>('/api/ai/health-insights', { query });
}

export async function advancedChat(message: string, config: { systemInstruction?: string; useSearch?: boolean }) {
  try {
    const response = await callAiApi<{ text: string }>('/api/ai/chat', {
      message,
      systemInstruction: config.systemInstruction,
      useSearch: config.useSearch
    });
    return response.text || buildLocalFallback(message);
  } catch (error) {
    console.error('Advanced Chat Error:', error);
    return buildLocalFallback(message);
  }
}

export async function advancedChatStream(
  message: string,
  config: { systemInstruction?: string; useSearch?: boolean; onDelta?: (delta: string, fullText: string) => void }
) {
  try {
    const response = await fetch('/api/ai/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        systemInstruction: config.systemInstruction,
        useSearch: config.useSearch
      })
    });

    if (!response.ok) {
      const raw = await response.text();
      throw new Error(`AI ${response.status}: ${raw}`);
    }

    if (!response.body) {
      return advancedChat(message, config);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const delta = decoder.decode(value, { stream: true });
      if (!delta) continue;
      fullText += delta;
      config.onDelta?.(delta, fullText);
    }

    const tail = decoder.decode();
    if (tail) {
      fullText += tail;
      config.onDelta?.(tail, fullText);
    }

    return fullText || buildLocalFallback(message);
  } catch (error) {
    console.error('Advanced Chat Stream Error:', error);
    const fallback = await advancedChat(message, config);
    config.onDelta?.(fallback, fallback);
    return fallback;
  }
}

export async function fastChat(message: string) {
  try {
    const response = await callAiApi<{ text: string }>('/api/ai/chat', { message });
    return response.text || buildLocalFallback(message);
  } catch (error) {
    console.error('Fast Chat Error:', error);
    return buildLocalFallback(message);
  }
}

export async function generateSpeech(text: string) {
  try {
    const response = await callAiApi<{ audio: string | null }>('/api/ai/speech', { text });
    return response.audio;
  } catch (error) {
    console.error('TTS Error:', error);
    return null;
  }
}

export async function analyzeHealthData(type: string, data: string) {
  try {
    return callAiApi<{ summary: string; recommendations: string[] }>('/api/ai/analyze', { type, data });
  } catch (error) {
    console.error('Analyze Health Data Error:', error);
    return { summary: 'Ошибка при анализе данных.', recommendations: [] };
  }
}
