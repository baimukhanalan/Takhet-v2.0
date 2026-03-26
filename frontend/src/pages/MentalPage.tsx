import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, Sparkles, Send, Star, Clock, 
  ChevronRight, ShieldAlert, X, Calendar as CalendarIcon, 
  ChevronLeft, CheckCircle2, Maximize2, Minimize2,
  Users, BarChart3, AlertCircle, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { User, Doctor, UserRole } from '../types';
import { MockDB } from '../services/db';
import { useLanguage } from '../services/useLanguage';
import PublicHeader from '../components/PublicHeader';
import { FadeIn } from '../components/FadeIn';

const SoulAssistant: React.FC<{ t: any; isPortal: boolean }> = ({ t, isPortal }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          systemInstruction: 'Вы — Душевный Ассистент в Takhet+. Оказывайте мягкую, эмпатичную психологическую поддержку. Помогайте пользователям справляться со стрессом, тревожностью и одиночеством. Используйте теплый, поддерживающий тон. Отвечайте на русском языке.',
        },
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.text || t.mental.assistant.aiDefault }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: t.mental.assistant.aiDefault }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={isExpanded ? "fixed inset-0 z-[10001] p-4 md:p-10 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center" : "relative w-full"}>
      <motion.div 
        layout
        className={isExpanded
          ? "w-full h-full bg-white rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-white/20"
          : `bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col ${isPortal ? 'h-[600px]' : 'h-[700px]'}`}
      >
        <div className="p-8 md:p-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="flex items-center gap-6 relative z-10">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur-2xl rounded-3xl flex items-center justify-center border border-white/30 shadow-xl">
                 <BrainCircuit className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                 <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">{t.mental.assistant.title}</h3>
                 <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] opacity-80 mt-1.5">{t.mental.assistant.tag}</p>
              </div>
           </div>
           
           <motion.button 
             whileHover={{ scale: 1.1, rotate: 90 }}
             whileTap={{ scale: 0.9 }}
             onClick={() => setIsExpanded(!isExpanded)}
             className="p-4 md:p-5 bg-white/10 hover:bg-white/20 border-2 border-white/40 rounded-3xl transition-all flex items-center justify-center shadow-xl group relative z-10"
           >
             {isExpanded ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
           </motion.button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 md:p-16 space-y-10 bg-slate-50/30 no-scrollbar">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-10 py-20"
              >
                 <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center relative">
                    <Sparkles className="w-16 h-16 text-emerald-500 animate-pulse" />
                    <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping"></div>
                 </div>
                 <div className="space-y-4 max-w-xl">
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight">Я здесь, чтобы выслушать</h4>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: t.mental.assistant.placeholder }}></p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] md:max-w-[80%] p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-sm text-base md:text-2xl font-medium leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-6 p-6"
            >
              <div className="flex gap-1.5">
                 <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-emerald-500 rounded-full" />
                 <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-emerald-500 rounded-full" />
                 <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-emerald-500 rounded-full" />
              </div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Душевный ассистент печатает...</span>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>
        <div className="p-8 md:p-16 border-t border-slate-100 bg-white shrink-0">
          <div className={`flex items-center gap-6 bg-slate-50 border-2 border-slate-50 rounded-[3rem] md:rounded-[6rem] p-3 pl-10 md:pl-16 transition-all focus-within:ring-8 focus-within:ring-emerald-500/5 focus-within:bg-white focus-within:border-emerald-100 ${isExpanded ? 'max-w-6xl mx-auto w-full' : ''}`}>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
              placeholder={t.mental.assistant.inputPlaceholder} 
              className="flex-1 bg-transparent border-none outline-none text-base md:text-3xl font-bold py-6 md:py-10 placeholder:text-slate-300" 
            />
            <motion.button 
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend} 
              disabled={!input.trim() || isTyping} 
              className="w-16 h-16 md:w-28 md:h-28 bg-slate-950 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-600 transition-all disabled:opacity-30"
            >
              <Send className="w-8 h-8 md:w-12 md:h-12" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const MentalPage: React.FC<{ user?: User; isPortal: boolean }> = ({ user, isPortal }) => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [specialists, setSpecialists] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
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
  }, []);

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
    const result = MockDB.bookSlot(selectedDoctor.id, selectedDateStr, selectedSlot, user?.id || 'guest-id', user?.name || 'Guest');
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
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${!isPortal ? 'pt-0' : 'pt-0 pb-40'}`}>
      {!isPortal && <PublicHeader activePath="/mental" />}
      
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-100/30 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-100/30 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10005] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white p-16 rounded-[5rem] text-center space-y-8 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/20"
            >
              <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto relative">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping"></div>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
                  {lang === 'ru' ? 'Запись подтверждена' : lang === 'kz' ? 'Жазылу расталды' : 'Booking Confirmed'}
                </h2>
                <p className="text-slate-500 font-medium text-lg">Мы отправили детали на вашу почту и в календарь.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoctor(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              className="relative w-full max-w-6xl bg-white rounded-[5rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh] border border-white/20"
            >
              <div className="w-full md:w-[420px] bg-slate-900 text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden shrink-0">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                 <div className="relative z-10 space-y-8 md:space-y-12">
                    <button onClick={() => setSelectedDoctor(null)} className="p-4 md:p-5 bg-white/10 hover:bg-white/20 rounded-2xl md:rounded-3xl transition-all border border-white/10 w-fit">
                       <X className="w-6 h-6 md:w-7 md:h-7" />
                    </button>
                    <div className="space-y-4 md:space-y-6">
                       <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none break-words">Запись на <br className="hidden md:block"/>сессию</h2>
                       <p className="text-slate-400 font-medium text-base md:text-xl leading-relaxed">Выберите удобное время для глубокой работы с вашим специалистом.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 p-6 md:p-8 bg-white/5 rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl min-w-0">
                       <img src={selectedDoctor.avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl object-cover border-2 border-white/20 shadow-xl shrink-0" referrerPolicy="no-referrer" />
                       <div className="min-w-0">
                          <h4 className="text-lg md:text-xl font-black uppercase tracking-tight leading-none mb-2 break-words">{selectedDoctor.name}</h4>
                          <p className="text-emerald-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] break-words">{selectedDoctor.specialty}</p>
                       </div>
                    </div>
                 </div>
                 <div className="relative z-10 pt-8 md:pt-12 border-t border-white/10 mt-8 md:mt-12">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                       <span className="text-slate-400 font-black uppercase tracking-[0.3em] text-[11px]">Стоимость</span>
                       <span className="text-3xl md:text-4xl font-black text-emerald-400 break-words">{selectedDoctor.pricePrimary} ₸</span>
                    </div>
                 </div>
              </div>

              <div className="flex-1 p-12 md:p-20 overflow-y-auto no-scrollbar space-y-16 bg-white">
                 <div className="space-y-10">
                    <div className="flex items-center justify-between gap-4">
                       <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3 md:gap-4 break-words">
                          <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 shrink-0" />
                          <span className="break-words">{monthName} {currentYear}</span>
                       </h3>
                       <div className="flex gap-2 md:gap-3 shrink-0">
                          <button onClick={() => setCurrentMonth(prev => prev - 1)} className="p-3 md:p-4 bg-slate-50 hover:bg-emerald-500 hover:text-white rounded-xl md:rounded-2xl transition-all shadow-sm"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6"/></button>
                          <button onClick={() => setCurrentMonth(prev => prev + 1)} className="p-3 md:p-4 bg-slate-50 hover:bg-emerald-500 hover:text-white rounded-xl md:rounded-2xl transition-all shadow-sm rotate-180"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6"/></button>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-3 text-center">
                       {(lang === 'ru' ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] : lang === 'kz' ? ['Жк', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(d => (
                         <div key={d} className="text-[10px] font-black text-slate-300 uppercase py-2 tracking-widest">{d}</div>
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
                             className={`aspect-square flex items-center justify-center rounded-[1.5rem] text-lg font-black transition-all relative group
                               ${isSelected ? 'text-white' : 
                                 isPast ? 'text-slate-100 cursor-not-allowed' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                           >
                             {isSelected && (
                               <motion.div 
                                 layoutId="selectedDate"
                                 className="absolute inset-0 bg-slate-950 shadow-2xl rounded-[1.5rem]"
                                 transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                               />
                             )}
                             <span className="relative z-10">{date.getDate()}</span>
                           </button>
                         );
                       })}
                    </div>
                 </div>

                 <div className="space-y-10">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                       <Clock className="w-8 h-8 text-emerald-500" />
                       Доступное время
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                       {availableSlots.map(s => (
                          <button
                             key={s.id}
                             disabled={s.isBooked}
                             onClick={() => setSelectedSlot(s.id)}
                             className={`py-6 rounded-[2rem] font-black text-[11px] tracking-[0.2em] transition-all border-2 relative overflow-hidden group ${
                                s.isBooked 
                                ? 'bg-slate-50 border-slate-50 text-slate-200 cursor-not-allowed' 
                                : selectedSlot === s.id 
                                ? 'text-white border-emerald-500 shadow-2xl' 
                                : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/30'
                             }`}
                          >
                             {selectedSlot === s.id && (
                                <motion.div 
                                   layoutId="selectedSlot"
                                   className="absolute inset-0 bg-emerald-500"
                                   transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                             )}
                             <span className="relative z-10">{s.time}</span>
                          </button>
                       ))}
                    </div>
                 </div>

                 <motion.button 
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!selectedSlot}
                    onClick={handleBookingConfirm}
                    className="w-full py-6 md:py-8 bg-slate-950 text-white rounded-[2rem] md:rounded-[2.5rem] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[8px] md:text-[11px] hover:bg-emerald-600 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.2)] disabled:opacity-30 disabled:cursor-not-allowed mt-8 md:mt-12 break-words px-4"
                 >
                    Подтвердить и забронировать
                 </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <main className={`max-w-[1600px] mx-auto px-6 md:px-12 relative z-10 ${!isPortal ? 'pt-44 pb-32 space-y-48' : 'pt-12 pb-24 space-y-32'}`}>
        
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-12">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              <div className="inline-flex items-center gap-4 px-8 py-3 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-black uppercase tracking-[0.3em] border border-emerald-200 shadow-sm">
                <Sparkles className="w-5 h-5" /> {t.mental.heroTag}
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-950 leading-[0.9] tracking-tighter uppercase break-words">
                {t.mental.heroTitle} <br/>
                <span className="text-emerald-500 italic lowercase font-normal break-words">{t.mental.heroSubtitle}</span>
              </h1>
              <p className="text-2xl md:text-3xl text-slate-500 max-w-2xl font-medium leading-relaxed">
                {t.mental.heroDesc}
              </p>
              {!isPortal && (
                <motion.button 
                  whileHover={{ scale: 1.05, x: 10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/auth', { state: { role: UserRole.PATIENT, mode: 'register' } })}
                  className="px-16 py-8 bg-slate-950 text-white rounded-[3rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-[0_30px_60px_rgba(0,0,0,0.2)] hover:bg-emerald-600 transition-all flex items-center gap-4 group"
                >
                  Начать терапию <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </motion.button>
              )}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-10 bg-white rounded-[4rem] border border-slate-100 shadow-xl space-y-6 group hover:border-emerald-200 transition-all">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                     <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">100+ Специалистов</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Лучшие психологи и психотерапевты, прошедшие строгий отбор.</p>
               </div>
               <div className="p-10 bg-white rounded-[4rem] border border-slate-100 shadow-xl space-y-6 group hover:border-indigo-200 transition-all">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                     <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Полная анонимность</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Ваши данные и сессии защищены сквозным шифрованием.</p>
               </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <SoulAssistant t={t} isPortal={isPortal} />
          </div>
        </section>

        {/* Specialists Section */}
        <section className="space-y-20">
           <div className="flex flex-col md:flex-row justify-between items-end gap-12">
              <div className="space-y-6">
                 <h2 className="text-6xl md:text-8xl font-black text-slate-950 tracking-tighter uppercase leading-none break-words">
                    Наши <span className="text-emerald-500 italic">проводники</span>
                 </h2>
                 <p className="text-2xl text-slate-500 font-medium max-w-3xl">
                    Выберите специалиста, который поможет вам найти путь к внутреннему балансу и гармонии.
                 </p>
              </div>
              <div className="hidden md:block text-right space-y-2">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Доступно сейчас</p>
                 <p className="text-5xl font-black text-slate-950">{specialists.length}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {specialists.map((s, i) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -20 }}
                  onClick={() => handleBookingStart(s)} 
                  className="bg-white rounded-[5rem] border border-slate-100 shadow-2xl overflow-hidden cursor-pointer group flex flex-col relative"
                >
                   <div className="relative h-[450px] overflow-hidden">
                      <img 
                        src={s.avatar} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                        alt={s.name} 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-12 space-y-6">
                         <p className="text-white/80 text-lg font-medium leading-relaxed italic">"Помогаю найти внутреннюю опору и справиться с выгоранием, используя методы КПТ и гештальт-терапии."</p>
                         <div className="flex flex-wrap gap-3">
                            {['КПТ', 'Гештальт', 'ЭОТ'].map(tag => (
                               <span key={tag} className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/20">{tag}</span>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="p-8 md:p-12 flex-1 flex flex-col space-y-6 md:space-y-8">
                      <div>
                         <h4 className="text-2xl md:text-3xl font-black text-slate-950 uppercase tracking-tight leading-none group-hover:text-emerald-600 transition-colors break-words">{s.name}</h4>
                         <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] break-words">{s.specialty}</p>
                      </div>

                      <div className="flex items-center justify-between py-6 md:py-8 border-y border-slate-50">
                         <div className="flex items-center gap-3 md:gap-4 text-slate-500 min-w-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
                               <Clock className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest break-words">Ближайшее</p>
                               <p className="text-xs md:text-sm font-black text-slate-900 break-words">Сегодня, 16:00</p>
                            </div>
                         </div>
                         <div className="text-right shrink-0">
                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Сессия</p>
                            <p className="text-2xl md:text-3xl font-black text-emerald-600 tracking-tighter">{s.pricePrimary} ₸</p>
                         </div>
                      </div>

                      <button className="w-full py-5 md:py-7 bg-slate-950 text-white rounded-[2rem] md:rounded-[3rem] font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-2xl group-hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 md:gap-4 mt-auto">
                         <span className="break-words">Записаться на сессию</span> <ChevronRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform shrink-0" />
                      </button>
                   </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* SOS & Info Section */}
        <section className="bg-slate-950 rounded-[6rem] p-16 md:p-32 grid grid-cols-1 lg:grid-cols-2 gap-24 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px] -mr-[400px] -mt-[400px]"></div>
           <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] -ml-[300px] -mb-[300px]"></div>
           
           <div className="relative z-10 space-y-16">
              <div className="space-y-8">
                 <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.85] break-words">
                    Понимать <br/>разницу
                 </h2>
                 <p className="text-2xl text-slate-400 font-medium max-w-xl leading-relaxed">
                    Знание того, к кому обратиться — первый шаг к выздоровлению.
                 </p>
              </div>

              <div className="space-y-8">
                 <div className="p-12 bg-white/5 backdrop-blur-xl rounded-[4rem] border border-white/10 space-y-6 group hover:bg-white/10 transition-all">
                    <h4 className="text-3xl font-black text-emerald-400 uppercase tracking-tight">Психолог</h4>
                    <p className="text-slate-300 text-xl leading-relaxed font-medium">Работает с качеством жизни, отношениями и самооценкой. Помогает найти ресурсы и цели. Не является врачом.</p>
                 </div>
                 <div className="p-12 bg-white/5 backdrop-blur-xl rounded-[4rem] border border-white/10 space-y-6 group hover:bg-white/10 transition-all">
                    <h4 className="text-3xl font-black text-indigo-400 uppercase tracking-tight">Психотерапевт</h4>
                    <p className="text-slate-300 text-xl leading-relaxed font-medium">Врач, специализирующийся на лечении депрессии, тревожности и травм. Может использовать фармакотерапию.</p>
                 </div>
              </div>
           </div>

           <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-12 p-16 bg-white/5 backdrop-blur-2xl rounded-[5rem] border border-white/10 shadow-2xl">
              <motion.div 
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-32 h-32 bg-red-500/20 rounded-[3rem] flex items-center justify-center text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]"
              >
                <ShieldAlert className="w-16 h-16" />
              </motion.div>
              <div className="space-y-6">
                 <h3 className="text-4xl font-black uppercase tracking-tighter text-white">Линия поддержки</h3>
                 <p className="text-2xl font-bold text-slate-300 leading-relaxed italic max-w-md">"Если вам кажется, что выхода нет — помните, вы не одни. Помощь всегда рядом."</p>
              </div>
              <div className="h-px w-32 bg-white/10"></div>
              <div className="space-y-4">
                 <p className="text-[12px] font-black uppercase text-slate-400 tracking-[0.5em]">Единый номер (РК)</p>
                 <p className="text-6xl font-black text-white tracking-tighter">150</p>
                 <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em]">Бесплатно • Круглосуточно • Анонимно</p>
              </div>
              <button className="px-12 py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-red-700 transition-all shadow-2xl">
                 Позвонить сейчас
              </button>
           </div>
        </section>

        {isPortal && (
           <section className="p-16 bg-white rounded-[5rem] border border-slate-100 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex items-center gap-10">
                 <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center shrink-0">
                    <BarChart3 className="w-12 h-12 text-emerald-500" />
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-3xl font-black text-slate-950 uppercase tracking-tight">Ваш ментальный путь</h4>
                    <p className="text-lg text-slate-500 font-medium">Вы посетили 4 сессии в этом месяце. Ваш уровень баланса вырос на 15%.</p>
                 </div>
              </div>
              <div className="w-full md:w-96 space-y-4">
                 <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <span>Прогресс</span>
                    <span className="text-emerald-500">85%</span>
                 </div>
                 <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: '85%' }}
                       className="h-full bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    />
                 </div>
              </div>
           </section>
        )}
      </main>
    </div>
  );
};

export default MentalPage;
