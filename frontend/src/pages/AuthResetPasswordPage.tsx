import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { FadeIn } from '../components/FadeIn';
import { roleApi } from '../../services/roleApi';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';

const AuthResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordResetCompleted, setPasswordResetCompleted] = useState(false);

  const goBackOrAuth = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/auth');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const token = params.get('token') || '';
    if (!token) {
      setError('Ссылка восстановления неполная. Запросите новое письмо со страницы входа.');
      return;
    }

    setIsLoading(true);
    try {
      await roleApi.resetPassword({ token, password });
      setPasswordResetCompleted(true);
    } catch {
      setError('Не удалось обновить пароль. Проверьте ссылку или выберите более надёжный пароль.');
    } finally {
      setIsLoading(false);
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
            <h1 className="text-6xl font-black leading-none tracking-tighter max-w-sm">Восстановление доступа</h1>
          </FadeIn>
          <FadeIn direction="left" delay={0.5}>
            <p className="text-slate-400 font-medium max-w-md">Задайте новый пароль для аккаунта и продолжите работу в платформе.</p>
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
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tighter">Восстановление доступа</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                {passwordResetCompleted ? 'Пароль обновлён. Теперь можно войти.' : 'Введите новый пароль для аккаунта'}
              </p>
            </div>
          </FadeIn>

          {passwordResetCompleted ? (
            <FadeIn direction="up" delay={0.1}>
              <Button
                onClick={() => navigate('/auth')}
                size="none"
                className="w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 bg-primary text-white shadow-primary/30 hover:shadow-primary/50"
              >
                <CheckCircle2 className="w-5 h-5" />
                Вернуться ко входу
              </Button>
            </FadeIn>
          ) : (
            <FadeIn direction="up" delay={0.1}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <TextField
                  required
                  type="password"
                  autoComplete="new-password"
                  placeholder="Новый пароль"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  leading={<Lock className="h-5 w-5" />}
                />

                <p className="text-xs font-bold text-slate-400">
                  Пароль должен быть не короче 10 символов и содержать буквы и цифры.
                </p>

                {error && (
                  <Alert tone="error" icon={<AlertCircle className="h-4 w-4" />}>{error}</Alert>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${isLoading ? 'bg-slate-200 text-slate-400' : 'bg-primary text-white shadow-primary/30 hover:shadow-primary/50'}`}
                >
                  {isLoading ? 'Сохранение' : 'Сохранить пароль'}
                  {!isLoading && <ChevronRight className="w-5 h-5" />}
                </motion.button>

                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="w-full font-black uppercase tracking-widest hover:underline">
                  Вернуться ко входу
                </Button>
              </form>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthResetPasswordPage;
