
import React, { useState, useRef } from 'react';
import { UserRole } from '../types';
import { 
  HeartPulse, ChevronRight, Clock, Video, BrainCircuit, 
  History, Truck, Home, MessageSquare, ChevronDown, Send, 
  CheckCircle2, PawPrint
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';

// Highly Interactive 3D Neutral Figure (Neural Core)
const NeuralCore = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setPos({ x: 0, y: 0 });
      }}
      className="relative w-full aspect-square flex items-center justify-center perspective-[1200px] cursor-grab active:cursor-grabbing"
    >
      <div 
        className="relative w-64 h-64 md:w-80 md:h-80 transition-transform duration-500 ease-out preserve-3d"
        style={{ 
          transform: `rotateX(${pos.y * 60}deg) rotateY(${pos.x * 60}deg)`,
        }}
      >
        {/* Layer 1: Inner Glowing Sphere */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-accent opacity-40 blur-3xl animate-pulse"></div>
        
        {/* Layer 2: Rotating Rings */}
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="absolute inset-0 border-2 border-primary/40 rounded-full"
            style={{
              transform: `rotateX(${i * 60}deg) rotateY(${pos.x * 100}deg)`,
              transition: 'transform 0.1s linear'
            }}
          ></div>
        ))}

        {/* Layer 3: Floating Nodes */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 140;
          const tx = Math.cos(angle) * radius;
          const ty = Math.sin(angle) * radius;
          
          return (
            <div 
              key={i}
              className="absolute w-4 h-4 bg-accent rounded-full shadow-[0_0_20px_#00BFA5]"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate3d(${tx + (pos.x * 40)}px, ${ty + (pos.y * 40)}px, ${isHovered ? 50 : 0}px)`,
                transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
            ></div>
          );
        })}

        {/* Centerpiece */}
        <div className="absolute inset-[20%] bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/30 flex items-center justify-center shadow-2xl">
           <HeartPulse className="w-20 h-20 text-white animate-pulse" />
        </div>
      </div>
      
      {/* Interaction Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 pointer-events-none">
        Двигайте мышью для взаимодействия
      </div>
    </div>
  );
};

const FAQ_ITEMS = [
  { q: 'Почему стоит попробовать консультацию онлайн?', a: 'Это экономит время, исключает риск заражения в очередях и дает доступ к лучшим специалистам страны независимо от вашего местоположения.' },
  { q: 'По каким вопросам обращаться к врачу онлайн?', a: 'Первичные консультации, расшифровка анализов, корректировка лечения, вопросы питания, ментальное здоровье и второе мнение эксперта.' },
  { q: 'Можно ли записать ребёнка?', a: 'Да, у нас есть квалифицированные педиатры, которые проводят приемы онлайн и могут выехать на дом.' },
  { q: 'Как проходит приём у ветеринара?', a: 'Через видеосвязь вы показываете питомца, описываете симптомы, и врач дает рекомендации или направляет на очный осмотр.' },
];

const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const navigate = useNavigate();

  const handleCTA = (role: UserRole = UserRole.PATIENT, mode: 'login' | 'register' = 'register') => {
    navigate('/auth', { state: { role, mode } });
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedback('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <PublicHeader activePath="/" />

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6 md:px-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <h1 className="text-6xl md:text-8xl font-black text-foreground leading-[0.85] tracking-tighter">
              Здоровье <br/><span className="text-primary italic">в Takhet+.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
              Медицинская экосистема с ИИ-расшифровкой анализов и онлайн-доступом к экспертам.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
              <button onClick={() => handleCTA(UserRole.PATIENT, 'register')} className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/40 hover:scale-105 transition-all flex items-center justify-center gap-3">
                Записаться <ChevronRight className="w-6 h-6" />
              </button>
              <button 
                onClick={() => handleCTA(UserRole.PATIENT, 'login')}
                className="w-full sm:w-auto px-10 py-5 bg-accent text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-accent/40 hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                Срочно <Clock className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1">
             <NeuralCore />
          </div>
        </div>
      </section>

      {/* AI EEG Section */}
      <section className="py-24 px-6 md:px-20 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 order-2 lg:order-1">
            <div className="relative group">
               <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
               <img 
                 src="https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80" 
                 className="w-full rounded-[3.5rem] shadow-xl relative z-10 border-8 border-white"
                 alt="AI Brain Illustration"
               />
            </div>
          </div>
          <div className="flex-1 space-y-8 order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-black leading-tight text-foreground">
              ИИ-расшифровка <span className="text-primary">анализов</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed">
              Загрузите данные ЭЭГ или результаты лабораторных исследований, и наша система предоставит детальный анализ в одно касание.
            </p>
            <button 
              onClick={() => handleCTA(UserRole.PATIENT, 'register')}
              className="inline-flex items-center gap-3 px-10 py-5 bg-white border-2 border-primary text-primary rounded-[2rem] font-black text-lg hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/10"
            >
              Попробовать ИИ <BrainCircuit className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-32 px-6 md:px-20">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black">Возможности</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { title: 'Онлайн консультации', desc: 'Связывайтесь с лучшими врачами через видео или чат.', icon: Video },
              { title: 'Психологическая поддержка', desc: 'Консультации для заботы о ментальном здоровье.', icon: MessageSquare },
              { title: 'Доставка лекарств', desc: 'Прописанные лекарства с доставкой всего за 60 минут.', icon: Truck },
              { title: 'Вызов врача на дом', desc: 'Квалифицированная помощь прямо у вас в гостиной.', icon: Home },
              { title: 'Медицинский архив', desc: 'История анализов в одном защищенном приложении.', icon: History },
              { title: 'ИИ расшифровка', desc: 'Умный анализ результатов для быстрой диагностики.', icon: BrainCircuit },
            ].map((cap, i) => (
              <div key={i} className="bg-white p-12 rounded-[3rem] border border-border shadow-sm hover:shadow-xl transition-all group hover:-translate-y-2">
                <div className="w-16 h-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                  <cap.icon className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-black mb-4">{cap.title}</h4>
                <p className="text-muted-foreground font-medium leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Archive Section */}
      <section className="py-24 px-6 md:px-20 bg-slate-900 text-white overflow-hidden rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 space-y-8">
            <h2 className="text-5xl font-black leading-tight">Ваш контроль.</h2>
            <p className="text-xl text-slate-400 font-medium leading-relaxed">
              Управляйте своей медицинской историей в одном защищенном личном архиве.
            </p>
            <button 
              onClick={() => handleCTA(UserRole.PATIENT, 'register')}
              className="inline-flex items-center gap-3 px-10 py-5 bg-accent text-white rounded-[2rem] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-accent/20"
            >
              В архив <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 relative">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80" 
              className="w-full rounded-[4rem] shadow-2xl border-4 border-white/10 opacity-80"
              alt="Health Dashboard"
            />
          </div>
        </div>
      </section>

      {/* Vet Section */}
      <section className="py-32 px-6 md:px-20 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
             <img 
               src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80" 
               className="w-full rounded-[4rem] shadow-2xl border-8 border-slate-50"
               alt="Veterinarian with dog"
             />
          </div>
          <div className="flex-1 space-y-8">
            <h2 className="text-5xl font-black">Для питомцев</h2>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed">
              Онлайн-консультация ветеринаров по записи. Получите помощь, не выходя из дома.
            </p>
            <button onClick={() => handleCTA(UserRole.PATIENT, 'register')} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:scale-105 transition-all shadow-xl">
              Выбрать ветеринара
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 md:px-20 bg-white">
        <div className="max-w-3xl mx-auto space-y-16">
          <h2 className="text-5xl font-black text-center">Частые вопросы</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-border rounded-3xl overflow-hidden bg-slate-50/50">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-lg">{item.q}</span>
                  <ChevronDown className={`w-6 h-6 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-8 pb-8 text-muted-foreground font-medium leading-relaxed animate-in slide-in-from-top-2">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback Form */}
      <section className="py-32 px-6 md:px-20 bg-primary text-white text-center">
        <div className="max-w-xl mx-auto space-y-10">
          <div className="space-y-4">
            <h2 className="text-5xl font-black">Отзыв</h2>
            <p className="text-xl text-blue-100 font-medium">Помогите нам стать лучше.</p>
          </div>
          <form onSubmit={handleSendFeedback} className="relative">
            {feedbackSent ? (
              <div className="bg-white/10 border border-white/20 p-10 rounded-[2.5rem] animate-in zoom-in-95">
                <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-4" />
                <h4 className="text-2xl font-bold">Спасибо!</h4>
              </div>
            ) : (
              <div className="space-y-6">
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Ваш отзыв..."
                  className="w-full bg-white/10 border-2 border-white/20 rounded-[2rem] p-8 text-white placeholder:text-white/40 outline-none transition-all h-32 font-medium"
                />
                <button 
                  type="submit"
                  className="px-12 py-5 bg-white text-primary rounded-[2rem] font-black text-xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-3 mx-auto"
                >
                  Отправить <Send className="w-6 h-6" />
                </button>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border px-6 md:px-20 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <HeartPulse className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-foreground">Takhet<span className="text-primary">+</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 font-bold text-xs text-muted-foreground uppercase tracking-widest">
            <Link to="/mental" className="hover:text-primary">Mental</Link>
            <Link to="/community" className="hover:text-primary">Сообщество</Link>
            <Link to="/doctors" className="hover:text-primary">Врачам</Link>
            <Link to="/partners" className="hover:text-primary">Клиникам</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
