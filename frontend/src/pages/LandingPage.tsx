import React, { useState, useRef } from 'react';
import { UserRole, User } from '../types';
import { 
  ChevronRight, Sparkles, BrainCircuit, 
  Video, Truck, Archive, Stethoscope, 
  ChevronDown, Send, MessageSquare, Info, Activity, Dog, ArrowUpRight, Plus, Users, HeartPulse, Clock, ShieldAlert, AlertTriangle,
  Search, FileText, Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import TakhetLogo from '../components/Logo';
import { useLanguage } from '../services/useLanguage';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn, FadeInStagger } from '../components/FadeIn';

const Health3DMatrix = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setPos({ x: x * 0.8, y: y * 0.8 });
  };

  const handleMouseLeave = () => {
    setPos({ x: 0, y: 0 });
  };

  return (
    <motion.div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="relative w-full aspect-square flex items-center justify-center perspective-[2000px] cursor-pointer"
    >
      <motion.div 
        animate={{ 
          rotateX: pos.y * 25, 
          rotateY: pos.x * 25 
        }}
        transition={{ type: "spring", damping: 20, stiffness: 40 }}
        className="relative w-72 h-72 md:w-[450px] md:h-[450px] preserve-3d" 
      >
        <div className="absolute inset-0 rounded-[5rem] bg-primary/20 blur-[120px] animate-pulse-soft"></div>
        {[...Array(3)].map((_, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, z: 0, scale: 0.9 + i * 0.05 }}
            animate={{ opacity: 1, z: (i + 1) * 30 }}
            transition={{ delay: i * 0.2 + 0.5, duration: 1 }}
            className="absolute inset-0 border border-primary/10 rounded-[4.5rem] bg-white/5 backdrop-blur-[2px]" 
          ></motion.div>
        ))}
        <motion.div 
          initial={{ opacity: 0, z: 0 }}
          animate={{ opacity: 1, z: 100 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute inset-[15%] bg-white rounded-[4rem] shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white z-50 group hover:shadow-primary/20 transition-all duration-500"
        >
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
           <TakhetLogo className="w-40 h-40 md:w-60 md:h-60 animate-pulse-soft transition-transform duration-700 group-hover:scale-110" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const LandingPage: React.FC<{ user?: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleCTA = () => {
    if (user?.role === UserRole.PATIENT) navigate('/takhet-ai');
    else if (user) navigate('/dashboard');
    else navigate('/patient-auth');
  };

  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-white overflow-x-hidden">
      <PublicHeader activePath="/" />
      
      {/* 1. Hero Section - AI Health Browser */}
      <section className="relative pt-24 md:pt-48 pb-16 md:pb-24 px-4 md:px-20 overflow-hidden bg-white">
        <div className="max-w-5xl mx-auto text-center space-y-8 md:space-y-12 relative z-10">
          <FadeIn direction="up" delay={0.2}>
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-[40px] xs:text-[50px] sm:text-[80px] md:text-[110px] lg:text-[135px] font-black text-slate-900 tracking-tighter leading-[0.85] uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Takhet<span className="text-primary">+</span>
              </h1>
              <p className="text-[13px] md:text-[18px] text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed px-4">
                Takhet+ — это полноценная телемедицинская экосистема, объединяющая ИИ-диагностику, видеоконсультации с врачами и цифровой медицинский архив. Мы помогаем пациентам получать квалифицированную помощь быстрее, а врачам — принимать точные решения на основе данных.
              </p>
            </div>
          </FadeIn>
          
          <FadeIn direction="up" delay={0.4}>
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Main Search Bar */}
              <div className="relative group px-2 md:px-0">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000"></div>
                <div className="relative flex items-center bg-white border-2 border-slate-200 rounded-[1.5rem] md:rounded-[2.5rem] p-1 md:p-2 shadow-2xl shadow-slate-200/50 group-focus-within:border-primary transition-all duration-500">
                  <div className="pl-4 md:pl-6 pr-2 md:pr-4">
                    <Search className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input 
                    type="text"
                    placeholder={placeholder}
                    className="flex-1 py-4 md:py-6 bg-transparent border-none outline-none focus:ring-0 text-base md:text-xl font-bold text-slate-900 placeholder:text-slate-300 min-w-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        navigate(`/health-browser?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.querySelector('input') as HTMLInputElement;
                      if (input.value) navigate(`/health-browser?q=${encodeURIComponent(input.value)}`);
                    }}
                    className="p-3 md:p-4 bg-primary text-white rounded-[1.2rem] md:rounded-[2rem] hover:scale-105 transition-transform shadow-lg shadow-primary/20"
                  >
                    <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-2">
                {[
                  { label: 'Записаться на консультацию', icon: Stethoscope, path: '/doctors-search' },
                  { label: 'ИИ Консультация', icon: BrainCircuit, path: '/ai-consultation' },
                  { label: 'Takhet AI', icon: Sparkles, path: '/takhet-ai' },
                  { label: 'Расшифровка анализов', icon: FileText, path: '/health-browser?q=расшифровать анализы' },
                  { label: 'Мед архив', icon: Archive, path: '/auth' },
                ].map((action, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (action.label === 'Записаться на консультацию') {
                        user ? navigate('/doctors-search') : navigate('/auth');
                      } else if (action.label === 'ИИ Консультация') {
                        navigate('/ai-consultation');
                      } else if (action.label === 'Takhet AI') {
                        user ? navigate('/takhet-ai') : navigate('/patient-auth');
                      } else if (action.label === 'Мед архив') {
                        navigate('/auth');
                      } else {
                        navigate(action.path);
                      }
                    }}
                    className="px-4 md:px-6 py-2 md:py-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-primary/20 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all shadow-sm hover:shadow-md flex items-center gap-2 whitespace-nowrap"
                  >
                    <action.icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    {action.label}
                  </motion.button>
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
      <section className="py-32 px-6 md:px-20 bg-slate-50 relative overflow-hidden">
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
                  <motion.div 
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="bg-white p-12 h-full rounded-[4rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                    <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors relative z-10">{card.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed relative z-10">{card.desc}</p>
                    
                    {card.items && (
                      <ul className="space-y-4 font-bold text-slate-700 relative z-10">
                        {card.items.map((item: string, idx: number) => (
                          <motion.li 
                            key={idx} 
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 + 0.5 }}
                            className="flex items-start gap-3"
                          >
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs shrink-0 mt-1">✓</div>
                            <span>{item}</span>
                          </motion.li>
                        ))}
                      </ul>
                    )}

                    {card.grid && (
                      <div className="grid grid-cols-1 gap-4 font-bold text-slate-800 relative z-10">
                        {card.grid.map((item: string, idx: number) => (
                          <motion.div 
                            key={idx} 
                            whileHover={{ scale: 1.05, x: 5 }}
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-primary/20 transition-all cursor-default"
                          >
                            {item}
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {card.footer && (
                      <p className="text-primary font-black text-sm uppercase tracking-widest pt-4 relative z-10">{card.footer}</p>
                    )}
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </FadeInStagger>
        </div>
      </section>

      {/* 3. Key Capabilities */}
      <section className="py-32 px-6 md:px-20 bg-white">
        <div className="max-w-7xl mx-auto space-y-24">
          <FadeIn direction="up">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-foreground">{t.landing.capabilitiesTitle}</h2>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Consultation */}
            <FadeIn direction="left">
              <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col justify-between min-h-[400px] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl">
                 <div className="space-y-8 relative z-10">
                    <motion.div 
                      whileHover={{ rotate: 12 }}
                      className="w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center transition-transform duration-500"
                    >
                      <Video className="w-10 h-10" />
                    </motion.div>
                    <div>
                      <h3 className="text-3xl font-black mb-4 tracking-tight">{t.landing.capConsultation.title}</h3>
                      <p className="text-slate-400 font-medium leading-relaxed">{t.landing.capConsultation.desc}</p>
                    </div>
                 </div>
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={handleCTA} 
                   className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest mt-10 hover:bg-primary hover:text-white transition-all duration-300"
                 >
                   {t.landing.capConsultation.btn}
                 </motion.button>
                 <Video className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 group-hover:scale-125 group-hover:text-primary/10 transition-all duration-1000" />
              </div>
            </FadeIn>

            {/* Takhet AI Section */}
            <FadeIn direction="right">
              <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col justify-between min-h-[400px] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl border border-white/10">
                 <div className="space-y-6 relative z-10">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-20 h-20 bg-primary text-white rounded-[2.5rem] flex items-center justify-center transition-transform duration-500 shadow-lg shadow-primary/20"
                    >
                      <BrainCircuit className="w-10 h-10" />
                    </motion.div>
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                        <Sparkles className="w-3 h-3" /> New
                      </div>
                      <h3 className="text-4xl font-black tracking-tight">Takhet AI</h3>
                    </div>
                    <p className="text-slate-400 font-medium leading-relaxed">Умный ассистент, который понимает ваше здоровье. Описывайте симптомы, анализируйте анализы и получайте маршрут лечения в одном чате.</p>
                    <div className="flex flex-wrap gap-2">
                      {['Симптомы', 'Анализы', 'Прогнозы', 'Врачи'].map(tag => (
                        <span key={tag} className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 border border-white/5">{tag}</span>
                      ))}
                    </div>
                 </div>
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => navigate('/takhet-ai')} 
                   className="w-full py-6 bg-primary text-white rounded-[2rem] font-black uppercase text-xs tracking-widest mt-10 hover:bg-white hover:text-primary transition-all duration-300 shadow-xl shadow-primary/20"
                 >
                   Запустить Takhet AI
                 </motion.button>
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
      <section className="py-32 px-6 md:px-20 bg-slate-950 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <FadeIn direction="left">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight">{t.landing.archiveTitle}</h2>
                <p className="text-slate-400 text-xl font-medium leading-relaxed">{t.landing.archiveDesc}</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCTA} 
                className="px-12 py-6 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-primary hover:text-white transition-all duration-300"
              >
                {t.landing.archiveBtn}
              </motion.button>
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
      <section className="py-32 px-6 md:px-20 bg-white">
        <FadeIn direction="up">
          <div className="max-w-4xl mx-auto bg-slate-50 p-14 md:p-24 rounded-[5rem] border border-slate-100 space-y-12 shadow-sm hover:shadow-2xl hover:scale-[1.01] transition-all duration-700">
             <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase text-center text-foreground leading-[1.1]">{t.landing.controlTitle}</h2>
             <p className="text-xl text-slate-500 font-medium text-center">{t.landing.controlSubtitle}</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {t.landing.controlItems.map((item: string, i: number) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ x: 10 }}
                    className="flex items-center gap-4 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 font-bold hover:border-primary/20 transition-all cursor-default"
                  >
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    {item}
                  </motion.div>
                ))}
             </div>
          </div>
        </FadeIn>
      </section>

      {/* 6. Philosophy / Mission Block */}
      <section className="py-32 px-6 md:px-20 bg-primary/5">
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
      <section className="py-32 px-6 md:px-20 bg-white">
        <div className="max-w-4xl mx-auto space-y-20">
          <FadeIn direction="up">
            <div className="text-center">
               <h2 className="text-5xl font-black tracking-tighter uppercase">{t.landing.faqTitle}</h2>
            </div>
          </FadeIn>
          <div className="space-y-6">
             {t.landing.faqItems.map((item: any, i: number) => (
               <FadeIn key={i} delay={i * 0.1}>
                 <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-500">
                   <button 
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className={`w-full flex items-center justify-between p-10 text-left transition-all duration-500 ${activeFaq === i ? 'bg-primary text-white' : 'bg-white hover:bg-slate-50'}`}
                   >
                     <span className={`text-xl font-black ${activeFaq === i ? 'text-white' : 'text-slate-800'}`}>{item.q}</span>
                     <ChevronDown className={`w-7 h-7 transition-transform duration-500 ${activeFaq === i ? 'rotate-180 text-white' : 'text-primary'}`} />
                   </button>
                   <AnimatePresence>
                     {activeFaq === i && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         transition={{ duration: 0.5, ease: "easeInOut" }}
                         className="overflow-hidden"
                       >
                         <div className="p-10 pt-8 bg-slate-50 text-slate-600 text-lg font-medium leading-relaxed">
                           {item.a}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               </FadeIn>
             ))}
          </div>
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
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCTA} 
                className="px-16 py-8 bg-primary text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/40 transition-all duration-300"
              >
                {t.landing.finalCtaReg}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/ai-consultation')} 
                className="px-16 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl transition-all duration-300"
              >
                {t.landing.finalCtaConsult}
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="py-24 border-t border-slate-100 bg-white text-center px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <FadeIn direction="up">
            <div className="flex flex-col items-center justify-center gap-4">
               <span className="text-4xl font-black tracking-tighter text-foreground">Takhet<span className="text-primary">+</span></span>
            </div>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-xs">
              {t.landing.footerRights}
            </p>
          </FadeIn>
          <div className="pt-20 opacity-[0.05] hover:opacity-100 transition-opacity duration-1000">
             <button 
              onClick={() => navigate('/admin-auth')}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors cursor-default"
             >
               admin
             </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
