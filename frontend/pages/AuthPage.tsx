
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { 
  Mail, Lock, ChevronRight, ArrowLeft, 
  Stethoscope, Building2, User as UserIcon, AlertCircle
} from 'lucide-react';
import { MockDB } from '../services/db';
import { translations, Language } from '../services/i18n';
import { api } from '../services/api';

interface AuthPageProps {
  onLogin: (role: UserRole, token?: string) => void;
}

const InteractiveMesh = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] transition-transform duration-700 ease-out" style={{ transform: `translate(${mousePos.x * 0.05 - 400}px, ${mousePos.y * 0.05 - 400}px)` }}></div>
      <div className="absolute w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] transition-transform duration-1000 ease-out" style={{ transform: `translate(${mousePos.x * -0.03 + 200}px, ${mousePos.y * -0.03 + 200}px)` }}></div>
    </div>
  );
};

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  
  useEffect(() => {
    const handleUpdate = () => setLang(MockDB.getLang());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const t = translations[lang];
  const state = location.state as { role?: UserRole; mode?: 'login' | 'register' } || {};
  const [mode, setMode] = useState<'login' | 'register'>(state.mode || 'login');
  const [role, setRole] = useState<UserRole>(state.role || UserRole.PATIENT);
  const [email, setEmail] = useState('baimukhanalan1@gmail.com');
  const [password, setPassword] = useState('baimukhanalan1@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const roleMap: Record<UserRole, 'patient' | 'doctor' | 'partner' | 'admin'> = {
        [UserRole.PATIENT]: 'patient',
        [UserRole.DOCTOR]: 'doctor',
        [UserRole.PARTNER]: 'partner',
        [UserRole.ADMIN]: 'admin'
      };

      const response = await api<{ access_token: string }>(`/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password, role: roleMap[role] })
      });

      onLogin(role, response.access_token);
      navigate('/dashboard');
    } catch {
      setError(t.auth.error);
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfigs = {
    [UserRole.PATIENT]: { title: t.auth.roles.patient, icon: UserIcon },
    [UserRole.DOCTOR]: { title: t.auth.roles.doctor, icon: Stethoscope },
    [UserRole.PARTNER]: { title: t.auth.roles.partner, icon: Building2 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-20 overflow-hidden">
        <InteractiveMesh />
        <div className="relative z-10 text-white space-y-6">
          <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer group">
            {/* Logo container removed, only text remains as requested */}
            <span className="text-4xl font-black tracking-tighter">Takhet<span className="text-primary">+</span></span>
          </div>
          <h1 className="text-6xl font-black leading-none tracking-tighter max-w-sm">{t.auth.welcomeTitle}</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 md:px-24 py-12 relative bg-white">
        <button onClick={() => navigate('/')} className="absolute top-8 left-8 lg:left-24 flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-all uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> {t.auth.back}
        </button>

        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="space-y-1">
            <h2 className="text-5xl font-black text-foreground tracking-tighter">
              {mode === 'login' ? t.auth.login : t.auth.register}
            </h2>
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-primary font-black text-sm uppercase tracking-widest hover:underline">
              {mode === 'login' ? t.auth.createNew : t.auth.alreadyHave}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
            {(Object.keys(roleConfigs) as UserRole[]).map((r) => {
              const isActive = role === r;
              const config = roleConfigs[r];
              return (
                <button key={r} onClick={() => setRole(r)} className={`flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all ${isActive ? 'bg-white shadow-xl ring-1 ring-slate-200' : 'text-muted-foreground hover:bg-white/50'}`}>
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
                <input required type="email" placeholder={t.auth.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-primary focus:bg-white transition-all font-bold" />
              </div>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input required type="password" placeholder={t.auth.password} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-primary focus:bg-white transition-all font-bold" />
              </div>
            </div>
            {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-xs font-bold animate-shake"><AlertCircle className="w-4 h-4" /> {error}</div>}
            <button disabled={isLoading} className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${isLoading ? 'bg-slate-200 text-slate-400' : 'bg-primary text-white shadow-primary/30 hover:shadow-primary/50'}`}>
              {isLoading ? t.common.loading : t.auth.continue}
              {!isLoading && <ChevronRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
