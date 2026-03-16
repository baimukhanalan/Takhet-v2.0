
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, User } from '../types';
import { 
  ChevronRight, Sparkles, BrainCircuit, 
  Video, ShieldCheck, Truck, Archive, Stethoscope, 
  ChevronDown, Send, MessageSquare, Info, Activity, Dog, ArrowUpRight, Plus, Users, HeartPulse, Clock, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import TakhetLogo from '../components/Logo';
import { MockDB } from '../services/db';
import { translations, Language } from '../services/i18n';

const Health3DMatrix = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Smoother movement logic
    setPos({ x: x * 0.8, y: y * 0.8 });
  };

  const handleMouseLeave = () => {
    setPos({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-square flex items-center justify-center perspective-[2000px] cursor-pointer"
    >
      <div 
        className="relative w-72 h-72 md:w-[450px] md:h-[450px] transition-transform duration-1000 ease-out preserve-3d" 
        style={{ transform: `rotateX(${pos.y * 25}deg) rotateY(${pos.x * 25}deg)` }}
      >
        <div className="absolute inset-0 rounded-[5rem] bg-primary/20 blur-[120px] animate-pulse-soft"></div>
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="absolute inset-0 border border-primary/10 rounded-[4.5rem] bg-white/5 backdrop-blur-[2px] transition-transform duration-700" 
            style={{ transform: `translateZ(${(i + 1) * 30}px) scale(${0.9 + i * 0.05})` }}
          ></div>
        ))}
        <div 
          className="absolute inset-[15%] bg-white rounded-[4rem] shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white z-50 group hover:shadow-primary/20 transition-all duration-500"
          style={{ transform: 'translateZ(100px)' }}
        >
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
           <TakhetLogo className="w-40 h-40 md:w-60 md:h-60 animate-pulse-soft transition-transform duration-700 group-hover:scale-110" />
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<{ user?: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleUpdate = () => setLang(MockDB.getLang());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const handleCTA = () => {
    if (user) navigate('/dashboard');
    else navigate('/auth', { state: { role: UserRole.PATIENT, mode: 'register' } });
  };

  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-white overflow-x-hidden">
      <PublicHeader activePath="/" />

      {/* 1. Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-24 px-6 md:px-20 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-10 text-center lg:text-left animate-in fade-in slide-in-from-left duration-1000 ease-out">
            <div className="space-y-6">
              <h1 className="text-7xl md:text-9xl font-black text-foreground tracking-tighter leading-none">
                Takhet<span className="text-primary">+</span>
              </h1>
              <h2 className="text-2xl md:text-3xl font-medium text-slate-800 leading-tight">
                Умная медицинская экосистема, которая помогает принимать правильные решения о здоровье
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
              <button 
                onClick={handleCTA} 
                className="group w-full sm:w-auto px-12 py-6 bg-primary text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
              >
                Записаться на консультацию
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={handleCTA} 
                className="w-full sm:w-auto px-12 py-6 bg-slate-100 text-slate-600 rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
              >
                Срочная помощь
              </button>
            </div>
          </div>
          <div className="flex-1 w-full flex justify-center animate-in fade-in slide-in-from-right duration-1000 ease-out">
             <Health3DMatrix />
          </div>
        </div>
      </section>

      {/* 2. Why Choose Us Section */}
      <section className="py-32 px-6 md:px-20 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-foreground">Почему люди выбирают Takhet+</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group">
              <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors">1. Не «погуглить симптомы», а понять, что с вами происходит</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Takhet+ анализирует симптомы, фото, анализы и историю здоровья, чтобы:</p>
              <ul className="space-y-4 font-bold text-slate-700">
                {['выделить реальные риски,', 'отсечь лишние тревоги,', 'подсказать, что делать дальше.'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs shrink-0 mt-1">✓</div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-primary font-black text-sm uppercase tracking-widest pt-4">Вы получаете понятный маршрут, а не абстрактный диагноз.</p>
            </div>

            <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group">
              <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors">2. Решения, а не просто консультации</h3>
              <p className="text-slate-500 font-medium leading-relaxed">В Takhet+ вы получаете:</p>
              <div className="grid grid-cols-1 gap-4 font-bold text-slate-800">
                {['рекомендации,', 'альтернативные варианты,', 'объяснение «почему так»,', 'понимание последствий.'].map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-primary/20 transition-all cursor-default">{item}</div>
                ))}
              </div>
              <p className="text-primary font-black text-sm uppercase tracking-widest pt-4">Вы контролируете решения, а не слепо следуете советам.</p>
            </div>

            <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group">
              <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors">3. Ваше здоровье — в динамике, а не в отдельных справках</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Система формирует цифровой профиль здоровья:</p>
              <ul className="space-y-4 font-bold text-slate-700">
                {['учитывает изменения со временем,', 'показывает тенденции,', 'помогает предотвращать проблемы, а не лечить последствия.'].map((item, i) => (
                   <li key={i} className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Key Capabilities */}
      <section className="py-32 px-6 md:px-20 bg-white">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-foreground">Ключевые возможности Takhet+</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Consultation */}
            <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex flex-col justify-between min-h-[400px] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl">
               <div className="space-y-8 relative z-10">
                  <div className="w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center group-hover:rotate-12 transition-transform duration-500"><Video className="w-10 h-10" /></div>
                  <div>
                    <h3 className="text-3xl font-black mb-4 tracking-tight">Онлайн-консультации врачей</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">Видео, аудио или чат. Терапевты, узкие специалисты, психологи. Быстро, без очередей и поездок.</p>
                  </div>
               </div>
               <button onClick={handleCTA} className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest mt-10 hover:bg-primary hover:text-white transition-all duration-300">Записаться</button>
               <Video className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 group-hover:scale-125 group-hover:text-primary/10 transition-all duration-1000" />
            </div>

            {/* AI Analysis */}
            <div className="bg-white p-12 rounded-[4rem] border border-border flex flex-col justify-between min-h-[400px] shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 group">
               <div className="space-y-6">
                  <div className="w-20 h-20 bg-primary text-white rounded-[2.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-500"><BrainCircuit className="w-10 h-10" /></div>
                  <h3 className="text-3xl font-black tracking-tight">Интеллектуальный анализ данных</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Загрузите симптомы, фото (кожа, горло, глаза и др.), результаты анализов.</p>
                  <div className="p-6 bg-primary/5 rounded-[2.5rem] space-y-4">
                     <p className="text-sm font-bold text-slate-700">Система: выявит зоны риска, предложит возможные причины, подскажет дальнейшие шаги.</p>
                     <p className="text-xs font-black text-orange-600 uppercase flex items-center gap-2 mt-2"><AlertTriangle className="w-4 h-4" /> Это не замена врачу, а умный помощник для принятия решений.</p>
                  </div>
               </div>
               <button onClick={handleCTA} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest mt-10 hover:bg-primary transition-all">Загрузить данные</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Stethoscope, title: 'Персональный медицинский маршрут', desc: 'Takhet+ помогает понять: к какому врачу идти, срочно или можно подождать, какие обследования действительно нужны. Без лишних трат и хаоса.' },
              { icon: Users, title: 'Коллективный интеллект врачей (Swarm Medicine)', desc: 'В сложных случаях ваше обращение может быть анонимно рассмотрено несколькими врачами, оценено с учётом опыта и успешных кейсов. Профессиональный консенсус.' },
              { icon: HeartPulse, title: 'Семейный медицинский штаб', desc: 'Управляйте здоровьем близких: дети, пожилые родители, родственники. Общий архив, напоминания, важные алерты, согласование решений.' }
            ].map((f, i) => (
              <div key={i} className="bg-slate-50 p-10 rounded-[3.5rem] space-y-6 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-primary/10 transition-all duration-500 group">
                <f.icon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-500" />
                <h4 className="text-2xl font-black tracking-tight">{f.title}</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Archive & Logistics */}
      <section className="py-32 px-6 md:px-20 bg-slate-950 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12 animate-in fade-in slide-in-from-left duration-1000">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">Медицинский архив — всё в одном месте</h2>
              <p className="text-slate-400 text-xl font-medium leading-relaxed">История консультаций, назначения, анализы, документы. Данные всегда под рукой и доступны только вам и тем, кому вы разрешили.</p>
            </div>
            <button onClick={handleCTA} className="px-12 py-6 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-primary hover:text-white transition-all duration-300">Открыть архив</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: Truck, title: 'Доставка лекарств', desc: 'По назначениям врача, из проверенных аптек, с доставкой на дом.' },
              { icon: HeartPulse, title: 'Вызов врача на дом', desc: 'Для детей, пожилых, экстренных ситуаций. Без стресса и ожиданий.' },
              { icon: Activity, title: 'Забота о ментальном здоровье', desc: 'Психологи, психотерапевты, конфиденциально и удобно.' },
              { icon: Dog, title: 'Ветеринарные консультации', desc: 'Помощь вашему питомцу: онлайн, без поездок, по записи.' }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 space-y-6 hover:bg-white/10 transition-all duration-500 group">
                <item.icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                <h4 className="text-xl font-black">{item.title}</h4>
                <p className="text-slate-400 text-sm font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Control Section */}
      <section className="py-32 px-6 md:px-20 bg-white">
        <div className="max-w-4xl mx-auto bg-slate-50 p-14 md:p-24 rounded-[5rem] border border-slate-100 space-y-12 shadow-sm hover:shadow-2xl hover:scale-[1.01] transition-all duration-700">
           <h2 className="text-5xl font-black tracking-tighter uppercase text-center text-foreground leading-[1.1]">Ваше здоровье — под контролем</h2>
           <p className="text-xl text-slate-500 font-medium text-center">Takhet+ создан для людей, которые:</p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['не хотят теряться в симптомах,', 'ценят время,', 'хотят понимать последствия решений,', 'заботятся о себе и семье.'].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 font-bold hover:border-primary/20 transition-all cursor-default">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  {item}
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* NEW Philosophy / Mission Block before FAQ */}
      <section className="py-32 px-6 md:px-20 bg-primary/5">
        <div className="max-w-5xl mx-auto text-center space-y-12">
           <div className="inline-block p-4 bg-white rounded-full shadow-xl mb-4">
              <Sparkles className="w-10 h-10 text-primary animate-spin-slow" />
           </div>
           <div className="bg-white p-12 md:p-20 rounded-[5rem] shadow-2xl border border-primary/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50"></div>
              <p className="text-3xl md:text-4xl lg:text-5xl text-slate-800 font-black leading-tight tracking-tighter relative z-10">
                Takhet+ — это не просто онлайн-врачи. <br className="hidden md:block" />
                <span className="text-primary italic">Это система, которая собирает ваши данные, оценивает риски и помогает выбрать лучший путь лечения — быстро, понятно и под контролем.</span>
              </p>
           </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="py-32 px-6 md:px-20 bg-white">
        <div className="max-w-4xl mx-auto space-y-20">
          <div className="text-center">
             <h2 className="text-5xl font-black tracking-tighter uppercase">Частые вопросы</h2>
          </div>
          <div className="space-y-6">
             {[
               { q: 'Чем Takhet+ отличается от обычной телемедицины?', a: 'Takhet+ помогает не только поговорить с врачом, но и понять что делать дальше и почему.' },
               { q: 'Это безопасно?', a: 'Да. Все данные защищены и передаются только с вашего согласия.' },
               { q: 'Можно ли пользоваться всей семьёй?', a: 'Да. Для этого создан семейный медицинский штаб.' }
             ].map((item, i) => (
               <div key={i} className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-500">
                 <button 
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className={`w-full flex items-center justify-between p-10 text-left transition-all duration-500 ${activeFaq === i ? 'bg-primary text-white' : 'bg-white hover:bg-slate-50'}`}
                 >
                   <span className={`text-xl font-black ${activeFaq === i ? 'text-white' : 'text-slate-800'}`}>{item.q}</span>
                   <ChevronDown className={`w-7 h-7 transition-transform duration-500 ${activeFaq === i ? 'rotate-180 text-white' : 'text-primary'}`} />
                 </button>
                 <div 
                   className={`grid transition-all duration-500 ease-in-out ${activeFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                 >
                   <div className="overflow-hidden">
                     <div className="p-10 pt-8 bg-slate-50 text-slate-600 text-lg font-medium leading-relaxed">
                       {item.a}
                     </div>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="py-40 px-6 bg-slate-50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 opacity-30"></div>
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground uppercase">Takhet<span className="text-primary">+</span></h2>
          <p className="text-3xl md:text-4xl font-bold text-slate-400 italic">Медицина, которая думает вместе с вами.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-10">
            <button onClick={handleCTA} className="px-16 py-8 bg-primary text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-110 hover:shadow-primary/40 active:scale-95 transition-all duration-300">Зарегистрироваться</button>
            <button onClick={handleCTA} className="px-16 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300">Получить консультацию</button>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="py-24 border-t border-slate-100 bg-white text-center px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col items-center justify-center gap-4">
             <span className="text-4xl font-black tracking-tighter text-foreground">Takhet<span className="text-primary">+</span></span>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-xs">
            © 2026 Takhet+. Все права защищены.
          </p>
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
