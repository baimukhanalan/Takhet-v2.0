import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronRight, ArrowLeft, Stethoscope, Building2, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { FadeIn } from '../components/FadeIn';
import { UserRole } from '../types';
import { useLanguage } from '../services/useLanguage';
import { roleApi } from '../../services/roleApi';

type AuthCredentials = {
  email: string;
  password: string;
};

type AuthState = {
  role?: UserRole;
  mode?: 'login' | 'register';
  from?: { pathname?: string; search?: string };
};

const roleConfigs = {
  [UserRole.PATIENT]: { title: 'Пациент', icon: UserIcon },
  [UserRole.DOCTOR]: { title: 'Врач', icon: Stethoscope },
  [UserRole.PARTNER]: { title: 'Партнер', icon: Building2 }
};

const isApplicationRole = (role: UserRole) => role === UserRole.DOCTOR || role === UserRole.PARTNER;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const authRoleMap: Record<UserRole, 'patient' | 'doctor' | 'partner' | 'admin'> = {
  [UserRole.PATIENT]: 'patient',
  [UserRole.DOCTOR]: 'doctor',
  [UserRole.PARTNER]: 'partner',
  [UserRole.ADMIN]: 'admin'
};

const AuthPage: React.FC<{
  onLogin: (role: UserRole, credentials: AuthCredentials) => Promise<void>;
  onRegister: (role: UserRole, credentials: AuthCredentials) => Promise<unknown>;
}> = ({ onLogin, onRegister }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const state = (location.state as AuthState | null) || {};

  const [role, setRole] = useState<UserRole>(state.role || UserRole.PATIENT);
  const [mode, setMode] = useState<'login' | 'register'>(state.mode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const registerActionLabel = isApplicationRole(role) ? 'Подать заявку' : 'Зарегистрироваться';
  const registerSubmitLabel = isApplicationRole(role) ? 'Отправить заявку' : 'Перейти к регистрации';
  const registerLead =
    role === UserRole.DOCTOR
      ? 'Заполните форму, чтобы подать заявку врача на подключение к платформе.'
      : role === UserRole.PARTNER
        ? 'Заполните форму, чтобы подать заявку клиники или партнера на подключение к платформе.'
        : 'Заполните форму, чтобы перейти к регистрации и открыть доступ к платформе.';

  useEffect(() => {
    if (state.role) setRole(state.role);
    if (state.mode) setMode(state.mode);
  }, [state.role, state.mode]);

  const resolveAuthReturnTarget = () => {
    const source = state.from?.pathname || '/';
    const search = state.from?.search || '';
    const protectedFallbacks = new Set(['/dashboard', '/doctors-search', '/archive', '/ai-lab', '/settings']);

    if (protectedFallbacks.has(source) || source.startsWith('/consultation/')) {
      return '/';
    }

    return `${source}${search}`;
  };

  const goBackOrHome = () => {
    navigate(resolveAuthReturnTarget(), { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      setError('Введите корректную почту.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      if (mode === 'register') {
        await onRegister(role, { email: normalizedEmail, password });
        setInfoMessage(
          isApplicationRole(role)
            ? 'Заявка отправлена. Проверьте почту и дождитесь подтверждения администратором.'
            : 'Регистрация начата. Подтвердите почту, чтобы получить доступ к порталу.'
        );
        setPassword('');
      } else {
        await onLogin(role, { email: normalizedEmail, password });
        const target = state.from?.pathname ? `${state.from.pathname}${state.from.search || ''}` : '/dashboard';
        navigate(target, { replace: true });
      }
    } catch {
      setError(mode === 'register' ? 'Не удалось завершить регистрацию' : t.auth.error || 'Неверный логин или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  const openRegister = () => {
    navigate('/auth', {
      state: {
        role,
        mode: 'register',
        from: state.from,
        forcePublicAuth: true
      }
    });
  };

  const openLogin = () => {
    navigate('/auth', {
      state: {
        role,
        mode: 'login',
        from: state.from,
        forcePublicAuth: true
      }
    });
  };

  const handleRequestEmailVerification = async () => {
    if (!email.trim()) {
      setRecoveryMessage('Введите почту, чтобы отправить подтверждение.');
      return;
    }

    setRecoveryMessage(null);
    try {
      await roleApi.requestEmailVerification({ email: email.trim(), role: authRoleMap[role] });
      setRecoveryMessage('Если аккаунт найден, письмо для подтверждения будет отправлено на почту.');
    } catch {
      setRecoveryMessage('Не удалось подготовить подтверждение почты. Попробуйте ещё раз.');
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!email.trim()) {
      setRecoveryMessage('Введите почту, чтобы восстановить доступ.');
      return;
    }

    setRecoveryMessage(null);
    try {
      await roleApi.requestPasswordReset({ email: email.trim(), role: authRoleMap[role] });
      setRecoveryMessage('Если аккаунт найден, письмо для восстановления будет отправлено на почту.');
    } catch {
      setRecoveryMessage('Не удалось подготовить восстановление доступа. Попробуйте ещё раз.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-20 overflow-hidden">
        <div className="relative z-10 text-white space-y-6">
          <FadeIn direction="left" delay={0.2}>
            <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer group">
              <span className="text-4xl font-black tracking-tighter">Takhet<span className="text-primary">+</span></span>
            </div>
          </FadeIn>
          <FadeIn direction="left" delay={0.4}>
            <h1 className="text-6xl font-black leading-none tracking-tighter max-w-sm">
              {mode === 'register' ? 'Регистрация' : 'Вход в платформу'}
            </h1>
          </FadeIn>
          <FadeIn direction="left" delay={0.5}>
            <p className="text-slate-400 font-medium max-w-md">
              {mode === 'register'
                ? registerLead
                : 'Используйте действующий аккаунт, чтобы войти в платформу и продолжить работу.'}
            </p>
          </FadeIn>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 md:px-24 py-12 relative bg-white">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={goBackOrHome}
          className="absolute top-8 left-8 lg:left-24 flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-all uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> {t.auth.back}
        </motion.button>

        <div className="max-w-md w-full mx-auto space-y-10">
          <FadeIn direction="up">
            <div className="space-y-2">
              <h2 className="text-5xl font-black text-foreground tracking-tighter">{mode === 'register' ? registerActionLabel : 'Вход'}</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                {mode === 'register' ? `Выберите свою роль и ${registerActionLabel.toLowerCase()}` : 'Выберите свою роль и войдите в существующий аккаунт'}
              </p>
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
              {(Object.keys(roleConfigs) as UserRole[]).map((r) => {
                const isActive = role === r;
                const config = roleConfigs[r];
                return (
                  <button key={r} onClick={() => setRole(r)} className={`flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all relative ${isActive ? 'text-primary' : 'text-muted-foreground hover:bg-white/50'}`}>
                    {isActive && (
                      <motion.div
                        layoutId="activeRole"
                        className="absolute inset-0 bg-white shadow-xl ring-1 ring-slate-200 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
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
                  <input required name="email" type="email" inputMode="email" autoComplete="username" placeholder={t.auth.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-primary focus:bg-white transition-all font-bold" />
                </div>
                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <input required name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={t.auth.password} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-12 py-4 outline-none focus:border-primary focus:bg-white transition-all font-bold" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors hover:text-primary"
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-xs font-bold overflow-hidden">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
              {recoveryMessage && (
                <div className="rounded-xl bg-blue-50 p-4 text-xs font-bold text-primary">
                  {recoveryMessage}
                </div>
              )}
              {infoMessage && (
                <div className="rounded-xl bg-blue-50 p-4 text-xs font-bold text-blue-700">
                  {infoMessage}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${isLoading ? 'bg-slate-200 text-slate-400' : 'bg-primary text-white shadow-primary/30 hover:shadow-primary/50'}`}
              >
                {isLoading ? t.common.loading : mode === 'register' ? registerSubmitLabel : 'Войти'}
                {!isLoading && <ChevronRight className="w-5 h-5" />}
              </motion.button>

              <button type="button" onClick={mode === 'register' ? openLogin : openRegister} className="w-full text-center text-primary font-black text-xs uppercase tracking-widest hover:underline">
                {mode === 'register' ? 'Войти' : registerActionLabel}
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" onClick={handleRequestEmailVerification} className="rounded-2xl bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary">
                  Подтвердить почту
                </button>
                <button type="button" onClick={handleRequestPasswordReset} className="rounded-2xl bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary">
                  Восстановить доступ
                </button>
              </div>
            </form>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
