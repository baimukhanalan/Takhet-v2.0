
import React, { useState, useRef } from 'react';
import { UserRole } from '../types';
import { 
  Building2, Users, Briefcase, TrendingUp, 
  ArrowUpRight, ShieldCheck, Globe, Star, 
  ChevronRight, HeartPulse, CheckCircle2, 
  LayoutDashboard, Video, Search, Clock, BarChart3, GraduationCap, Zap, Headphones
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import { Link, useNavigate } from 'react-router-dom';

const B2BMatrix = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setPos({ x, y });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-square flex items-center justify-center perspective-[1200px]"
    >
      <div 
        className="relative w-64 h-64 md:w-80 md:h-80 transition-transform duration-500 ease-out preserve-3d"
        style={{ transform: `rotateX(${pos.y * 40}deg) rotateY(${pos.x * 40}deg)` }}
      >
        <div className="absolute inset-0 rounded-[5rem] bg-accent/20 blur-[120px] animate-pulse"></div>
        
        {/* Connection Matrix Grid */}
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className="absolute inset-0 border-[1px] border-accent/20"
            style={{
              transform: `translateZ(${i * 40}px) scale(${0.8 + i * 0.1})`,
            }}
          ></div>
        ))}

        <div className="absolute inset-[10%] bg-white rounded-[3rem] border-4 border-accent/10 flex items-center justify-center shadow-2xl overflow-hidden group">
           <div className="absolute inset-0 bg-accent/5 animate-pulse"></div>
           <Building2 className="w-24 h-24 text-accent relative z-10" />
        </div>
        
        {/* Floating Data Points */}
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_#0D47A1]"
            style={{
              top: `${20 + i * 12}%`,
              left: `${10 + (i % 2) * 80}%`,
              transform: `translateZ(${i * 20}px)`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

const PartnersPage: React.FC = () => {
  const navigate = useNavigate();

  const handlePartnerAuth = (mode: 'login' | 'register' = 'register') => {
    navigate('/auth', { state: { role: UserRole.PARTNER, mode } });
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader activePath="/partners" />

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6 md:px-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-full text-xs font-black uppercase tracking-[0.2em]">
              <Building2 className="w-4 h-4" /> B2B Решения Takhet+
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[0.9] tracking-tighter">
              Решение для <br/><span className="text-primary italic">медцентров и клиник.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Станьте партнёром Takhet+ и получите доступ к новому потоку пациентов, цифровым инструментам и системе роста доверия через прозрачность.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
              <button onClick={() => handlePartnerAuth('register')} className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/40 hover:scale-105 transition-all flex items-center justify-center gap-3">
                Получить условия сотрудничества <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1">
            <B2BMatrix />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-slate-50 px-6 md:px-20 border-y border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Затраты на колл-центр', val: '0 ₸', icon: Headphones },
            { label: 'Конверсия во второй приём', val: '+40%', icon: TrendingUp },
            { label: 'Меньше времени на заключения', val: '-30%', icon: Clock },
            { label: 'Оплата только за результат', val: '₸', icon: Zap },
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-primary mb-4">
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-4xl font-black text-foreground">{stat.val}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground max-w-[150px] mx-auto leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-32 px-6 md:px-20">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black">Цифровая клиника <span className="text-primary">Takhet+</span></h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">Видеомодуль, умный консультативный лист и поддержка клинического ИИ — инструмент помощи для ваших экспертов.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[
              { 
                title: 'Аналитика записей', 
                icon: BarChart3, 
                desc: 'Прозрачная статистика приёмов в личном кабинете. Скачивайте отчёты о записях за любой период — от дня до года.' 
              },
              { 
                title: 'Методика оценки', 
                icon: Star, 
                desc: 'Уникальная система оценки: внимательность, точность диагноза и доброжелательность на основе обратной связи.' 
              },
              { 
                title: 'Обучение и поддержка', 
                icon: GraduationCap, 
                desc: 'Регулярные вебинары по онлайн-консультированию и работе с ИИ. Техническая поддержка 24/7.' 
              },
            ].map((mod, i) => (
              <div key={i} className="bg-white p-12 rounded-[3rem] border border-border shadow-sm hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-8">
                  <mod.icon className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-black mb-4 leading-tight">{mod.title}</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden">
             <div className="relative z-10 max-w-2xl space-y-8">
               <h3 className="text-4xl font-black leading-tight">Подключайтесь к Takhet+</h3>
               <p className="text-xl text-slate-400 font-medium">Проводите онлайн-консультации, управляйте расписанием, работайте дистанционно — всё в единой экосистеме. Решение подходит для медцентров любого масштаба.</p>
               <button onClick={() => handlePartnerAuth('register')} className="px-10 py-5 bg-accent text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-accent/20 hover:scale-[1.05] transition-all">Оставить заявку</button>
             </div>
             <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
               <div className="w-full h-full bg-gradient-to-l from-primary to-transparent"></div>
             </div>
             <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-32 bg-white px-6 md:px-20">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black">Преимущества для <span className="text-primary italic">медцентров</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { 
                title: 'Гибкие финансовые модели', 
                desc: 'Платите небольшой процент с консультаций или фиксированную сумму за каждого врача. Управляйте экономикой без сюрпризов.',
                icon: Briefcase
              },
              { 
                title: 'Глубокая аналитика для роста', 
                desc: 'Получайте ценные инсайты: востребованность услуг, эффективность врачей, пики записей. Решения, основанные на данных.',
                icon: TrendingUp
              },
              { 
                title: 'Автоматизация рутины', 
                desc: 'Напоминания о приеме, запросы отзывов и отчеты формируются автоматически, освобождая ваших администраторов.',
                icon: CheckCircle2
              },
              { 
                title: 'Масштабирование', 
                desc: 'Привлекайте пациентов за пределами вашего города. Используйте маркетинговые инструменты платформы для продвижения.',
                icon: Globe
              },
            ].map((adv, i) => (
              <div key={i} className="flex gap-8 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:border-primary/20 transition-all group">
                <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center shrink-0 shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <adv.icon className="w-8 h-8" />
                </div>
                <div className="space-y-4">
                  <h4 className="text-2xl font-black">{adv.title}</h4>
                  <p className="text-muted-foreground font-medium leading-relaxed">{adv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black">3 простых шага к <span className="text-primary italic">новым возможностям</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 hidden md:block -z-10"></div>
            {[
              { id: '01', title: 'Оставьте заявку', desc: 'Наш менеджер свяжется с вами в течение 2 часов, чтобы обсудить ваши цели.' },
              { id: '02', title: 'Заключите договор', desc: 'Мы добавим вашу клинику в систему и проведём быстрой регистрацию врачей.' },
              { id: '03', title: 'Принимайте пациентов', desc: 'Начните проводить консультации и станьте ближе к тысячам пользователей.' },
            ].map((s, i) => (
              <div key={i} className="relative p-12 bg-white border border-border rounded-[3.5rem] text-center shadow-sm hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-8 border-8 border-white shadow-lg">
                  {s.id}
                </div>
                <h4 className="text-2xl font-black mb-4">{s.title}</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center pt-10">
            <button onClick={() => handlePartnerAuth('register')} className="px-12 py-6 bg-primary text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:scale-105 transition-all">
              Начать сотрудничество
            </button>
          </div>
        </div>
      </section>

      {/* Final Call to Action with Team Image */}
      <section className="py-32 bg-slate-900 text-white px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-10 text-center lg:text-left">
            <h2 className="text-5xl md:text-6xl font-black leading-tight">Готовы выйти на новый уровень?</h2>
            <p className="text-2xl text-slate-400 font-medium italic">Станьте нашим партнёром уже сегодня</p>
            <button onClick={() => handlePartnerAuth('register')} className="px-12 py-6 bg-accent text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-accent/40 hover:scale-[1.05] transition-all">Оставить заявку</button>
          </div>
          <div className="flex-1 relative">
            <img 
              src="https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80" 
              className="rounded-[4rem] shadow-2xl opacity-80 border-4 border-white/10"
              alt="Medical professionals collaborating"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-slate-900 text-white px-6 md:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <HeartPulse className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight">Takhet<span className="text-primary">+</span></span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">© 2026 Takhet+. Все права защищены.</p>
          </div>
          <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Link to="/" className="hover:text-white">Пациентам</Link>
            <Link to="/doctors" className="hover:text-white">Врачам</Link>
            <Link to="/community" className="hover:text-white">Сообщество</Link>
            <Link to="/mental" className="hover:text-white">Mental</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PartnersPage;
