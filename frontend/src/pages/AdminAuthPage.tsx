import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronRight, ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { useLanguage } from '../services/useLanguage';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn } from '../components/FadeIn';

interface AdminAuthPageProps {
  onLogin: (role: UserRole, credentials: { email: string; password: string }) => Promise<void>;
}

const AdminAuthPage: React.FC<AdminAuthPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onLogin(UserRole.ADMIN, { email, password });
      navigate('/admin-dashboard');
    } catch {
      setError(t.admin.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -mr-40 -mt-40"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] -ml-40 -mb-40"
      />

      <div className="w-full max-w-lg space-y-10 relative z-10">
        <FadeIn direction="down">
          <div className="text-center space-y-4">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 1 }}
              className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl backdrop-blur-xl"
            >
              <Shield className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Takhet<span className="text-primary">+</span> Admin</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">{t.admin.subtitle}</p>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={0.2}>
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white/5 backdrop-blur-2xl p-10 md:p-14 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type="text"
                    placeholder={t.admin.emailPlaceholder}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-3xl pl-16 pr-6 py-5 outline-none focus:border-primary focus:bg-slate-900 text-white font-bold transition-all"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    type="password"
                    placeholder={t.admin.passwordPlaceholder}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/5 rounded-3xl pl-16 pr-6 py-5 outline-none focus:border-primary focus:bg-slate-900 text-white font-bold transition-all"
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold overflow-hidden"
                  >
                    <AlertCircle className="w-4 h-4" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className={`w-full py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 transition-all ${isLoading ? 'bg-slate-800 text-slate-600' : 'bg-primary text-white hover:bg-blue-600 shadow-primary/30'}`}
              >
                {isLoading ? t.admin.checking : t.admin.loginBtn} <ChevronRight className="w-5 h-5" />
              </motion.button>
            </form>

            <motion.button
              whileHover={{ x: -5 }}
              onClick={() => navigate(-1)}
              className="w-full py-4 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> {t.admin.backToMain}
            </motion.button>
          </motion.div>
        </FadeIn>

        <FadeIn direction="up" delay={0.4}>
          <p className="text-center text-slate-700 text-[10px] font-bold uppercase tracking-widest">
            {t.admin.protocol}
          </p>
        </FadeIn>
      </div>
    </div>
  );
};

export default AdminAuthPage;
