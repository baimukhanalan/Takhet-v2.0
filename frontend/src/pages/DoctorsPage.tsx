import React, { useState, useRef } from 'react';
import { UserRole } from '../types';
import { 
  Stethoscope, Shield, Zap, Clock, 
  Video, FileText, BrainCircuit, Users, Archive, 
  Award, BarChart3, GraduationCap, ChevronRight, Star, HeartPulse
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import { useLanguage } from '../services/useLanguage';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn, FadeInStagger } from '../components/FadeIn';

const ExpertPulse = () => {
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
      className="relative w-full aspect-square flex items-center justify-center perspective-[1200px] cursor-pointer"
    >
      <div 
        className="relative w-64 h-64 md:w-80 md:h-80 transition-transform duration-1000 ease-out preserve-3d" 
        style={{ transform: `rotateX(${pos.y * 40}deg) rotateY(${pos.x * 40}deg)` }}
      >
        <div className="absolute inset-0 rounded-[4rem] bg-primary/20 blur-[100px] animate-pulse-soft"></div>
        {[...Array(3)].map((_, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, translateZ: 0 }}
            animate={{ opacity: 1, translateZ: i * 20 }}
            transition={{ delay: i * 0.2 + 0.5 }}
            className="absolute inset-0 border-4 border-slate-900/10 rounded-[3.5rem] transition-transform duration-700" 
            style={{ transform: `rotateZ(${i * 45}deg) scale(${1 - i * 0.1}) translateZ(${i * 20}px)` }}
          ></motion.div>
        ))}
        <motion.div 
          initial={{ opacity: 0, translateZ: 0 }}
          animate={{ opacity: 1, translateZ: 50 }}
          transition={{ delay: 1 }}
          className="absolute inset-[15%] bg-slate-900 rounded-[3.5rem] flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden z-50 group hover:shadow-primary/40 transition-all duration-500"
          style={{ transform: 'translateZ(50px)' }}
        >
           <Stethoscope className="w-24 h-24 text-white relative z-10 group-hover:scale-110 transition-transform duration-700" />
        </motion.div>
      </div>
    </motion.div>
  );
};

const DoctorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleCTA = () => {
    navigate('/auth', { state: { role: UserRole.DOCTOR, mode: 'register' } });
  };

  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-white overflow-x-hidden">
      <PublicHeader activePath="/doctors" />
      
      {/* 1. Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-24 px-6 md:px-20 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-10 text-center lg:text-left">
            <FadeIn direction="left">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-9xl font-black text-foreground tracking-tighter leading-none">
                  Takhet<span className="text-primary">+</span>
                </h1>
                <h2 className="text-xl md:text-4xl font-medium text-slate-800 leading-tight">
                  {t.doctors?.heroTitle || "Цифровая медицинская платформа для врачей, которые хотят зарабатывать проще, быстрее и без выгорания"}
                </h2>
              </div>
            </FadeIn>
            
            <FadeIn direction="up" delay={0.2}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCTA} 
                className="group w-full sm:w-auto px-10 md:px-16 py-5 md:py-6 bg-primary text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 flex items-center justify-center gap-3 mx-auto lg:mx-0"
              >
                {t.auth?.register || "Зарегистрироваться"}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </FadeIn>
          </div>
          <div className="flex-1">
            <ExpertPulse />
          </div>
        </div>
      </section>

      {/* 2. Conditions Section */}
      <section className="py-32 px-6 md:px-20 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
        <div className="max-w-5xl mx-auto space-y-16">
          <FadeIn direction="up">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-6xl font-black tracking-tighter uppercase text-foreground">Прозрачные и честные условия</h2>
              <div className="w-24 h-1.5 bg-primary mx-auto rounded-full"></div>
            </div>
          </FadeIn>
          
          <FadeIn direction="up" delay={0.2}>
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-white p-8 md:p-20 rounded-[3rem] md:rounded-[5rem] shadow-xl border border-slate-100 space-y-12 transition-all duration-700 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-slate-100 pb-12 relative z-10">
                 <div className="space-y-2 group text-center md:text-left">
                    <p className="text-primary font-black uppercase tracking-widest text-[10px] md:text-xs group-hover:translate-x-1 transition-transform">Для новичков</p>
                    <p className="text-2xl md:text-3xl font-black text-slate-900">Первые 10 консультаций — 100% ваш доход</p>
                 </div>
                 <div className="space-y-2 group text-center md:text-left">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] md:text-xs group-hover:translate-x-1 transition-transform">Постоянная работа</p>
                    <p className="text-2xl md:text-3xl font-black text-slate-900">С 11-й консультации — комиссия всего 15%</p>
                 </div>
              </div>
              <FadeInStagger>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                   {[
                     { text: 'без абонплат', icon: Shield },
                     { text: 'без скрытых списаний', icon: Zap },
                     { text: 'без штрафов', icon: Clock },
                     { text: 'без навязанных графиков', icon: Stethoscope }
                   ].map((item, i) => (
                     <FadeIn key={i} delay={i * 0.1}>
                       <div className="text-center space-y-3 group cursor-default">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300"
                          >
                            <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                          </motion.div>
                          <p className="text-[9px] md:text-xs font-bold text-slate-500 uppercase leading-tight group-hover:text-slate-800 transition-colors">{item.text}</p>
                       </div>
                     </FadeIn>
                   ))}
                </div>
              </FadeInStagger>
              <div className="pt-6 text-center px-4 relative z-10">
                 <p className="text-lg md:text-xl font-bold text-slate-800 animate-pulse-soft">👉 Вы начинаете зарабатывать с первого дня, без финансовых рисков.</p>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* 3. Why Takhet Section */}
      <section className="py-32 px-6 md:px-20 bg-white">
        <div className="max-w-7xl mx-auto space-y-24">
          <FadeIn direction="up">
            <div className="text-center px-4">
              <h2 className="text-3xl md:text-6xl font-black tracking-tighter uppercase text-foreground">Почему врачам действительно удобно в Takhet+</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <FadeIn direction="up" delay={0.1}>
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-slate-50 p-8 md:p-12 h-full rounded-[3rem] md:rounded-[4rem] border border-slate-100 space-y-8 hover:shadow-xl transition-all duration-500 group"
              >
                 <h3 className="text-xl md:text-2xl font-black leading-tight group-hover:text-primary transition-colors">Вы лечите — система думает вместе с вами</h3>
                 <p className="text-slate-500 font-medium leading-relaxed">Takhet+ помогает:</p>
                 <ul className="space-y-4">
                    {['структурировать жалобы пациента,', 'подсветить клинические риски,', 'предложить варианты маршрута.'].map((item, i) => (
                      <motion.li 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.5 }}
                        className="flex items-start gap-3"
                      >
                         <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs shrink-0 mt-1">✓</div>
                         <span className="text-slate-700 font-bold">{item}</span>
                      </motion.li>
                    ))}
                 </ul>
                 <p className="text-primary font-black text-[10px] uppercase tracking-widest pt-4">Это не диагноз за вас, а поддержка принятия решений.</p>
              </motion.div>
            </FadeIn>

            <FadeIn direction="up" delay={0.2}>
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-slate-900 p-8 md:p-12 h-full rounded-[3rem] md:rounded-[4rem] text-white space-y-8 shadow-2xl transition-all duration-500 group relative overflow-hidden"
              >
                 <div className="relative z-10 space-y-8">
                    <h3 className="text-xl md:text-2xl font-black leading-tight group-hover:text-primary transition-colors">Меньше рутины — больше приёмов</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">Врач получает:</p>
                    <div className="space-y-3">
                       {['готово структурированный кейс,', 'собранные данные пациента,', 'историю и динамику.'].map((item, i) => (
                         <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 font-bold text-white/90">{item}</div>
                       ))}
                    </div>
                    <p className="text-primary font-black text-[10px] uppercase tracking-widest pt-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin-slow" /> ⏱ В среднем экономия 20–40% времени на приём.
                    </p>
                 </div>
                 <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="w-64 h-64 text-white" />
                 </div>
              </motion.div>
            </FadeIn>

            <FadeIn direction="up" delay={0.3}>
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-slate-50 p-8 md:p-12 h-full rounded-[3rem] md:rounded-[4rem] border border-slate-100 space-y-8 hover:shadow-xl transition-all duration-500 group"
              >
                 <h3 className="text-xl md:text-2xl font-black leading-tight group-hover:text-primary transition-colors">Лёгкий фриланс без привязки к клинике</h3>
                 <ul className="space-y-5">
                    {['Принимаете, когда удобно', 'Работаете из любой точки', 'Нет начальников', 'Нет плана'].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-slate-800 font-black uppercase text-xs tracking-widest">
                         <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
                         {item}
                      </li>
                    ))}
                 </ul>
                 <p className="text-slate-500 font-medium pt-10 border-t border-slate-200">Takhet+ — это дополнительный доход, а не вторая работа.</p>
              </motion.div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 4. Capabilities Grid */}
      <section className="py-32 px-6 md:px-20 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-20">
          <FadeIn direction="up">
            <div className="text-center space-y-4 px-4">
              <h2 className="text-3xl md:text-6xl font-black tracking-tighter uppercase text-foreground">Возможности Takhet+ для врача</h2>
              <div className="w-24 h-1.5 bg-primary mx-auto rounded-full"></div>
            </div>
          </FadeIn>
          <FadeInStagger>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Онлайн-консультации', desc: 'Видео / аудио / чат. Русский и казахский языки. Пациенты выбирают вас по опыту и рейтингу.', icon: Video },
                { title: 'Умный консультативный лист', desc: 'Система анализирует симптомы, фото, анализы, формирует клиническую картину. ⚠️ Финальное решение всегда остаётся за врачом.', icon: FileText },
                { title: 'Swarm Medicine', desc: 'Поддержка в сложных случаях. Профессиональный консенсус в нестандартных случаях для уверенности и снижения ошибок.', icon: Users },
                { title: 'Медицинский архив пациента', desc: 'Все данные в одном месте, структурированы, доступны с согласия пациента. Без бесконечных пересылок в мессенджерах.', icon: Archive },
                { title: 'Вызовы врача на дом', desc: 'Дополнительный доход, высокая лояльность пациентов, приоритетные кейсы (дети, пожилые).', icon: HeartPulse },
                { title: 'Репутация и рост бренда', desc: 'Рейтинг по понятным критериям, значки эксперта, продвижение внутри платформы. Пациенты приходят уже с доверием.', icon: Award },
                { title: 'Полная аналитика', desc: 'Доходы, количество приёмов, оценки пациентов, активность. Экспорт отчётов — в один клик.', icon: BarChart3 },
                { title: 'Безопасность и легальность', desc: 'Официальный договор (ИП / клиника), хранение данных в РК, прозрачная история решений. Защита врача.', icon: Shield },
              ].map((feature, i) => (
                <FadeIn key={i} delay={i * 0.05}>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-10 h-full rounded-[3rem] md:rounded-[3.5rem] border border-slate-100 hover:shadow-2xl transition-all group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                    <div className="relative z-10">
                       <motion.div 
                        whileHover={{ rotate: 12 }}
                        className="w-16 h-16 bg-primary/5 text-primary rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500"
                       >
                         <feature.icon className="w-8 h-8" />
                       </motion.div>
                       <h4 className="text-xl font-black mb-4 leading-tight group-hover:text-primary transition-colors">{feature.title}</h4>
                       <p className="text-slate-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
                    </div>
                  </motion.div>
                </FadeIn>
              ))}
              
              <FadeIn delay={0.5}>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-primary p-10 h-full rounded-[3rem] md:rounded-[3.5rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group"
                >
                   <div className="space-y-6 relative z-10">
                      <GraduationCap className="w-12 h-12 group-hover:scale-110 transition-transform" />
                      <h4 className="text-2xl font-black leading-tight">Обучение и поддержка</h4>
                      <ul className="space-y-3 text-sm font-medium text-white/80">
                         <li>• бесплатные вебинары</li>
                         <li>• обучение работе с ИИ</li>
                         <li>• техническая поддержка 24/7</li>
                         <li>• ответ до 5 минут</li>
                      </ul>
                   </div>
                   <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCTA} 
                    className="mt-8 py-5 bg-white text-primary rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl relative z-10 hover:bg-slate-100 transition-colors"
                   >
                    Подробнее
                   </motion.button>
                   <GraduationCap className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 group-hover:scale-125 transition-transform duration-1000" />
                </motion.div>
              </FadeIn>
            </div>
          </FadeInStagger>
        </div>
      </section>

      {/* 5. Testimonials */}
      <section className="py-32 px-6 md:px-20 bg-white">
        <div className="max-w-7xl mx-auto space-y-20">
          <FadeIn direction="up">
            <div className="text-center px-4">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Почему врачи выбирают Takhet+</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              { quote: 'Раньше я тратил до часа на оформление приёма. Сейчас — около 20 минут. Пациент доволен, я не выжат.', author: 'Д-р Алиев, терапевт', rating: '4.9' },
              { quote: 'Платформа даёт поток пациентов без рекламы. Я просто принимаю.', author: 'Д-р Смагулова, педиатр', rating: '5.0' }
            ].map((t, i) => (
              <FadeIn key={i} direction={i === 0 ? "left" : "right"} delay={0.2}>
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="bg-slate-50 p-8 md:p-12 h-full rounded-[3rem] md:rounded-[4rem] border border-slate-100 space-y-8 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  <p className="text-xl md:text-2xl font-bold text-slate-800 italic leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center text-primary font-black shadow-sm text-lg md:text-xl border-2 border-primary/5">{t.author[3]}</div>
                      <div>
                        <h4 className="font-black text-base md:text-lg">{t.author}</h4>
                        <div className="flex items-center gap-1 text-amber-500"><Star className="w-4 h-4 fill-current" /> <span className="font-black text-sm">{t.rating}</span></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Simple Steps */}
      <section className="py-32 px-6 md:px-20 bg-slate-950 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto space-y-20">
          <FadeIn direction="up">
            <div className="text-center px-4">
              <h2 className="text-3xl md:text-6xl font-black tracking-tighter uppercase">Начать просто</h2>
            </div>
          </FadeIn>
          <FadeInStagger>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {[
                { id: '01', title: 'Регистрация', desc: '2 минуты' },
                { id: '02', title: 'Верификация', desc: 'диплом и лицензия' },
                { id: '03', title: 'Приём пациентов', desc: 'первые 10 консультаций без комиссии' },
              ].map((s, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="relative p-10 md:p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] md:rounded-[3.5rem] text-center group hover:bg-white/10 transition-all duration-500">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 12 }}
                      className="w-16 h-16 md:w-20 md:h-20 bg-primary text-white rounded-full flex items-center justify-center font-black text-2xl md:text-3xl mx-auto mb-8 border-4 border-white/10 shadow-2xl"
                    >
                      {s.id}
                    </motion.div>
                    <h4 className="text-xl md:text-2xl font-black mb-4 group-hover:text-primary transition-colors">{s.title}</h4>
                    <p className="text-slate-400 font-bold uppercase text-[10px] md:text-xs tracking-widest leading-relaxed">{s.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeInStagger>
          <FadeIn direction="up" delay={0.4}>
            <div className="text-center pt-10 px-4">
               <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCTA} 
                className="group w-full sm:w-auto px-8 md:px-16 py-6 md:py-8 bg-white text-slate-950 rounded-[2rem] md:rounded-[2.5rem] font-black text-base md:text-xl uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 mx-auto"
               >
                 Зарегистрироваться <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
               </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="py-40 px-6 bg-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 opacity-30"></div>
        <div className="max-w-4xl mx-auto space-y-12 relative z-10 px-4">
          <FadeIn direction="up">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-foreground uppercase leading-none">Takhet<span className="text-primary">+</span></h2>
          </FadeIn>
          <div className="space-y-4">
             <FadeIn direction="up" delay={0.2}>
               <p className="text-2xl md:text-5xl font-black text-slate-800 leading-tight">Ваша задача — лечить.</p>
             </FadeIn>
             <FadeIn direction="up" delay={0.3}>
               <p className="text-xl md:text-3xl font-bold text-slate-400 italic">Всё остальное — на системе.</p>
             </FadeIn>
          </div>
          <FadeIn direction="up" delay={0.4}>
            <div className="pt-10">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCTA} 
                className="w-full sm:w-auto px-10 md:px-16 py-6 md:py-8 bg-primary text-white rounded-[2rem] md:rounded-[2.5rem] font-black text-base md:text-xl uppercase tracking-widest shadow-2xl hover:shadow-primary/40 transition-all duration-300"
              >
                Стать частью системы
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="py-24 border-t border-slate-100 bg-white text-center px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <FadeIn direction="up">
            <div className="flex flex-col items-center justify-center gap-4">
               <span className="text-4xl font-black tracking-tighter text-foreground">Takhet<span className="text-primary">+</span></span>
            </div>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-[10px] md:text-xs">
              © 2026 Takhet+. Все права защищены.
            </p>
          </FadeIn>
        </div>
      </footer>
    </div>
  );
};

export default DoctorsPage;
