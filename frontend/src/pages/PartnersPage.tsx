import React, { useRef, useState } from 'react';
import { UserRole } from '../types';
import {
  Building2,
  TrendingUp,
  ChevronRight,
  Clock,
  BarChart3,
  GraduationCap,
  Zap,
  Headphones,
  Globe,
  Sparkles,
  Layout,
  Wallet,
  Briefcase,
  Star
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FadeIn, FadeInStagger } from '../components/FadeIn';

const B2BMatrix = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setPos({ x: x * 0.8, y: y * 0.8 });
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2 }}
      className="relative w-full aspect-square flex items-center justify-center perspective-[1200px] cursor-pointer"
    >
      <div
        className="relative w-64 h-64 md:w-80 md:h-80 transition-transform duration-1000 ease-out preserve-3d"
        style={{ transform: `rotateX(${pos.y * 30}deg) rotateY(${pos.x * 30}deg)` }}
      >
        <div className="absolute inset-0 rounded-[5rem] bg-primary/10 blur-[120px] animate-pulse-soft" />
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, translateZ: 0 }}
            animate={{ opacity: 1, translateZ: i * 30 }}
            transition={{ delay: i * 0.1 }}
            className="absolute inset-0 border border-primary/20 rounded-[3.5rem] transition-transform duration-700"
            style={{ transform: `translateZ(${i * 30}px) scale(${0.8 + i * 0.05}) rotateZ(${i * 10}deg)` }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, translateZ: 0 }}
          animate={{ opacity: 1, translateZ: 60 }}
          transition={{ delay: 0.8 }}
          className="absolute inset-[10%] bg-white rounded-[3rem] border-4 border-primary/10 flex items-center justify-center shadow-2xl overflow-hidden group z-50"
          style={{ transform: 'translateZ(60px)' }}
        >
          <div className="absolute inset-0 bg-primary/5 animate-pulse-soft" />
          <Building2 className="w-24 h-24 text-primary relative z-10 group-hover:scale-110 transition-transform duration-700" />
        </motion.div>
      </div>
    </motion.div>
  );
};

