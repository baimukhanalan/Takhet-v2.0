import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Shield, AlertTriangle, ExternalLink, Bookmark,
  Stethoscope, History, ChevronLeft, Info, Sparkles, BrainCircuit,
  Clock, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from '../types';
import PublicHeader from '../components/PublicHeader';
import { getHealthInsightsFast, AISearchResult } from '../services/gemini';
import { useLanguage } from '../services/useLanguage';
import { startVoiceInput } from '../services/voiceInput';
import { roleApi } from '../../services/roleApi';

const textToBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const browserLoadingPhrases = [
  'Секунду, делаю умный вид…',
  'Собираю мысли, не разбегайтесь',
  'Думаю, как объяснить без скуки',
  'Секунду, сейчас будет логично',
  'Проверяю, чтобы не наговорить лишнего'
];

const medicalBrowserPrompt = [
  'You are Takhet AI Browser. Reply in Russian.',
  'Use one Takhet browser structure for every topic: direct answer, context, importance, what to do now, risks, mistakes, next steps, source/expert.',
  'Answer the actual question immediately. Do not ask the user to choose a format or provide context when the intent is clear.',
  'Do not output meta-advice like "this needs a general useful answer" or "choose a format". Give the answer itself.',
  'Use concrete facts, numbers, dates, examples, comparisons and action items. If the query is short, infer the most likely intent and provide a useful brief.',
  'For current facts, use search/current sources and lead with exact value, city/country, date/time, numbers and units when available.',
  'For medical topics, provide recommendations and red flags, not a final diagnosis. Assume Kazakhstan unless another country is specified; 103 and 112 are Kazakhstan emergency examples.',
  'No markdown asterisks. No internal instructions. No filler.'
].join('\n');

