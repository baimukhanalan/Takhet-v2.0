import React, { useState, useRef } from 'react';
import { UserRole, User } from '../types';
import { 
  ChevronRight, Sparkles, BrainCircuit, 
  Video, Truck, Archive, Stethoscope, 
  ChevronDown, Send, MessageSquare, Info, Activity, Dog, ArrowUpRight, Plus, Users, HeartPulse, Clock, ShieldAlert, AlertTriangle, Check,
  Search, FileText, Camera, Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import ComplianceFooter from '../components/ComplianceFooter';
import { useLanguage } from '../services/useLanguage';
import { FadeIn, FadeInStagger } from '../components/FadeIn';
import { startVoiceInput } from '../services/voiceInput';
import { roleApi } from '../../services/roleApi';

const LandingPage: React.FC<{ user?: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [heroQuery, setHeroQuery] = useState('');
  const [isHeroVoiceListening, setIsHeroVoiceListening] = useState(false);

  const faqItems = [
    {
      q: 'Что это за сервис и чем он отличается от обычных клиник?',
      a: 'Takhet+ — это единая платформа, где можно быстро понять своё состояние,\nполучить рекомендации и при необходимости сразу перейти к врачу.\n\nВместо “сначала записаться → потом разбираться”\nты сначала понимаешь ситуацию, а уже потом принимаешь решение.'
    },
    {
      q: 'Это надёжно? Я же не знаю, кто за этим стоит',
      a: 'Платформа построена вокруг реальной клинической базы и практикующих специалистов.\n\nТы не взаимодействуешь с “случайными людьми” —\nвсе врачи проходят проверку и работают в рамках системы.'
    },
    {
      q: 'Мне обязательно сразу платить и идти к врачу?',
      a: 'Нет.\n\nТы можешь начать бесплатно: разобраться в своём состоянии,\nпонять уровень проблемы и только потом решить,\nнужна ли консультация.'
    },
    {
      q: 'Насколько это вообще точно и полезно?',
      a: 'Сервис помогает структурировать состояние и снизить неопределённость.\n\nЭто не замена врачу, но даёт:\n— понимание, что происходит\n— какие риски есть\n— что делать дальше\n\nДля большинства людей этого уже достаточно, чтобы не откладывать решение.'
    },
    {
      q: 'В чём реальная польза для меня?',
      a: 'Ты экономишь время, деньги и нервы.\n\nВместо хаотичного поиска и ожидания:\n— быстро понимаешь ситуацию\n— не идёшь к “не тому” врачу\n— действуешь сразу\n\nИ самое главное — не остаёшься один на один с проблемой.'
    }
  ];

  const placeholders = [
    "болит горло и температура",
    "расшифровать анализ крови",
    "найти терапевта в Алматы",
    "что делать при ожоге",
    "симптомы дефицита витамина D"
  ];

  React.useEffect(() => {
    const currentText = placeholders[placeholderIndex];
    const typingSpeed = isDeleting ? 50 : 100;

    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentText.length) {
        setPlaceholder(currentText.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        setPlaceholder(currentText.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      } else if (!isDeleting && charIndex === currentText.length) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, placeholderIndex]);

  const handleCommonLogin = (pathname: string, role: UserRole = UserRole.PATIENT) => {
    navigate('/auth', { state: { role, from: { pathname }, forcePublicAuth: true } });
  };

  const handleTakhetAiLogin = () => {
    navigate('/takhet-ai/try');
  };

  const handleCTA = () => {
    handleCommonLogin('/dashboard');
  };

  const openHealthBrowser = (value?: string) => {
    const normalized = (value ?? heroQuery).trim();
    if (!normalized) return;
    navigate(`/health-browser?q=${encodeURIComponent(normalized)}`);
  };

  const handleHeroVoiceInput = () => {
    startVoiceInput({
      onStart: () => setIsHeroVoiceListening(true),
      onEnd: () => setIsHeroVoiceListening(false),
      onResult: (text) => {
        setHeroQuery(text);
        openHealthBrowser(text);
      }
    });
  };

  const handleQuickAction = (path: string) => {
    if (path === '/ai-consultation') {
      navigate('/ai-consultation');
      return;
    }

    if (path === '/takhet-ai') {
      handleTakhetAiLogin();
      return;
    }

    if (path.startsWith('/health-browser')) {
      navigate(path);
      return;
    }

    if (path === '/guest-consultation') {
      navigate('/guest-consultation');
      return;
    }

    if (path === '/doctors-search') {
      if (user?.role === UserRole.PATIENT) {
        navigate('/doctors-search');
      } else {
        handleCommonLogin(path);
      }
      return;
    }

    handleCommonLogin(path);
  };

  const handleFeedbackSubmit = async () => {
    const name = feedbackName.trim();
    const review = feedbackText.trim();
    if (!name || !review) {
      setFeedbackStatus('Заполните имя и текст отзыва.');
      return;
    }

    setFeedbackSending(true);
    setFeedbackStatus(null);
    try {
      await roleApi.publicFeedback({ name, review });
      setFeedbackName('');
      setFeedbackText('');
      setFeedbackStatus('Отзыв отправлен.');
    } catch {
      setFeedbackStatus('Не удалось отправить отзыв. Попробуйте ещё раз.');
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-white overflow-x-hidden">
      <PublicHeader activePath="/" />
      
      {/* 1. Hero Section - AI Health Browser */}
      <section className="takhet-patient-hero relative min-h-[100svh] pt-24 md:pt-40 xl:pt-48 pb-16 md:pb-24 px-4 md:px-10 xl:px-20 overflow-hidden bg-white flex flex-col justify-center md:block">
        <div className="max-w-5xl mx-auto text-center space-y-8 md:space-y-12 relative z-10 w-full">
          <FadeIn direction="up" delay={0.2}>
            <div className="space-y-4 md:space-y-6">
              <h1 className="takhet-patient-hero-title text-[40px] xs:text-[50px] sm:text-[80px] md:text-[110px] lg:text-[135px] font-black text-slate-900 tracking-tighter leading-[0.85] uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Takhet<span className="text-primary">+</span>
              </h1>
              <p className="takhet-patient-hero-text text-[13px] md:text-[18px] text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed px-4">
                Takhet+ — это цифровая медицинская платформа, где пациент быстрее получает помощь, а врач работает уже с подготовленным контекстом.
                <span className="hidden md:inline"> В одном месте соединены Takhet AI, консультации, запись к врачу и медицинский архив без разрыва между шагами.</span>
              </p>
            </div>
          </FadeIn>
          
          <FadeIn direction="up" delay={0.4}>
            <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
              {/* Main Search Bar */}
              <div className="relative group px-2 md:px-0">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000"></div>
                <div className="takhet-patient-hero-search relative flex items-center bg-white border-2 border-slate-200 rounded-[1.5rem] md:rounded-[2.5rem] p-1 md:p-2 shadow-2xl shadow-slate-200/50 group-focus-within:border-primary transition-all duration-500">
                  <div className="pl-4 md:pl-6 pr-2 md:pr-4">
                    <Search className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input 
                     type="text"
                     placeholder={placeholder}
                     value={heroQuery}
                     onChange={(event) => setHeroQuery(event.target.value)}
                     className="flex-1 py-4 md:py-6 bg-transparent border-none outline-none focus:ring-0 text-sm md:text-xl font-bold text-slate-900 placeholder:text-slate-300 min-w-0 pr-2"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         openHealthBrowser((e.target as HTMLInputElement).value);
                       }
                     }}
                   />
                   <button
                     type="button"
                     onClick={handleHeroVoiceInput}
                     className={`p-3 md:p-4 rounded-[1.2rem] md:rounded-[2rem] transition-colors shrink-0 ${
                       isHeroVoiceListening ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 hover:text-primary'
                     }`}
                     title="Голосовой ввод"
                   >
                     <Mic className="w-5 h-5 md:w-6 md:h-6" />
                   </button>
                   <button 
                     onClick={() => openHealthBrowser()}
                     className="p-3 md:p-4 bg-primary text-white rounded-[1.2rem] md:rounded-[2rem] hover:scale-105 transition-transform shadow-lg shadow-primary/20 shrink-0"
                   >
                     <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-2 max-w-4xl mx-auto">
                {[
                  { label: 'Записаться на консультацию', icon: Stethoscope, path: '/guest-consultation' },
                  { label: 'ИИ консультация', icon: BrainCircuit, path: '/ai-consultation' },
                  { label: 'Takhet AI', icon: Sparkles, path: '/takhet-ai' },
                  { label: 'Разобрать анализы', icon: FileText, path: '/ai-lab' },
                  { label: 'Мед архив', icon: Archive, path: '/archive' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.path)}
                    className="takhet-patient-hero-action px-4 md:px-6 py-2 md:py-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-primary/20 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                  >
                    <action.icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-soft"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-soft delay-1000"></div>
        </div>
      </section>

      {/* 2. Why Choose Us Section */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto space-y-20">
          <FadeIn direction="up">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-foreground">
                {t.landing.whyTitle}
              </h2>
              <div className="w-24 h-1.5 bg-primary mx-auto rounded-full"></div>
            </div>
          </FadeIn>

          <FadeInStagger>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {t.landing.whyCards.map((card: any, i: number) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="bg-white p-6 sm:p-8 md:p-12 h-full rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                    <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors relative z-10">{card.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed relative z-10">{card.desc}</p>
                    
                    {card.items && (
                      <ul className="space-y-4 font-bold text-slate-700 relative z-10">
                        {card.items.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs shrink-0 mt-1">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {card.grid && (
                      <div className="grid grid-cols-1 gap-4 font-bold text-slate-800 relative z-10">
                        {card.grid.map((item: string, idx: number) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-primary/20 hover:scale-[1.05] hover:translate-x-1 transition-all duration-300 cursor-default">
                            {item}
                          </div>
                        ))}
                      </div>
                    )}

                    {card.footer && (
                      <p className="text-primary font-black text-sm uppercase tracking-widest pt-4 relative z-10">{card.footer}</p>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeInStagger>
        </div>
      </section>

      {/* 3. Key Capabilities */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-white">
        <div className="max-w-7xl mx-auto space-y-24">
          <FadeIn direction="up">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-foreground">{t.landing.capabilitiesTitle}</h2>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Consultation */}
            <FadeIn direction="left">
              <div className="bg-slate-900 p-6 sm:p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white flex flex-col justify-between min-h-[360px] md:min-h-[400px] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl">
                 <div className="space-y-8 relative z-10">
                    <div className="w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center transition-transform duration-500 hover:rotate-12">
                      <Video className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black mb-4 tracking-tight">{t.landing.capConsultation.title}</h3>
                      <p className="text-slate-400 font-medium leading-relaxed">{t.landing.capConsultation.desc}</p>
                    </div>
                 </div>
                 <button 
                   onClick={handleCTA} 
                   className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest mt-10 hover:bg-primary hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                 >
                   {t.landing.capConsultation.btn}
                 </button>
                 <Video className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 group-hover:scale-125 group-hover:text-primary/10 transition-all duration-1000" />
              </div>
            </FadeIn>

            {/* Takhet AI Section */}
            <FadeIn direction="right">
              <div className="bg-slate-900 p-6 sm:p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white flex flex-col justify-between min-h-[360px] md:min-h-[400px] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl border border-white/10">
                 <div className="space-y-6 relative z-10">
                    <div className="w-20 h-20 bg-primary text-white rounded-[2.5rem] flex items-center justify-center transition-transform duration-500 shadow-lg shadow-primary/20 hover:scale-110 hover:rotate-[5deg]">
                      <BrainCircuit className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                        <Sparkles className="w-3 h-3" /> New
                      </div>
                      <h3 className="text-4xl font-black tracking-tight">Takhet AI</h3>
                    </div>
                    <p className="text-slate-400 font-medium leading-relaxed">Умный ассистент, который помогает разобрать симптомы, понять результаты анализов и выбрать следующий шаг без лишней тревоги.</p>
                    <div className="flex flex-wrap gap-2">
                      {['Симптомы', 'Анализы', 'Маршрут', 'Врачи'].map(tag => (
                        <span key={tag} className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 border border-white/5">{tag}</span>
                      ))}
                    </div>
                 </div>
                 <button 
                   onClick={handleTakhetAiLogin} 
                   className="w-full py-6 bg-primary text-white rounded-[2rem] font-black uppercase text-xs tracking-widest mt-10 hover:bg-white hover:text-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-primary/20"
                 >
                   Запустить Takhet AI
                 </button>
                 <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-1000"></div>
              </div>
            </FadeIn>
          </div>

          <FadeInStagger>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {t.landing.capSecondary.map((f: any, i: number) => {
                const Icon = i === 0 ? Stethoscope : HeartPulse;
                return (
                  <FadeIn key={i} delay={i * 0.1}>
                    <div className="bg-slate-50 p-10 h-full rounded-[3.5rem] space-y-6 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-primary/10 transition-all duration-500 group">
                      <Icon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-500" />
                      <h4 className="text-2xl font-black tracking-tight">{f.title}</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </FadeInStagger>
        </div>
      </section>

      {/* 4. Archive & Logistics */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-slate-950 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <FadeIn direction="left">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight">{t.landing.archiveTitle}</h2>
                <p className="text-slate-400 text-xl font-medium leading-relaxed">{t.landing.archiveDesc}</p>
              </div>
              <button 
                onClick={handleCTA} 
                className="px-12 py-6 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all duration-300"
              >
                {t.landing.archiveBtn}
              </button>
            </div>
          </FadeIn>

          <FadeInStagger>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {t.landing.logistics.map((item: any, i: number) => {
                const Icon = i === 0 ? Truck : i === 1 ? HeartPulse : i === 2 ? Activity : Dog;
                return (
                  <FadeIn key={i} delay={i * 0.1}>
                    <div className="bg-white/5 backdrop-blur-xl p-10 h-full rounded-[3rem] border border-white/10 space-y-6 hover:bg-white/10 transition-all duration-500 group">
                      <Icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                      <h4 className="text-xl font-black">{item.title}</h4>
                      <p className="text-slate-400 text-sm font-medium">{item.desc}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </FadeInStagger>
        </div>
      </section>

      {/* 5. Control Section */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-white">
        <FadeIn direction="up">
          <div className="max-w-4xl mx-auto bg-slate-50 p-14 md:p-24 rounded-[5rem] border border-slate-100 space-y-12 shadow-sm hover:shadow-2xl hover:scale-[1.01] transition-all duration-700">
             <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase text-center text-foreground leading-[1.1]">{t.landing.controlTitle}</h2>
             <p className="text-xl text-slate-500 font-medium text-center">{t.landing.controlSubtitle}</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {t.landing.controlItems.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 font-bold hover:border-primary/20 hover:translate-x-2 transition-all duration-300 cursor-default">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    {item}
                  </div>
                ))}
             </div>
          </div>
        </FadeIn>
      </section>

      {/* 6. Philosophy / Mission Block */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-primary/5">
        <div className="max-w-5xl mx-auto text-center space-y-12">
           <FadeIn direction="up">
             <div className="inline-block p-4 bg-white rounded-full shadow-xl mb-4">
                <Sparkles className="w-10 h-10 text-primary animate-spin-slow" />
             </div>
           </FadeIn>
           <FadeIn direction="up" delay={0.2}>
             <div className="bg-white p-12 md:p-20 rounded-[5rem] shadow-2xl border border-primary/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50"></div>
                <p className="text-3xl md:text-4xl lg:text-5xl text-slate-800 font-black leading-tight tracking-tighter relative z-10">
                  {t.landing.philosophy}
                </p>
             </div>
           </FadeIn>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-white">
        <div className="max-w-4xl mx-auto space-y-20">
          <FadeIn direction="up">
            <div className="text-center">
               <h2 className="text-5xl font-black tracking-tighter uppercase">{t.landing.faqTitle}</h2>
            </div>
          </FadeIn>
          <div className="space-y-6">
             {faqItems.map((item, i) => (
               <FadeIn key={i} delay={i * 0.1}>
                 <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-500">
                   <button 
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className={`w-full flex items-center justify-between p-10 text-left transition-all duration-500 ${activeFaq === i ? 'bg-primary text-white' : 'bg-white hover:bg-slate-50'}`}
                   >
                     <span className={`text-xl font-black ${activeFaq === i ? 'text-white' : 'text-slate-800'}`}>{item.q}</span>
                     <ChevronDown className={`w-7 h-7 transition-transform duration-500 ${activeFaq === i ? 'rotate-180 text-white' : 'text-primary'}`} />
                   </button>
                   {activeFaq === i && (
                     <div className="overflow-hidden">
                       <div className="p-10 pt-8 bg-slate-50 text-slate-600 text-lg font-medium leading-relaxed whitespace-pre-line">
                         {item.a}
                       </div>
                     </div>
                   )}
                 </div>
               </FadeIn>
             ))}
          </div>

          <FadeIn direction="up" delay={0.2}>
            <div className="rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 bg-slate-50 p-6 md:p-8 space-y-5">
              <div className="space-y-2 text-center">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Поделитесь опытом</h3>
                <p className="text-slate-500 font-medium text-sm md:text-base">Если вы уже пользовались платформой, оставьте короткий отзыв о консультации или сервисе.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[0.32fr_1fr] gap-3">
                <input
                  value={feedbackName}
                  onChange={(event) => setFeedbackName(event.target.value)}
                  placeholder="Ваше имя"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 outline-none font-bold text-slate-700"
                />
                <textarea
                  value={feedbackText}
                  onChange={(event) => setFeedbackText(event.target.value)}
                  placeholder="Напишите отзыв"
                  className="min-h-32 rounded-2xl border border-slate-200 bg-white px-5 py-4 outline-none font-medium text-slate-700 resize-y"
                />
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-sm font-bold text-slate-500">{feedbackStatus || 'Отзыв появится в рабочем контуре платформы после обработки.'}</div>
                <button
                  onClick={() => void handleFeedbackSubmit()}
                  disabled={feedbackSending}
                  className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-60"
                >
                  {feedbackSending ? 'Отправка...' : 'Отправить отзыв'}
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 8. Final Call to Action */}
      <section className="py-40 px-6 bg-slate-50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 opacity-30"></div>
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <FadeIn direction="up">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground uppercase">Takhet<span className="text-primary">+</span></h2>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <p className="text-3xl md:text-4xl font-bold text-slate-400 italic">{t.landing.finalCtaTitle}</p>
          </FadeIn>
          <FadeIn direction="up" delay={0.4}>
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-10">
              <button 
                onClick={handleCTA} 
                className="px-16 py-8 bg-primary text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300"
              >
                {t.landing.finalCtaReg}
              </button>
              <button 
                onClick={() => navigate('/ai-consultation')} 
                className="px-16 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
              >
                {t.landing.finalCtaConsult}
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 9. Footer */}
      <ComplianceFooter />
    </div>
  );
};

export default LandingPage;
