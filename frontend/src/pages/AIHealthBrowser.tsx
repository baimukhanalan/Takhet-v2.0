import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, MessageSquare, Shield, AlertTriangle, 
  ArrowRight, ExternalLink, Bookmark, Share2, 
  Stethoscope, FileText, Camera, History, 
  ChevronRight, ChevronLeft, Info, Sparkles, BrainCircuit,
  Clock, Activity, HeartPulse, X, Menu,
  ChevronDown, Send, User as UserIcon, LogOut, Settings, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from '../types';
import PublicHeader from '../components/PublicHeader';
import { useLanguage } from '../services/useLanguage';

import { getHealthInsights, AISearchResult, TrustedSource } from '../services/gemini';

const AIHealthBrowser: React.FC<{ user?: User }> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [mode, setMode] = useState<'search' | 'chat'>('search');
  const [inputValue, setInputValue] = useState(query);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<AISearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('ai_browser_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (query) {
      handleSearch(query);
      // Save to history
      setHistory(prev => {
        const newHist = [query, ...prev.filter(q => q !== query)].slice(0, 10);
        localStorage.setItem('ai_browser_history', JSON.stringify(newHist));
        return newHist;
      });
    }
  }, [query]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    setError(null);
    setSearchParams({ q });
    try {
      const insights = await getHealthInsights(q);
      setResult(insights);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Не удалось получить данные. Пожалуйста, попробуйте позже.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAction = (action: string) => {
    if (!user || user.role !== UserRole.PATIENT) {
      navigate('/patient-auth', { state: { from: window.location.pathname + window.location.search, action } });
      return;
    }
    
    // Perform action if logged in
    switch(action) {
      case 'consultation': navigate('/ai-consultation'); break;
      case 'doctor': navigate('/doctors-search'); break;
      case 'archive': navigate('/archive'); break;
      case 'chat': 
        if (result) {
          // Transfer current context to chat
          navigate('/takhet-ai', { 
            state: { 
              initialMessage: query,
              initialContext: `Результат поиска в ИИ-браузере:\n\nПричина: ${result.summary.likelyCause}\nСрочность: ${result.summary.urgency}\nРекомендации: ${result.summary.whatToDoNow}\n\nПожалуйста, проконсультируй меня подробнее на основе этого ответа.`,
              transferFrom: 'browser'
            } 
          });
        } else {
          navigate('/takhet-ai');
        }
        break;
      default: break;
    }
  };

  const isPortalView = !!user;

  return (
    <div className={`min-h-screen bg-white flex flex-col ${isPortalView ? 'pt-0' : ''}`}>
      {!isPortalView && <PublicHeader activePath="/health-browser" />}
      
      <div className={`flex-1 flex overflow-hidden ${isPortalView ? 'pt-0' : 'pt-20'}`}>
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Search Bar & Mode Switcher */}
          <div className={`sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-3 md:p-4 md:px-8 ${isPortalView ? 'pt-4' : ''}`}>
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {isPortalView && (
                  <button 
                    onClick={() => navigate(-1)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary rounded-2xl transition-all border border-slate-100"
                    title="Назад"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {isPortalView && (
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-3 rounded-2xl transition-all border ${showHistory ? 'bg-primary text-white border-primary' : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary border-slate-100'}`}
                    title="История поиска"
                  >
                    <History className="w-5 h-5" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showHistory && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 z-[100] overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">История поиска</span>
                      <button onClick={() => { setHistory([]); localStorage.removeItem('ai_browser_history'); }} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Очистить</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {history.length > 0 ? history.map((h, i) => (
                        <button 
                          key={i}
                          onClick={() => { handleSearch(h); setShowHistory(false); setInputValue(h); }}
                          className="w-full text-left p-4 hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-none"
                        >
                          <Clock className="w-4 h-4 text-slate-300" />
                          <span className="text-sm font-bold text-slate-700 break-words">{h}</span>
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(inputValue)}
                  placeholder="Что вас беспокоит? Например: болит горло..."
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[2rem] font-bold text-slate-900 focus:bg-white focus:border-primary/20 transition-all shadow-sm group-focus-within:shadow-md outline-none"
                />
                {isSearching && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              <div className="flex bg-slate-50 p-1 rounded-2xl shrink-0 border border-slate-100 w-full md:w-auto">
                <button 
                  onClick={() => setMode('search')}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'search' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Поиск
                </button>
                <button 
                  onClick={() => handleAction('chat')}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Чат
                </button>
              </div>
            </div>
          </div>

          {/* Content Scroll Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4 md:p-10 flex flex-col lg:flex-row gap-6 md:gap-10">
              
              {/* Results Column */}
              <div className="flex-1 space-y-10">
                <AnimatePresence mode="wait">
                  {isSearching ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                      <div className="h-40 bg-slate-50 rounded-[2.5rem] animate-pulse"></div>
                      <div className="h-64 bg-slate-50 rounded-[2.5rem] animate-pulse"></div>
                    </motion.div>
                  ) : error ? (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center text-center space-y-6 py-20"
                    >
                      <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500">
                        <AlertTriangle className="w-10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl font-black text-slate-900">Ошибка поиска</h2>
                        <p className="text-slate-500 font-medium max-w-sm">{error}</p>
                        <button 
                          onClick={() => handleSearch(query)}
                          className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm"
                        >
                          Попробовать снова
                        </button>
                      </div>
                    </motion.div>
                  ) : result ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-10"
                    >
                      {/* AI Summary Card */}
                      <div className="bg-white border border-slate-100 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                        
                        <div className="flex items-center gap-3 mb-6 md:mb-8">
                          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <h2 className="text-lg md:text-xl font-black tracking-tight">AI Summary</h2>
                          <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
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
                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
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

                      {/* Detailed Explanation */}
                      <div className="space-y-8 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                              <Info className="w-5 h-5 text-primary" /> Возможные сценарии
                            </h3>
                            <ul className="space-y-3">
                              {result.detailedExplanation.scenarios.map((s, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0"></div>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-4">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2 text-red-600">
                              <AlertTriangle className="w-5 h-5" /> Красные флаги
                            </h3>
                            <ul className="space-y-3">
                              {result.detailedExplanation.redFlags.map((s, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-bold text-red-500">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0"></div>
                                  {s}
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

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 pt-6 md:pt-10">
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAction('doctor')}
                            className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-primary text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                          >
                            <Stethoscope className="w-4 h-4" /> Поговорить с врачом
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAction('consultation')}
                            className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                          >
                            <BrainCircuit className="w-4 h-4" /> ИИ Консультация
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAction('archive')}
                            className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center gap-2"
                          >
                            <Bookmark className="w-4 h-4" /> Сохранить в архив
                          </motion.button>
                        </div>
                      </div>

                      {/* Suggested Questions */}
                      <div className="space-y-4 px-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Уточняющие вопросы</label>
                        <div className="flex flex-wrap gap-3">
                          {result.suggestedQuestions.map((q, i) => (
                            <button 
                              key={i}
                              onClick={() => handleSearch(q)}
                              className="px-5 py-3 bg-slate-50 hover:bg-primary/5 hover:text-primary border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 transition-all text-left"
                            >
                              {q}
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
                        <h2 className="text-2xl font-black text-slate-900">Начните поиск здоровья</h2>
                        <p className="text-slate-500 font-medium max-w-sm">Введите симптомы, вопрос или тему, чтобы получить мгновенный AI-анализ и проверенные источники.</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Sources Column */}
              {result && (
                <aside className="w-full lg:w-80 space-y-8">
                  <div className="sticky top-32 space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Проверенные источники
                      </h3>
                      <div className="space-y-4">
                        {result.sources.map((source) => (
                          <motion.a 
                            key={source.id}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="block p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-full">
                                {source.sourceName}
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 mb-2 leading-tight group-hover:text-primary transition-colors">
                              {source.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3 line-clamp-2">
                              {source.summary}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <div className="flex gap-0.5">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className={`w-1 h-3 rounded-full ${i === 2 && source.trustLevel !== 'High' ? 'bg-slate-200' : 'bg-emerald-400'}`}></div>
                                ))}
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Доверие: {source.trustLevel === 'High' ? 'Высокое' : 'Среднее'}</span>
                            </div>
                          </motion.a>
                        ))}
                      </div>
                    </div>

                    {/* Trust Layer Info */}
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Info className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Medical Trust Layer</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        AI-ответы формируются на основе проверенных медицинских баз данных. Не является диагнозом. При необходимости обратитесь к врачу.
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