const AIHealthBrowser: React.FC<{ user?: User }> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const query = searchParams.get('q') || '';
  const [mode, setMode] = useState<'search' | 'chat'>('search');
  const [inputValue, setInputValue] = useState(query);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<AISearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [cache, setCache] = useState<Record<string, AISearchResult>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [typedLoadingPhrase, setTypedLoadingPhrase] = useState(browserLoadingPhrases[0]);
  const [streamingPreview, setStreamingPreview] = useState('');
  const searchRequestRef = useRef(0);

  useEffect(() => {
    if (!query) return;
    void handleSearch(query, false);
  }, [query]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    roleApi
      .appState()
      .then((state) => {
        if (!isMounted) return;
        const nextHistory = Array.isArray(state?.aiBrowserHistory) ? state.aiBrowserHistory : [];
        const nextCache =
          state?.aiBrowserCache && typeof state.aiBrowserCache === 'object' && !Array.isArray(state.aiBrowserCache)
            ? (state.aiBrowserCache as Record<string, AISearchResult>)
            : {};
        setHistory(nextHistory);
        setCache(nextCache);
      })
      .catch((loadError) => {
        console.error('AI browser state load failed:', loadError);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!isSearching) return;
    const timer = window.setInterval(() => {
      setLoadingPhraseIndex((current) => (current + 1) % browserLoadingPhrases.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [isSearching]);

  useEffect(() => {
    if (!isSearching) {
      setTypedLoadingPhrase(browserLoadingPhrases[loadingPhraseIndex]);
      return;
    }

    const nextPhrase = browserLoadingPhrases[loadingPhraseIndex];
    let frame = 0;
    setTypedLoadingPhrase('');

    const typeTimer = window.setInterval(() => {
      frame += 1;
      setTypedLoadingPhrase(nextPhrase.slice(0, frame));
      if (frame >= nextPhrase.length) {
        window.clearInterval(typeTimer);
      }
    }, 32);

    return () => window.clearInterval(typeTimer);
  }, [isSearching, loadingPhraseIndex]);

  const persistHistory = (value: string) => {
    setHistory((prev) => {
      const next = [value, ...prev.filter((item) => item !== value)].slice(0, 10);
      if (user) {
        void roleApi.updateAppState({ aiBrowserHistory: next });
      }
      return next;
    });
  };

  const handleSearch = async (rawValue: string, updateParams = true) => {
    const value = rawValue.trim();
    if (!value) return;
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setIsSearching(true);
    setError(null);
    setStreamingPreview('');
    setLoadingPhraseIndex(0);
    setInputValue(value);
    if (updateParams) setSearchParams({ q: value });
    persistHistory(value);
    const cacheKey = value.toLowerCase();

    try {
      if (!updateParams && cache[cacheKey]) {
        setResult(cache[cacheKey]);
        return;
      }

      const insights = await getHealthInsightsFast(value, {
        onDelta: (_delta, fullText) => {
          if (searchRequestRef.current === requestId) {
            setStreamingPreview(fullText);
          }
        }
      });
      if (searchRequestRef.current !== requestId) return;
      setResult(insights);
      setCache((current) => {
        const next = { ...current, [cacheKey]: insights };
        if (user) {
          void roleApi.updateAppState({ aiBrowserCache: next });
        }
        return next;
      });
    } catch (searchError) {
      if (searchRequestRef.current !== requestId) return;
      console.error('Search failed:', searchError);
      setError('Не удалось получить ответ AI-браузера. Попробуйте повторить запрос через несколько секунд.');
    } finally {
      if (searchRequestRef.current === requestId) {
        setIsSearching(false);
      }
    }
  };

  const handleAction = async (action: 'consultation' | 'doctor' | 'archive' | 'chat') => {
    if (action === 'consultation') {
      navigate('/ai-consultation');
      return;
    }

    if (action === 'chat') {
      const target = user?.role === UserRole.PATIENT ? '/takhet-ai/patient' : '/takhet-ai/try';
      if (result) {
        navigate(target, {
          state: {
            initialMessage: query || inputValue,
            initialContext: `Результат поиска в AI-браузере:\n\nВероятная причина: ${result.summary.likelyCause}\nСрочность: ${result.summary.urgency}\nЧто делать сейчас: ${result.summary.whatToDoNow}\nКогда нужен врач: ${result.summary.whenToTalkToDoctor}\n\nПродолжи разбор на основе этого результата и помоги выбрать следующий шаг.`,
            transferFrom: 'browser'
          }
        });
        return;
      }

      navigate(target);
      return;
    }

    if (!user || user.role !== UserRole.PATIENT) {
      navigate('/patient-auth', {
        state: {
          from: {
            pathname: window.location.pathname,
            search: window.location.search
          },
          action,
          forcePublicAuth: true
        }
      });
      return;
    }

    if (action === 'doctor') {
      navigate('/doctors-search');
      return;
    }

    if (action === 'archive') {
      if (result) {
        try {
          const archiveText = [
            `AI-browser query: ${query || inputValue}`,
            '',
            `Likely cause: ${result.summary.likelyCause}`,
            `Urgency: ${result.summary.urgency}`,
            `What to do now: ${result.summary.whatToDoNow}`,
            `When to talk to doctor: ${result.summary.whenToTalkToDoctor}`,
            '',
            'Scenarios:',
            ...result.detailedExplanation.scenarios.map((item) => `- ${item}`),
            '',
            'Red flags:',
            ...result.detailedExplanation.redFlags.map((item) => `- ${item}`),
            '',
            'Next steps:',
            ...result.detailedExplanation.nextSteps.map((item) => `- ${item}`),
            '',
            'Sources:',
            ...result.sources.map((source) => `- ${source.sourceName}: ${source.title} (${source.url})`)
          ].join('\n');
          const uploaded = await roleApi.uploadMedicalFile({
            fileName: `ai-browser-result-${Date.now()}.txt`,
            mimeType: 'text/plain',
            base64: textToBase64(archiveText)
          });
          const created = await roleApi.patientCreateCase(`AI-browser archive: ${query || inputValue}`);
          await roleApi.patientSaveConsultationDraft(created.id, {
            transcript: [
              {
                speaker: 'ai',
                text: `AI-браузер сохранил результат поиска в медархив: ${uploaded.bucket}/${uploaded.path}`,
                createdAt: new Date().toISOString()
              }
            ],
            uploadedDocs: [{ name: 'AI-browser result', analysis: archiveText }],
            aiSummary: result.summary.whatToDoNow
          });
        } catch (archiveError) {
          console.error('Archive save failed:', archiveError);
          setError(archiveError instanceof Error ? archiveError.message : 'Не удалось сохранить результат в архив');
          return;
        }
      }
      navigate('/archive');
      return;
    }

    if (result) {
      navigate('/takhet-ai/patient', {
        state: {
          initialMessage: query || inputValue,
          initialContext: `Результат поиска в AI-браузере:\n\nВероятная причина: ${result.summary.likelyCause}\nСрочность: ${result.summary.urgency}\nЧто делать сейчас: ${result.summary.whatToDoNow}\nКогда нужен врач: ${result.summary.whenToTalkToDoctor}\n\nПродолжи разбор на основе этого результата и помоги выбрать следующий шаг.`,
          transferFrom: 'browser'
        }
      });
      return;
    }

    navigate('/takhet-ai/patient');
  };

  const handleVoiceInput = () => {
    startVoiceInput({
      onStart: () => setIsVoiceListening(true),
      onEnd: () => setIsVoiceListening(false),
      onError: setError,
      onResult: (text) => {
        setInputValue(text);
        void handleSearch(text);
      }
    });
  };

  const isPortalView = !!user;

  return (
    <div className={`min-h-screen bg-white flex flex-col ${isPortalView ? 'pt-0' : ''}`}>
      {!isPortalView && <PublicHeader activePath="/health-browser" />}

      <div className={`flex-1 flex overflow-hidden ${isPortalView ? 'pt-0' : 'pt-20'}`}>
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className={`sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-3 md:p-4 md:px-8 ${isPortalView ? 'pt-4' : ''}`}>
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {isPortalView && (
                  <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary rounded-2xl transition-all border border-slate-100" title="Назад">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {isPortalView && (
                  <button onClick={() => setShowHistory(!showHistory)} className={`p-3 rounded-2xl transition-all border ${showHistory ? 'bg-primary text-white border-primary' : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary border-slate-100'}`} title="История поиска">
                    <History className="w-5 h-5" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showHistory && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-2 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 z-[100] overflow-hidden">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">История поиска</span>
                      <button onClick={() => { setHistory([]); if (user) void roleApi.updateAppState({ aiBrowserHistory: [] }); }} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Очистить</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {history.length > 0 ? history.map((item, i) => (
                        <button key={i} onClick={() => { void handleSearch(item); setShowHistory(false); }} className="w-full text-left p-4 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-none">
                          <Clock className="w-4 h-4 text-slate-300" />
                          <span className="text-sm font-bold text-slate-700 break-words">{item}</span>
                        </button>
                      )) : (
                        <div className="p-8 text-center text-slate-300 text-xs font-black uppercase tracking-widest">Пусто</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative flex-1 w-full group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleSearch(inputValue)}
                  placeholder={t.aiBrowser.inputPlaceholder}
                  className="w-full pl-14 pr-14 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-900 focus:bg-white focus:border-primary/20 transition-all shadow-sm group-focus-within:shadow-md outline-none"
                />
                {isSearching && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  </div>
                )}
                {!isSearching && (
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-2xl p-2 transition-colors ${
                      isVoiceListening ? 'bg-primary text-white' : 'text-slate-400 hover:bg-white hover:text-primary'
                    }`}
                    title="Голосовой ввод"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="flex bg-slate-50 p-1 rounded-2xl shrink-0 border border-slate-100 w-full md:w-auto">
                <button onClick={() => setMode('search')} className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'search' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  Поиск
                </button>
                <button onClick={() => void handleAction('chat')} className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  Чат
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 md:p-10 flex flex-col lg:flex-row gap-6 md:gap-10">
              <div className="flex-1 space-y-10">
                <AnimatePresence mode="wait">
                  {isSearching ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                      <div className="h-40 bg-slate-50 rounded-[2.5rem] animate-pulse"></div>
                      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI формирует ответ</span>
                        </div>
                        <p className="text-sm md:text-base font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {streamingPreview || typedLoadingPhrase}
                          <span className="ml-0.5 inline-block animate-pulse text-primary">|</span>
                        </p>
                      </div>
                      <div className="h-64 bg-slate-50 rounded-[2.5rem] animate-pulse"></div>
                    </motion.div>
                  ) : error ? (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center space-y-6 py-20">
                      <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500">
                        <AlertTriangle className="w-10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl font-black text-slate-900">Ошибка поиска</h2>
                        <p className="text-slate-500 font-medium max-w-sm">{error}</p>
                        <button onClick={() => void handleSearch(query || inputValue)} className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm">
                          Попробовать снова
                        </button>
                      </div>
                    </motion.div>
                  ) : result ? (
                    <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                      <div className="bg-white border border-slate-100 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors"></div>

                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <h2 className="text-lg md:text-xl font-black tracking-tight">Краткий разбор</h2>
                          <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                            <Shield className="w-3 h-3" /> Проверено AI
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                          <div className="space-y-4 md:space-y-6">
                            <div>
                              <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1 md:mb-2">Возможная причина</label>
                              <p className="text-base md:text-lg font-bold text-slate-800 leading-tight">{result.summary.likelyCause}</p>
                            </div>
                            <div>
                              <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1 md:mb-2">Уровень срочности</label>
                              <div className={`inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest ${
                                result.summary.urgency === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' :
                                result.summary.urgency === 'High' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                result.summary.urgency === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                'bg-blue-50 text-blue-600 border border-blue-100'
                              }`}>
                                <AlertTriangle className="w-3 h-3" />
                                {result.summary.urgency === 'Critical' ? 'Критический' :
                                  result.summary.urgency === 'High' ? 'Высокий' :
                                  result.summary.urgency === 'Medium' ? 'Средний' : 'Низкий'}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4 md:space-y-6">
                            <div>
                              <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1 md:mb-2">Что делать сейчас</label>
                              <p className="text-xs md:text-sm font-bold text-slate-600 leading-relaxed">{result.summary.whatToDoNow}</p>
                            </div>
                            <div>
                              <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1 md:mb-2">Когда нужен врач</label>
                              <p className="text-xs md:text-sm font-bold text-slate-600 leading-relaxed">{result.summary.whenToTalkToDoctor}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                              <Info className="w-5 h-5 text-primary" /> Возможные сценарии
                            </h3>
                            <ul className="space-y-3">
                              {result.detailedExplanation.scenarios.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0"></div>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2 text-red-600">
                              <AlertTriangle className="w-5 h-5" /> Красные флаги
                            </h3>
                            <ul className="space-y-3">
                              {result.detailedExplanation.redFlags.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-bold text-red-500">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0"></div>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                          <h3 className="text-lg font-black tracking-tight mb-6">Ваши следующие шаги</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {result.detailedExplanation.nextSteps.map((step, i) => (
                              <div key={i} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 group hover:bg-white hover:shadow-md transition-all">
                                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-xs font-black text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                  {i + 1}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 pt-6 md:pt-10">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => void handleAction('doctor')} className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-primary text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                            <Stethoscope className="w-4 h-4" /> Поговорить с врачом
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => void handleAction('consultation')} className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                            <BrainCircuit className="w-4 h-4" /> ИИ консультация
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => void handleAction('archive')} className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center gap-2">
                            <Bookmark className="w-4 h-4" /> Сохранить в архив
                          </motion.button>
                        </div>
                      </div>

                      <div className="space-y-4 px-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Уточняющие вопросы</label>
                        <div className="flex flex-wrap gap-3">
                          {result.suggestedQuestions.map((item, i) => (
                            <button key={i} onClick={() => void handleSearch(item)} className="px-5 py-3 bg-slate-50 hover:bg-primary/5 hover:text-primary border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 transition-all text-left">
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                      <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300">
                        <Search className="w-10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900">Начните поиск по здоровью</h2>
                        <p className="text-slate-500 font-medium max-w-sm">Введите симптомы, вопрос или тему, чтобы получить быстрый разбор и проверенные источники.</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {result && (
                <aside className="w-full lg:w-80 space-y-8">
                  <div className="sticky top-32 space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Проверенные источники
                      </h3>
                      <div className="space-y-4">
                        {result.sources.map((source) => (
                          <motion.a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" whileHover={{ y: -5, scale: 1.02 }} className="block p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-full">{source.sourceName}</span>
                              <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 mb-2 leading-tight group-hover:text-primary transition-colors">{source.title}</h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3 line-clamp-2">{source.summary}</p>
                            <div className="flex items-center gap-1.5">
                              <div className="flex gap-0.5">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className={`w-1 h-3 rounded-full ${i === 2 && source.trustLevel !== 'High' ? 'bg-slate-200' : 'bg-blue-400'}`}></div>
                                ))}
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Доверие: {source.trustLevel === 'High' ? 'Высокое' : 'Среднее'}</span>
                            </div>
                          </motion.a>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Пояснение</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        Ответы формируются на основе проверенных медицинских источников. Это не диагноз. Если состояние вызывает тревогу, обратитесь к врачу.
                      </p>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIHealthBrowser;
