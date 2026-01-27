
import React, { useState, useRef } from 'react';
import { UserRole } from '../types';
import { 
  HeartPulse, Sparkles, ChevronRight, CheckCircle, 
  Video, MessageSquare, BrainCircuit, History, 
  Truck, ShieldCheck, Globe, Star, ArrowUpRight, 
  Stethoscope, UserCheck, Zap, BarChart3
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';

const ExpertPulse = () => {
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
        style={{ transform: `rotateX(${pos.y * 50}deg) rotateY(${pos.x * 50}deg)` }}
      >
        <div className="absolute inset-0 rounded-[4rem] bg-primary/20 blur-[100px] animate-pulse"></div>
        
        {/* Hexagonal Rings */}
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="absolute inset-0 border-4 border-slate-900/10 rounded-[3.5rem]"
            style={{
              transform: `rotateZ(${i * 45}deg) scale(${1 - i * 0.1})`,
            }}
          ></div>
        ))}

        <div className="absolute inset-[15%] bg-slate-900 rounded-[3.5rem] flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent"></div>
           <Stethoscope className="w-24 h-24 text-white relative z-10" />
        </div>
        
        {/* Orbiting Points */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-accent rounded-full shadow-[0_0_20px_#00BFA5] animate-bounce"></div>
      </div>
    </div>
  );
};

const DoctorsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleDoctorRegistration = () => {
    navigate('/auth', { state: { role: UserRole.DOCTOR, mode: 'register' } });
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader activePath="/doctors" />

      {/* Hero */}
      <section className="relative pt-44 pb-32 px-6 md:px-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-full text-xs font-black uppercase tracking-[0.2em]">
              <Stethoscope className="w-4 h-4" /> Takhet+ для экспертов
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground leading-[0.9] tracking-tighter">
              Цифровая экосистема <br/><span className="text-primary italic">для врачей.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Присоединяйтесь к платформе, где вы — не «исполнитель», а эксперт с личным брендом, который растёт вместе с вами.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
              <button onClick={handleDoctorRegistration} className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/40 hover:scale-105 transition-all flex items-center justify-center gap-3">
                Зарегистрироваться <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1">
            <ExpertPulse />
          </div>
        </div>
      </section>

      {/* Terms Section */}
      <section className="py-24 px-6 md:px-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-5xl font-black leading-tight">Наши условия — <span className="text-accent italic">лучшие на рынке</span></h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/20 text-accent rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">Первые 10 консультаций — 100% вам</h4>
                  <p className="text-slate-400 mt-1 font-medium">Никаких комиссий на старте. Почувствуйте вкус успеха сразу.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/20 text-accent rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">Всего 10% комиссия с 11-й консультации</h4>
                  <p className="text-slate-400 mt-1 font-medium">Самая низкая ставка для поддержания высокого дохода врача.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/20 text-accent rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">Никаких скрытых платежей</h4>
                  <p className="text-slate-400 mt-1 font-medium">Без абонплат, штрафов или обязательных взносов.</p>
                </div>
              </div>
            </div>
            <p className="text-lg text-slate-500 font-bold italic">Вы начинаете зарабатывать максимум с первого дня — без рисков.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-12 rounded-[3.5rem] space-y-10">
            <div className="text-center space-y-2">
              <p className="text-6xl font-black text-accent">90%</p>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Ваша чистая прибыль</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest text-slate-500">
                <span>Платформа</span>
                <span>Врач</span>
              </div>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden flex">
                <div className="w-[10%] bg-white/20"></div>
                <div className="w-[90%] bg-accent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 md:px-20">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black">Все возможности Takhet+ — <span className="text-primary italic">для вашей практики</span></h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">Мы создали инструменты, которые автоматизируют рутину и позволяют вам сфокусироваться на медицине.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                title: 'Онлайн-консультации', 
                icon: Video, 
                desc: 'Видео, аудио или текстовый чат на русском или казахском языке.' 
              },
              { 
                title: 'Публичный чат жалоб', 
                icon: MessageSquare, 
                desc: 'Отвечайте на анонимные вопросы и получайте прямые записи от пациентов.' 
              },
              { 
                title: 'Умный лист с ИИ', 
                icon: BrainCircuit, 
                desc: 'Автоматический анализ симптомов и ЭЭГ для быстрых заключений.' 
              },
              { 
                title: 'Полная аналитика', 
                icon: BarChart3, 
                desc: 'Отслеживайте доходы, оценки и экспортируйте PDF-отчеты.' 
              },
              { 
                title: 'Медицинский архив', 
                icon: History, 
                desc: 'Вся история анализов, УЗИ и рецептов пациента в одной карте.' 
              },
              { 
                title: 'Вызов врача на дом', 
                icon: Truck, 
                desc: 'Принимайте заказы на выезд для дополнительного дохода.' 
              },
              { 
                title: 'Маркетинг 360°', 
                icon: Sparkles, 
                desc: 'Персональный лендинг и продвижение вашего профиля в топ.' 
              },
              { 
                title: 'Безопасность', 
                icon: ShieldCheck, 
                desc: 'Официальный договор и хранение данных внутри Казахстана.' 
              },
              { 
                title: 'Обучение и 24/7 Support', 
                icon: Globe, 
                desc: 'Бесплатные вебинары и техподдержка с ответом за 5 минут.' 
              },
            ].map((f, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all group">
                <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <f.icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-black mb-3">{f.title}</h4>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {[
            { 
              name: 'Д-р Алиев', 
              spec: 'Терапевт', 
              quote: 'Раньше я тратил час на оформление заключения. Теперь — 20 минут. ИИ подсказывает структуру, а я фокусируюсь на пациенте.',
              rating: '4.9 ⭐'
            },
            { 
              name: 'Д-р Смагулова', 
              spec: 'Педиатр', 
              quote: 'Через чат жалоб ко мне записались 12 пациентов за неделю. Они уже доверяют мне — я помогла им бесплатно.',
              rating: '5.0 ⭐'
            }
          ].map((t, i) => (
            <div key={i} className="bg-white p-12 rounded-[3.5rem] border border-border flex flex-col justify-between shadow-sm">
              <p className="text-2xl font-bold text-foreground italic leading-relaxed mb-10">"{t.quote}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-primary font-black">
                    {t.name.split(' ')[1][0]}
                  </div>
                  <div>
                    <h4 className="font-black text-lg">{t.name}</h4>
                    <p className="text-xs font-bold text-muted-foreground uppercase">{t.spec}</p>
                  </div>
                </div>
                <span className="bg-amber-50 text-amber-600 px-4 py-2 rounded-xl font-black text-sm">{t.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black">3 шага — и вы в <span className="text-primary italic">Takhet+</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { id: '01', title: 'Зарегистрируйтесь', desc: 'Это займет всего 2 минуты.' },
              { id: '02', title: 'Пройдите верификацию', desc: 'Загрузите диплом и лицензию.' },
              { id: '03', title: 'Начните принимать', desc: 'Первые 10 консультаций — 100% вам!' },
            ].map((s, i) => (
              <div key={i} className="relative p-10 bg-white border border-border rounded-[3rem] text-center">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-black text-lg border-4 border-background">
                  {s.id}
                </div>
                <h4 className="text-2xl font-black mt-4 mb-4">{s.title}</h4>
                <p className="text-muted-foreground font-medium">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-slate-900 text-white px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-black leading-tight">Готовы выйти на новый уровень?</h2>
            <p className="text-2xl text-slate-400 font-medium italic">Ваша задача — быть врачом. Всё остальное — на нас.</p>
          </div>
          <button 
            onClick={handleDoctorRegistration} 
            className="px-16 py-8 bg-primary text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-primary/40 hover:scale-[1.05] transition-all"
          >
            Станьте нашим партнёром сегодня
          </button>
        </div>
      </section>

      <footer className="py-20 border-t border-white/5 bg-slate-900 text-white px-6 md:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <HeartPulse className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight">Takhet<span className="text-primary">+</span></span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">© 2026 Takhet+. Все права защищены.</p>
          </div>
          <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Link to="/" className="hover:text-white">Пациентам</Link>
            <Link to="/community" className="hover:text-white">Сообщество</Link>
            <Link to="/mental" className="hover:text-white">Mental</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DoctorsPage;
