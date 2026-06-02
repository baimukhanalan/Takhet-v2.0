import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, MailCheck, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { FadeIn } from '../components/FadeIn';
import { roleApi } from '../../services/roleApi';

type ConfirmState = 'loading' | 'emailConfirmed' | 'error';

const AuthConfirmEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState<ConfirmState>('loading');
  const [message, setMessage] = useState('Подтверждаем почту...');

  const goBackOrAuth = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/auth');
  };

  useEffect(() => {
    const token = params.get('token') || '';

    if (!token) {
      setState('error');
      setMessage('Ссылка подтверждения неполная. Запросите новое письмо со страницы входа.');
      return;
    }

    roleApi
      .confirmEmailVerification({ token })
      .then(() => {
        setState('emailConfirmed');
        setMessage('Почта подтверждена. Теперь можно войти в платформу.');
      })
      .catch(() => {
        setState('error');
        setMessage('Не удалось подтвердить почту. Ссылка могла устареть или уже была использована.');
      });
  }, [params]);

  const Icon = state === 'loading' ? Loader2 : state === 'emailConfirmed' ? CheckCircle2 : XCircle;

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
            <h1 className="text-6xl font-black leading-none tracking-tighter max-w-sm">Подтверждение почты</h1>
          </FadeIn>
          <FadeIn direction="left" delay={0.5}>
            <p className="text-slate-400 font-medium max-w-md">Завершаем проверку почты, чтобы защитить доступ к аккаунту.</p>
          </FadeIn>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 md:px-24 py-12 relative bg-white">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={goBackOrAuth}
          className="absolute top-8 left-8 lg:left-24 flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-all uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Назад
        </motion.button>

        <div className="max-w-md w-full mx-auto space-y-10">
          <FadeIn direction="up">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center">
                {state === 'loading' ? <Icon className="w-8 h-8 text-primary animate-spin" /> : <Icon className={`w-8 h-8 ${state === 'emailConfirmed' ? 'text-emerald-500' : 'text-red-500'}`} />}
              </div>
              <div className="space-y-2">
                <h2 className="text-5xl font-black text-foreground tracking-tighter">Подтверждение почты</h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{message}</p>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 bg-primary text-white shadow-primary/30 hover:shadow-primary/50"
            >
              <MailCheck className="w-5 h-5" />
              Вернуться ко входу
            </button>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default AuthConfirmEmailPage;