const PartnersPage: React.FC = () => {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate('/auth', { state: { role: UserRole.PARTNER, from: { pathname: '/dashboard' }, forcePublicAuth: true } });
  };

  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-white overflow-x-hidden">
      <PublicHeader activePath="/partners" />

      <section className="relative pt-28 sm:pt-32 md:pt-40 lg:pt-48 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6 lg:px-12 xl:px-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 sm:gap-14 lg:gap-20">
          <div className="flex-1 space-y-10 text-center lg:text-left">
            <FadeIn direction="left">
              <div className="space-y-6 px-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-primary text-xs font-black uppercase tracking-widest border border-primary/10">
                  <Briefcase className="w-3 h-3" />
                  B2B решения
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tighter leading-tight">
                  Решение для медицинских центров и клиник
                </h1>
                <p className="text-base sm:text-lg md:text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Станьте партнером Takhet+ и получите доступ к новому потоку пациентов, цифровым инструментам и системе роста доверия через прозрачность.
                </p>
              </div>
            </FadeIn>

            <FadeIn direction="up" delay={0.2}>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCTA}
                  className="group w-full sm:w-auto px-10 md:px-12 py-5 md:py-6 bg-primary text-white rounded-[2rem] md:rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 flex items-center justify-center gap-3 mx-auto lg:mx-0"
                >
                  Индивидуальные условия
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCTA}
                  className="w-full sm:w-auto px-10 py-5 border-2 border-slate-200 text-slate-600 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:border-primary hover:text-primary transition-all duration-300"
                >
                  Презентация
                </motion.button>
              </div>
            </FadeIn>
          </div>
          <div className="flex-1 w-full">
            <B2BMatrix />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-slate-50 px-4 sm:px-6 lg:px-12 xl:px-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <FadeInStagger>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
              {[
                { label: 'Никаких затрат на колл-центр', val: '0 ₸', icon: Headphones },
                { label: 'Рост конверсии во второй прием', val: '+40%', icon: TrendingUp },
                { label: 'Меньше времени на медзаключения', val: '−30%', icon: Clock },
                { label: 'Оплата за реальный результат', val: '₸', icon: Zap }
              ].map((stat, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <motion.div whileHover={{ y: -5 }} className="text-center space-y-4 group">
                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center mx-auto shadow-sm text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <stat.icon className="w-6 h-6 md:w-7 md:h-7" />
                    </motion.div>
                    <p className="text-3xl md:text-5xl font-black text-foreground tracking-tighter">{stat.val}</p>
                    <p className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 max-w-[180px] mx-auto leading-tight">{stat.label}</p>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </FadeInStagger>
        </div>
      </section>

      <section className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-20">
        <div className="max-w-7xl mx-auto space-y-24">
          <FadeInStagger>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {[
                {
                  title: 'Цифровая клиника Takhet+',
                  desc: 'Видеомодуль, умный консультативный лист и поддержка клинического AI как инструмента помощи врачу, а не его замены.',
                  icon: Layout,
                  color: 'bg-blue-50 text-primary'
                },
                {
                  title: 'Аналитика записей',
                  desc: 'Прозрачная статистика приемов в личном кабинете. Можно скачивать отчеты за любой период.',
                  icon: BarChart3,
                  color: 'bg-emerald-50 text-emerald-600'
                },
                {
                  title: 'Методика оценки',
                  desc: 'Система оценки опирается на внимательность осмотра, точность решений, качество рекомендаций и обратную связь пациентов.',
                  icon: Star,
                  color: 'bg-amber-50 text-amber-500'
                },
                {
                  title: 'Обучение и поддержка',
                  desc: 'Регулярные вебинары по онлайн-консультированию и работе с AI, плюс техническая и методическая поддержка.',
                  icon: GraduationCap,
                  color: 'bg-purple-50 text-purple-600'
                }
              ].map((feature, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <motion.div whileHover={{ y: -10 }} className="bg-white p-10 md:p-12 h-full rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                    <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl md:text-2xl font-black mb-4 tracking-tight group-hover:text-primary transition-colors">{feature.title}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                    <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                      <feature.icon className="w-48 h-48" />
                    </div>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </FadeInStagger>

          <FadeIn direction="up">
            <motion.div whileHover={{ scale: 1.01 }} className="bg-slate-900 p-8 md:p-20 rounded-[3rem] md:rounded-[5rem] text-white relative overflow-hidden group">
              <div className="relative z-10 space-y-8 max-w-3xl">
                <h2 className="text-3xl md:text-6xl font-black tracking-tighter leading-none">Подключайтесь к Takhet+</h2>
                <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">
                  Проводите онлайн-консультации, управляйте расписанием, работайте дистанционно — всё в единой экосистеме.
                </p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCTA} className="px-10 md:px-12 py-5 md:py-6 bg-primary text-white rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest shadow-2xl hover:bg-blue-600 transition-all">
                  Оставить заявку
                </motion.button>
              </div>
              <Building2 className="absolute -right-20 -bottom-20 w-96 h-96 text-white/5 group-hover:scale-110 group-hover:text-primary/10 transition-all duration-1000" />
            </motion.div>
          </FadeIn>
        </div>
      </section>

      <section className="py-32 bg-slate-50 px-6 md:px-20">
        <div className="max-w-7xl mx-auto space-y-20 px-4">
          <FadeIn direction="up">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-6xl font-black tracking-tighter uppercase text-foreground">Преимущества для клиник</h2>
              <div className="w-24 h-1.5 bg-primary mx-auto rounded-full" />
            </div>
          </FadeIn>
          <FadeInStagger>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: 'Финансовые модели', desc: 'Выбирайте модель, которая выгодна именно вам: процент с консультаций или фиксированная сумма.', icon: Wallet },
                { title: 'Глубокая аналитика', desc: 'Не просто отчеты, а полезные инсайты: какие услуги растут, где выше качество и загрузка.', icon: TrendingUp },
                { title: 'Автоматизация', desc: 'Система помогает с напоминаниями, базовыми отчетами и упорядоченным потоком заявок.', icon: Sparkles },
                { title: 'Масштабирование', desc: 'Привлекайте пациентов за пределами вашего города с помощью цифрового контура платформы.', icon: Globe }
              ].map((adv, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col md:flex-row gap-8 p-10 md:p-12 bg-white rounded-[3rem] md:rounded-[4rem] border border-slate-100 hover:shadow-2xl hover:border-primary/20 transition-all group">
                    <motion.div whileHover={{ rotate: 12 }} className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 mx-auto md:mx-0">
                      <adv.icon className="w-7 h-7 md:w-8 md:h-8" />
                    </motion.div>
                    <div className="space-y-3 text-center md:text-left">
                      <h4 className="text-xl md:text-2xl font-black tracking-tight group-hover:text-primary transition-colors">{adv.title}</h4>
                      <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base">{adv.desc}</p>
                    </div>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </FadeInStagger>
        </div>
      </section>

      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-20">
          <FadeIn direction="up">
            <div className="text-center space-y-4 px-4">
              <h2 className="text-3xl md:text-6xl font-black tracking-tighter uppercase">3 простых шага</h2>
            </div>
          </FadeIn>
          <FadeInStagger>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative px-4">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-50 hidden md:block -z-10 translate-y-[-2rem]" />
              {[
                { id: '01', title: 'Оставьте заявку', desc: 'Менеджер свяжется с вами в течение 2 часов для обсуждения задач.' },
                { id: '02', title: 'Заключите договор', desc: 'Подключим клинику к системе и быстро настроим рабочий контур.' },
                { id: '03', title: 'Принимайте пациентов', desc: 'Начинайте консультации уже на следующем этапе запуска.' }
              ].map((s, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <motion.div whileHover={{ y: -10 }} className="relative p-10 md:p-12 bg-white border border-slate-100 rounded-[3rem] md:rounded-[3.5rem] text-center shadow-sm hover:shadow-2xl transition-all duration-500 group">
                    <motion.div whileHover={{ scale: 1.1, rotate: 12 }} className="w-16 h-16 md:w-20 md:h-20 bg-primary text-white rounded-full flex items-center justify-center font-black text-2xl md:text-3xl mx-auto mb-10 border-4 md:border-8 border-white shadow-2xl">
                      {s.id}
                    </motion.div>
                    <h4 className="text-xl md:text-2xl font-black mb-4 md:mb-6 group-hover:text-primary transition-colors">{s.title}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed text-sm">{s.desc}</p>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </FadeInStagger>
          <FadeIn direction="up" delay={0.4}>
            <div className="text-center pt-10 px-6">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCTA} className="group w-full sm:w-auto px-8 md:px-16 py-6 md:py-8 bg-slate-900 text-white rounded-[2rem] md:rounded-[2.5rem] font-black text-base md:text-xl uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 mx-auto">
                Начать сотрудничество <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="py-24 bg-white text-center px-6 border-t border-slate-50">
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

export default PartnersPage;
