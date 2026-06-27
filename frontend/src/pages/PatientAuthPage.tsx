import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ChevronRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { FadeIn } from '../components/FadeIn';
import { UserRole } from '../types';
import { useLanguage } from '../services/useLanguage';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';

const PatientAuthPage: React.FC<{ onLogin: (role: UserRole, credentials: { email: string; password: string }) => Promise<void> }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Вы должны согласиться с политикой конфиденциальности.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onLogin(UserRole.PATIENT, { email: email.trim().toLowerCase(), password });
      const from = (location.state as any)?.from;
      const target = from?.pathname ? `${from.pathname}${from.search || ''}` : '/dashboard';
      navigate(target, { replace: true });
    } catch {
      setError(t.auth.error || 'Неверный логин или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  const openRegister = () => {
    navigate('/auth', {
      state: {
        role: UserRole.PATIENT,
        mode: 'register',
        from: (location.state as any)?.from,
        forcePublicAuth: true
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -mr-40 -mt-40"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] -ml-40 -mb-40"
        />
      </div>

      <div className="w-full max-w-lg space-y-10 relative z-10">
        <FadeIn direction="down">
          <div className="text-center space-y-4">
            <div onClick={() => navigate('/')} className="inline-flex items-center gap-3 cursor-pointer group mb-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <span className="text-white font-black text-2xl">T</span>
              </div>
              <span className="text-3xl font-black text-white tracking-tighter">Takhet<span className="text-primary">+</span></span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Вход в Takhet AI</h1>
            <p className="text-slate-400 font-medium max-w-sm mx-auto">
              Войдите, чтобы продолжить диалог с Takhet AI, открыть архив, разобрать анализы и перейти к консультациям.
            </p>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={0.2}>
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <TextField
                  required
                  name="patient-email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="Электронная почта"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leading={<Mail className="h-5 w-5" />}
                  leadingClassName="left-5 text-slate-500"
                  tone="dark"
                  inputClassName="py-5 pl-14 pr-6 font-medium"
                />

                <TextField
                  required
                  name="patient-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leading={<Lock className="h-5 w-5" />}
                  leadingClassName="left-5 text-slate-500"
                  tone="dark"
                  inputClassName="py-5 pl-14 pr-6 font-medium"
                />
              </div>

              <div className="flex items-center justify-between text-sm gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${agreed ? 'bg-primary border-primary' : 'border-white/10 group-hover:border-primary/50'}`}>
                    <input type="checkbox" className="hidden" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                    {agreed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-slate-400 font-medium select-none">Я согласен с политикой</span>
                </label>
                <Button variant="ghost" size="sm" onClick={openRegister} className="px-0 hover:underline">
                  Зарегистрироваться
                </Button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert tone="error" icon={<AlertCircle className="h-5 w-5" />} className="border-red-500/20 bg-red-500/10 text-sm font-medium text-red-400">
                    {error}
                  </Alert>
                </motion.div>
              )}

              <Button
                type="submit"
                loading={isLoading}
                loadingLabel="Входим"
                size="none"
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                Войти в систему <ChevronRight className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={0.4}>
          <div className="text-center space-y-4">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed">
              AI не ставит диагноз. Финальное решение принимает врач.
            </p>
            <Button variant="unstyled" size="none" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Вернуться на главную
            </Button>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};

export default PatientAuthPage;
