
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, UserRole, Doctor, TimeSlot } from '../types';
import { 
  HeartPulse, BrainCircuit, Search, Star, Filter, 
  ArrowUpRight, Clock, Wallet, UserCheck, MessageSquare, ChevronDown, 
  Sparkles, Leaf, Send, Loader2, User as UserIcon, HelpCircle, X, BookOpen, Award, Info, CheckCircle2, ChevronLeft, Calendar as CalendarIcon, ShieldAlert,
  Maximize2, Minimize2
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import { GoogleGenAI } from '@google/genai';
import { MockDB } from '../services/db';
import { translations, Language } from '../services/i18n';
import { useNavigate } from 'react-router-dom';

const SoulAssistant: React.FC<{ t: any; isPortal: boolean }> = ({ t, isPortal }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lock body scroll when expanded to prevent double scrolling
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isExpanded]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: 'You are the Soul Assistant on Takhet+. Provide gentle, empathetic mental support. Help users deal with stress.',
        },
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.text || t.mental.assistant.aiDefault }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: t.mental.assistant.aiDefault }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Logic for the requested "Fullscreen with frames" effect
  const containerStyle = isExpanded 
    ? "fixed inset-0 z-[10001] p-4 md:p-10 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center animate-in fade-in zoom-in duration-300"
    : "relative w-full animate-in zoom-in-95 duration-500";

  const cardStyle = isExpanded
    ? "w-full h-full bg-white rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden border border-white/20"
    : `bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col ${isPortal ? 'h-[500px]' : 'h-[600px]'}`;

  return (
    <div className={containerStyle}>
      <div className={cardStyle}>
        <div className="p-6 md:p-8 bg-gradient-to-r from-emerald-500 to-indigo-600 text-white flex items-center justify-between shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                 <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                 <h3 className="text-base md:text-xl font-black uppercase tracking-tighter">{t.mental.assistant.title}</h3>
                 <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-70">{t.mental.assistant.tag}</p>
              </div>
           </div>
           
           {/* Кнопка с рамками (Styled with borders as requested) */}
           <button 
             onClick={() => setIsExpanded(!isExpanded)}
             className="p-3 md:p-4 bg-white/10 hover:bg-white/20 border-2 border-white/40 rounded-2xl transition-all active:scale-90 flex items-center justify-center shadow-lg group"
             title={isExpanded ? "Свернуть" : "На весь экран"}
           >
             {isExpanded ? (
               <Minimize2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
             ) : (
               <Maximize2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
             )}
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-14 space-y-8 bg-slate-50/20 no-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40 py-20">
               <Sparkles className="w-12 h-12 md:w-20 md:h-20 text-emerald-500" />
               <p className="text-sm md:text-2xl font-bold max-w-xl leading-relaxed" dangerouslySetInnerHTML={{ __html: t.mental.assistant.placeholder }}></p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
              <div className={`max-w-[90%] md:max-w-[75%] p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm text-sm md:text-xl font-medium leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-4 p-4">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ассистент подбирает слова...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-6 md:p-14 border-t border-slate-100 bg-white shrink-0">
          <div className={`flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-[2.5rem] md:rounded-[6rem] p-2 pl-8 md:pl-14 transition-all focus-within:ring-8 focus-within:ring-emerald-500/5 ${isExpanded ? 'max-w-5xl mx-auto w-full' : ''}`}>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
              placeholder={t.mental.assistant.inputPlaceholder} 
              className="flex-1 bg-transparent border-none outline-none text-sm md:text-2xl font-bold py-4 md:py-8" 
            />
            <button 
              onClick={handleSend} 
              disabled={!input.trim() || isTyping} 
              className="w-12 h-12 md:w-24 md:h-24 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-600 hover:scale-105 active:scale-90 transition-all disabled:opacity-30"
            >
              <Send className="w-6 h-6 md:w-10 md:h-10" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MentalPage: React.FC<{ user?: User; isPortal: boolean }> = ({ user, isPortal }) => {
  const navigate = useNavigate();
  const [specialists, setSpecialists] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(today.toISOString().split('T')[0]);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const allDocs = MockDB.getDoctors();
    const mentalDocs = allDocs.filter(d => 
      d.specialty.toLowerCase().includes('психо') || 
      d.specialty.toLowerCase().includes('терапевт') ||
      d.specialty.toLowerCase().includes('psych') ||
      d.specialty.toLowerCase().includes('therapist')
    );
    setSpecialists(mentalDocs);
    setLang(MockDB.getLang());

    const handleUpdate = () => setLang(MockDB.getLang());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const t = translations[lang];

  const availableSlots = useMemo(() => {
    if (!selectedDoctor) return [];
    return MockDB.getDoctorSchedule(selectedDoctor.id, selectedDateStr);
  }, [selectedDoctor, selectedDateStr]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentYear, currentMonth, i));
    return days;
  }, [currentMonth, currentYear]);

  const monthName = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : lang === 'kz' ? 'kk-KZ' : 'en-US', { month: 'long' }).format(new Date(currentYear, currentMonth));

  const handleBookingStart = (doc: Doctor) => {
    if (!isPortal) {
      navigate('/auth', { state: { role: UserRole.PATIENT, mode: 'register' } });
      return;
    }
    setSelectedDoctor(doc);
  };

  const handleBookingConfirm = () => {
    if (!selectedDoctor || !selectedSlot) return;
    const result = MockDB.bookSlot(selectedDoctor.id, selectedDateStr, selectedSlot, user?.name || 'Guest');
    if (result) {
      setShowSuccess(true);
      setSelectedDoctor(null);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/appointments');
      }, 2000);
    }
  };

  return (
    <div className={!isPortal ? "min-h-screen bg-white" : ""}>
      {!isPortal && <PublicHeader activePath="/mental" />}

      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl">
          <div className="bg-white p-12 rounded-[4rem] text-center space-y-4 shadow-2xl">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto animate-bounce" />
            <h2 className="text-4xl font-black uppercase tracking-tighter">{lang === 'ru' ? 'Запись подтверждена' : lang === 'kz' ? 'Жазылу расталды' : 'Booking Confirmed'}</h2>
          </div>
        </div>
      )}

      {selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:min-h-[600px] md:flex-row relative">
            <button onClick={() => setSelectedDoctor(null)} className="absolute top-8 right-8 z-10 p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
            <div className="flex-1 overflow-y-auto p-14 space-y-10 no-scrollbar border-r border-slate-50 bg-slate-50/20">
               <div className="flex items-center gap-8">
                  <img src={selectedDoctor.avatar} className="w-32 h-32 rounded-[2.5rem] shadow-xl border-4 border-white" alt="" />
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedDoctor.name}</h2>
                    <p className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mt-1">{selectedDoctor.specialty}</p>
                    <div className="flex items-center gap-3 mt-5">
                       <div className="flex items-center gap-1.5 text-amber-500 px-4 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-black">{selectedDoctor.rating}</span>
                       </div>
                    </div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm"><span className="text-[10px] block text-slate-400 font-black tracking-widest uppercase mb-2">{t.mental.specialists.exp}</span><p className="font-black text-xl">{selectedDoctor.experience} {lang === 'en' ? 'years' : 'лет'}</p></div>
                  <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm"><span className="text-[10px] block text-slate-400 font-black tracking-widest uppercase mb-2">{t.mental.specialists.price}</span><p className="font-black text-xl">{selectedDoctor.pricePrimary}₸</p></div>
               </div>
            </div>
            
            <div className="w-full md:w-[480px] bg-white p-14 flex flex-col overflow-y-auto no-scrollbar">
               <h3 className="text-3xl font-black mb-10 flex items-center gap-4 uppercase tracking-tighter"><CalendarIcon className="w-8 h-8 text-indigo-500"/> {lang === 'ru' ? 'Выбор даты' : 'Күнді таңдау'}</h3>
               
               <div className="space-y-12 flex-1">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-xl font-black capitalize">{monthName} {currentYear}</h4>
                      <div className="flex gap-2">
                         <button onClick={() => setCurrentMonth(prev => prev - 1)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                         <button onClick={() => setCurrentMonth(prev => prev + 1)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors rotate-180"><ChevronLeft className="w-5 h-5"/></button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center">
                       {(lang === 'ru' ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] : lang === 'kz' ? ['Жк', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(d => (
                         <div key={d} className="text-[9px] font-black text-slate-300 uppercase py-2">{d}</div>
                       ))}
                       {calendarDays.map((date, idx) => {
                         if (!date) return <div key={`empty-${idx}`} />;
                         const dateStr = date.toISOString().split('T')[0];
                         const isSelected = selectedDateStr === dateStr;
                         const isPast = date < new Date(new Date().setHours(0,0,0,0));
                         
                         return (
                           <button
                             key={dateStr}
                             disabled={isPast}
                             onClick={() => { setSelectedDateStr(dateStr); setSelectedSlot(null); }}
                             className={`aspect-square flex items-center justify-center rounded-2xl text-sm font-black transition-all
                               ${isSelected ? 'bg-slate-900 text-white shadow-xl scale-110' : 
                                 isPast ? 'text-slate-100 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                           >
                             {date.getDate()}
                           </button>
                         );
                       })}
                    </div>
                  </div>

                  <div className="space-y-6">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">{lang === 'ru' ? 'Доступные слоты' : 'Қолжетімді уақыттар'}</p>
                     <div className="grid grid-cols-3 gap-3">
                        {availableSlots.map(s => (
                          <button 
                            key={s.id} 
                            disabled={s.isBooked} 
                            onClick={() => setSelectedSlot(s.id)} 
                            className={`py-4 rounded-2xl text-xs font-black border-2 transition-all ${s.isBooked ? 'bg-slate-50 text-slate-200 border-transparent' : selectedSlot === s.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                          >
                            {s.time}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
               
               <button onClick={handleBookingConfirm} disabled={!selectedSlot} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl mt-12 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none">Подтвердить запись</button>
            </div>
          </div>
        </div>
      )}
      
      <main className={`max-w-7xl mx-auto px-4 ${!isPortal ? 'pt-44 pb-32 space-y-40' : 'pt-4 space-y-20'}`}>
        
        {/* PUBLIC: Information & Soul Assistant */}
        {!isPortal ? (
          <>
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-10 text-center lg:text-left">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-100">
                  <Sparkles className="w-4 h-4" /> {t.mental.heroTag}
                </div>
                <h1 className="text-6xl md:text-8xl font-black text-slate-950 leading-[0.85] tracking-tighter uppercase">{t.mental.heroTitle} <br/><span className="text-emerald-500 italic lowercase font-normal">{t.mental.heroSubtitle}</span></h1>
                <p className="text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">{t.mental.heroDesc}</p>
                <button 
                  onClick={() => navigate('/auth', { state: { role: UserRole.PATIENT, mode: 'register' } })}
                  className="px-12 py-6 bg-slate-950 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-primary transition-all"
                >
                  Начать терапию
                </button>
              </div>
              <SoulAssistant t={t} isPortal={false} />
            </section>

            <section className="bg-slate-50 rounded-[5rem] p-16 md:p-24 grid grid-cols-1 md:grid-cols-2 gap-20 overflow-hidden border border-slate-100 shadow-sm">
              <div className="space-y-12">
                <h2 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">Психолог или <br/>Психотерапевт?</h2>
                <div className="space-y-10">
                  <div className="p-10 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4 group hover:border-emerald-200 transition-all">
                    <h4 className="text-2xl font-black text-emerald-600 uppercase tracking-tight">Психолог</h4>
                    <p className="text-slate-500 text-base leading-relaxed font-medium">Работает с качеством жизни, отношениями и самооценкой. Не назначает препараты.</p>
                  </div>
                  <div className="p-10 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4 group hover:border-indigo-200 transition-all">
                    <h4 className="text-2xl font-black text-indigo-600 uppercase tracking-tight">Психотерапевт</h4>
                    <p className="text-slate-500 text-base leading-relaxed font-medium">Врач, лечащий депрессию, тревожность и травмы. Может использовать фармакотерапию.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center text-center space-y-8 p-12 bg-white rounded-[4rem] border border-slate-100">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 animate-pulse"><ShieldAlert className="w-12 h-12" /></div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Сигнал SOS</h3>
                <p className="text-lg font-bold text-slate-600 leading-relaxed italic">"Если апатия длится более 2 недель или возникают мысли о вреде себе — помощь нужна немедленно."</p>
                <div className="h-px w-20 bg-slate-100"></div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-loose">Единый номер поддержки: 150 <br/>(звонок бесплатный)</p>
              </div>
            </section>
          </>
        ) : (
          /* PORTAL: Booking focus & Mini Soul Assistant */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-16">
              <div className="space-y-6">
                 <h2 className="text-4xl font-black tracking-tight uppercase text-slate-900">{t.mental.specialists.title}</h2>
                 <p className="text-lg text-slate-400 font-medium">{t.mental.specialists.desc}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {specialists.map(s => (
                  <div key={s.id} onClick={() => handleBookingStart(s)} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col hover:-translate-y-1">
                     <div className="flex items-center gap-6 mb-10">
                       <div className="w-20 h-20 rounded-[2rem] overflow-hidden shadow-md border-2 border-white shrink-0 group-hover:scale-105 transition-transform">
                          <img src={s.avatar} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div className="min-w-0">
                         <h4 className="font-black text-xl truncate leading-tight text-slate-900">{s.name}</h4>
                         <p className="text-[9px] font-black text-indigo-600 uppercase mt-1 tracking-widest">{s.specialty}</p>
                         <div className="flex items-center gap-1 text-amber-500 mt-2">
                           <Star className="w-3 h-3 fill-current" />
                           <span className="text-xs font-black">{s.rating}</span>
                         </div>
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3 flex-1">
                       <div className="p-5 bg-slate-50 rounded-3xl text-center"><span className="text-[8px] font-black text-slate-400 block uppercase mb-1">{t.mental.specialists.exp}</span><p className="font-black text-base">{s.experience} {lang === 'en' ? 'yrs' : 'лет'}</p></div>
                       <div className="p-5 bg-slate-50 rounded-3xl text-center"><span className="text-[8px] font-black text-slate-400 block uppercase mb-1">{t.mental.specialists.price}</span><p className="font-black text-base">{s.pricePrimary}₸</p></div>
                     </div>
                     <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest mt-8 group-hover:bg-indigo-600 shadow-lg transition-all">{t.mental.specialists.cta}</button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-4 h-fit sticky top-24">
              <SoulAssistant t={t} isPortal={true} />
              <div className="mt-8 p-8 bg-slate-950 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-indigo-500/10 animate-pulse-soft"></div>
                 <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><HeartPulse className="w-6 h-6 text-indigo-400" /></div>
                    <h4 className="text-xl font-black uppercase tracking-tight leading-tight">Ведение терапии</h4>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">Система автоматически напомнит о сессии и сохранит ваши заметки в зашифрованном архиве.</p>
                 </div>
                 <button className="w-full py-4 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest relative z-10">Проверить календарь</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MentalPage;
