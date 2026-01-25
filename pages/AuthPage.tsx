
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { 
  HeartPulse, Mail, Lock, ChevronRight, ArrowLeft, 
  Stethoscope, Building2, User as UserIcon, CheckCircle2,
  ShieldCheck, Chrome, Facebook, AlertCircle
} from 'lucide-react';

interface AuthPageProps {
  onLogin: (role: UserRole) => void;
}

const InteractiveMesh = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    // Fix: Use removeEventListener instead of the non-existent removeMemory method.
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] transition-transform duration-700 ease-out"
        style={{ transform: `translate(${mousePos.x * 0.05 - 400}px, ${mousePos.y * 0.05 - 400}px)` }}
      ></div>
      <div 
        className="absolute w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] transition-transform duration-1000 ease-out"
        style={{ transform: `translate(${mousePos.x * -0.03 + 200}px, ${mousePos.y * -0.03 + 200}px)` }}
      ></div>
    </div>
  );
};

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state as { role?: UserRole; mode?: 'login' | 'register' } || {};
  const [mode, setMode] = useState<'login' | 'register'>(state.mode || 'login');
  const [role, setRole] = useState<UserRole>(state.role || UserRole.PATIENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MASTER_EMAIL = 'baimukhanalan1@gmail.com';
  const MASTER_PASS = 'Alan2408';
  
  // Дополнительные тестовые данные
  const TEST_EMAIL = 'a@mail.ru';
  const TEST_PASS = 'A';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const isMaster = email === MASTER_EMAIL && password === MASTER_PASS;
      const isTest = email === TEST_EMAIL && password === TEST_PASS;

      if (isMaster || isTest) {
        onLogin(role);
        navigate('/dashboard');
      } else if (mode === 'register') {
        onLogin(role);
        navigate('/dashboard');
      } else {
        setError('Неверная почта или пароль. Попробуйте a@mail.ru / A');
      }
      setIsLoading(false);
    }, 800);
  };

  const roleConfigs = {
    [UserRole.PATIENT]: { title: 'Пациент', icon: UserIcon },
    [UserRole.DOCTOR]: { title: 'Врач', icon: Stethoscope },
    [UserRole.PARTNER]: { title: 'Партнер', icon: Building2 },
    [UserRole.ADMIN]: { title: 'Admin', icon: ShieldCheck }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-20 overflow-hidden">
        <InteractiveMesh />
        <div className="relative z-10 text-white space-y-6">
          <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer group">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <span className="text-4xl font-black tracking-tighter">Takhet<span className="text-primary">+</span></span>
          </div>
          <h1 className="text-6xl font-black leading-none tracking-tighter max-w-sm">
            Ваш кабинет <br/> здоровья.
          </h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 md:px-24 py-12 relative bg-white">
        <button onClick={() => navigate('/')} className="absolute top-8 left-8 lg:left-24 flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-all uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>

        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="space-y-1">
            <h2 className="text-5xl font-black text-foreground tracking-tighter">
              {mode === 'login' ? 'Вход' : 'Аккаунт'}
            </h2>
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-primary font-black text-sm uppercase tracking-widest hover:underline">
              {mode === 'login' ? 'Создать новый' : 'Уже есть аккаунт'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
            {(Object.keys(roleConfigs) as UserRole[]).filter(r => r !== UserRole.ADMIN).map((r) => {
              const isActive = role === r;
              const config = roleConfigs[r];
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all ${
                    isActive ? 'bg-white shadow-xl shadow-black/5 ring-1 ring-slate-200' : 'text-muted-foreground hover:bg-white/50'
                  }`}
                >
                  <config.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{config.title}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-primary focus:bg-white transition-all font-bold" />
              </div>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input required type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-primary focus:bg-white transition-all font-bold" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-xs font-bold animate-shake">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <button disabled={isLoading} className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${isLoading ? 'bg-slate-200 text-slate-400' : 'bg-primary text-white shadow-primary/30 hover:shadow-primary/50'}`}>
              {isLoading ? 'Загрузка...' : 'Продолжить'}
              {!isLoading && <ChevronRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="grid grid-cols-2 gap-4 pt-4">
             <button className="flex items-center justify-center gap-3 py-4 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
               <Chrome className="w-4 h-4" /> Google
             </button>
             <button className="flex items-center justify-center gap-3 py-4 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">
               <Facebook className="w-4 h-4" /> Facebook
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
