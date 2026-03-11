import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronRight, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import { api } from '../services/api';

interface AdminAuthPageProps {
  onLogin: (role: UserRole, token?: string) => void;
}

const AdminAuthPage: React.FC<AdminAuthPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('baimukhanalan1@gmail.com');
  const [password, setPassword] = useState('baimukhanalan1@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role: 'admin' })
      });

      onLogin(UserRole.ADMIN, response.access_token);
      navigate('/admin-dashboard');
    } catch {
      setError('Неверные учетные данные администратора.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] -ml-40 -mb-40"></div>

      <div className="w-full max-w-lg space-y-10 relative z-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl backdrop-blur-xl">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Takhet<span className="text-primary">+</span> Admin</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Панель управления системой</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-10 md:p-14 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                <input required type="email" placeholder="Email администратора" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 rounded-3xl pl-16 pr-6 py-5 outline-none focus:border-primary focus:bg-slate-900 text-white font-bold transition-all" />
              </div>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                <input required type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-white/5 rounded-3xl pl-16 pr-6 py-5 outline-none focus:border-primary focus:bg-slate-900 text-white font-bold transition-all" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold animate-shake">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <button disabled={isLoading} className={`w-full py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 ${isLoading ? 'bg-slate-800 text-slate-600' : 'bg-primary text-white hover:bg-blue-600 shadow-primary/30'}`}>
              {isLoading ? 'Проверка...' : 'Войти в систему'} <ChevronRight className="w-5 h-5" />
            </button>
          </form>

          <button onClick={() => navigate('/')} className="w-full py-4 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Вернуться на главную
          </button>
        </div>

        <p className="text-center text-slate-700 text-[10px] font-bold uppercase tracking-widest">Takhet+ Medical OS Security Protocol v4.2</p>
      </div>
    </div>
  );
};

export default AdminAuthPage;
