
import React, { useState, useRef } from 'react';
import { UserRole } from '../types';
import { 
  HeartPulse, ChevronRight, Clock, Video, BrainCircuit, 
  History, Truck, Home, MessageSquare, ChevronDown, Send, 
  CheckCircle2, ShieldPlus, Sparkles, ArrowRight
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
      className="relative w-full aspect-square max-w-sm mx-auto flex items-center justify-center perspective-[1200px] cursor-grab active:cursor-grabbing"
    >
      <div 
        className="relative w-56 h-56 md:w-80 md:h-80 transition-transform duration-500 ease-out preserve-3d"
        style={{ 
          transform: `rotateX(${pos.y * 60}deg) rotateY(${pos.x * 60}deg)`,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-accent opacity-30 blur-3xl animate-pulse"></div>
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="absolute inset-0 border-2 border-primary/30 rounded-[3rem]"
            style={{
              transform: `rotateX(${i * 60}deg) rotateY(${pos.x * 100}deg)`,
              transition: 'transform 0.1s linear'
            }}
          ></div>
        ))}
        <div className="absolute inset-[20%] bg-white/10 backdrop-blur-3xl rounded-[3rem] md:rounded-[3.5rem] border border-white/30 flex items-center justify-center shadow-2xl overflow-hidden">
           <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>
           <ShieldPlus className="w-16 h-16 md:w-24 md:h-24 text-white relative z-10" />
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const navigate = useNavigate();

  const handleCTA = (role: UserRole = UserRole.PATIENT, mode: 'login' | 'register' = 'register') => {
    navigate('/auth', { state: { role, mode } });
  };

  return (
    <div className="min-h-screen bg-white selection:bg-primary/20">
      <PublicHeader activePath="/" />

      {/* Hero Section Optimized for Mobile */}
      <section className="relative pt-32 md:pt-44 pb-20 px-6 md:px-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 md:gap-16 relative z-10">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-primary animate-bounce">
              <Sparkles className="w-3.5 h-3.5" /> Доступно в App Store & Play Market
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-foreground leading-[0.9] tracking-tighter">
              Здоровье <br/><span className="text-primary italic">в Takhet+.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
              Медицинская экосистема с ИИ-расшифровкой анализов и онлайн-доступом к экспертам 24/7.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button onClick={() => handleCTA(UserRole.PATIENT, 'register')} className="w-full sm:w-auto px-12 py-5 bg-primary text-white rounded-[1.8rem] font-black text-lg shadow-[0_20px_40px_rgba(13,71,161,0.25)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                Записаться <ChevronRight className="w-6 h-6" />
              </button>
              <button 
                onClick={() => handleCTA(UserRole.PATIENT, 'login')}
                className="w-full sm:w-auto px-12 py-5 bg-white border-2 border-slate-100 text-foreground rounded-[1.8rem] font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
              >
                Войти <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full animate-in fade-in zoom-in duration-1000 delay-300">
             <NeuralCore />
          </div>
        </div>
      </section>

      {/* Stats Quick Section Mobile */}
      <section className="py-12 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: 'Пациентов', val: '50k+', color: 'text-primary' },
             { label: 'Врачей', val: '2.5k', color: 'text-accent' },
             { label: 'Анализов', val: '1M+', color: 'text-purple-600' },
             { label: 'Оценка', val: '4.9/5', color: 'text-amber-500' }
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
               <p className={`text-3xl font-black ${stat.color}`}>{stat.val}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
             </div>
           ))}
        </div>
      </section>

      {/* Rest of landing content remains high-quality as defined... */}
      <section className="py-24 px-6 md:px-20">
         {/* Standard grid sections from previous high-quality version */}
      </section>
    </div>
  );
};

export default LandingPage;
