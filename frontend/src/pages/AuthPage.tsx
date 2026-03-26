import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { 
  Mail, Lock, ChevronRight, ArrowLeft, 
  Stethoscope, Building2, User as UserIcon, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../services/useLanguage';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn } from '../components/FadeIn';

const InteractiveMesh = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });

  return (
    <div onMouseMove={handleMouseMove} className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div 
        animate={{ 
          x: mousePos.x * 0.05 - 400, 
          y: mousePos.y * 0.05 - 400 
        }}
        transition={{ type: "spring", damping: 30, stiffness: 50 }}
        className="absolute w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px]"
      />
      <motion.div 
        animate={{ 
          x: mousePos.x * -0.03 + 200, 
          y: mousePos.y * -0.03 + 200 
        }}
        transition={{ type: "spring", damping: 40, stiffness: 40 }}
        className="absolute w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px]"
      />
    </div>
  );
};

const AuthPage: React.FC<{ onLogin: (role: UserRole) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  
  const state = location.state as { role?: UserRole; mode?: 'login' | 'register' } || {};
  const [mode, setMode] = useState<'login' | 'register'>(state.mode || 'login');
  const [role, setRole] = useState<UserRole>(state.role || UserRole.PATIENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      if ((email === 'a@mail.ru' && password === 'A') || mode === 'register') {
        onLogin(role);
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError(t.auth.error);
      }
      setIsLoading(false);
    }, 800);
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
          <FadeIn direction="left" delay={0.2}>
            <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer group">
              <span className="text-4xl font-black tracking-tighter">Takhet<span className="text-primary">+</span></span>
            </div>
          </FadeIn>
          <FadeIn direction="left" delay={0.4}>
            <h1 className="text-6xl font-black leading-none tracking-tighter max-w-sm">{t.auth.welcomeTitle}</h1>
          </FadeIn>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center px-6 md:px-24 py-12 relative bg-white">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')} 
          className="absolute top-8 left-8 lg:left-24 flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-all uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> {t.auth.back}
        </motion.button>

        <div className="max-w-md w-full mx-auto space-y-10">
          <FadeIn direction="up">
            <div className="space-y-1">
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-5xl font-black text-foreground tracking-tighter"
                >
                  {mode === 'login' ? t.auth.login : t.auth.register}
                </motion.h2>
              </AnimatePresence>
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-primary font-black text-sm uppercase tracking-widest hover:underline">
                {mode === 'login' ? t.auth.createNew : t.auth.alreadyHave}
              </button>
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
              {(Object.keys(roleConfigs) as UserRole[]).map((r) => {
                const isActive = role === r;
                const config = roleConfigs[r];
                return (
                  <button 
                    key={r} 
                    onClick={() => setRole(r)} 
                    className={`flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all relative ${isActive ? 'text-primary' : 'text-muted-foreground hover:bg-white/50'}`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeRole"
                        className="absolute inset-0 bg-white shadow-xl ring-1 ring-slate-200 rounded-xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <config.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-primary' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{config.title}</span>
                  </button>
                );
              })}
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
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
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-xs font-bold overflow-hidden"
                  >
                    <AlertCircle className="w-4 h-4" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading} 
                className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${isLoading ? 'bg-slate-200 text-slate-400' : 'bg-primary text-white shadow-primary/30 hover:shadow-primary/50'}`}
              >
                {isLoading ? t.common.loading : t.auth.continue}
                {!isLoading && <ChevronRight className="w-5 h-5" />}
              </motion.button>
            </form>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
