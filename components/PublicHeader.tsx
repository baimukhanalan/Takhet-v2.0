
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Globe, Menu, X, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

interface PublicHeaderProps {
  onLogin?: (role: UserRole) => void;
  activePath: string;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ activePath }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lang, setLang] = useState('ru');
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Пациентам', path: '/' },
    { name: 'Сообщество', path: '/community' },
    { name: 'Врачам', path: '/doctors' },
    { name: 'Партнерам', path: '/partners' },
    { name: 'Mental', path: '/mental' },
  ];

  return (
    <>
      <header className={`fixed top-0 w-full z-[200] transition-all duration-500 h-20 flex items-center justify-between px-6 md:px-20 ${isMenuOpen ? 'bg-transparent border-transparent' : 'bg-white/70 backdrop-blur-2xl border-b border-slate-100'}`}>
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-primary/20">
              <HeartPulse className="text-white w-6 h-6" />
            </div>
            {!isMenuOpen && (
              <span className="text-2xl font-black tracking-tight text-foreground animate-in fade-in duration-500">Takhet<span className="text-primary">+</span></span>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`text-[11px] font-black transition-all uppercase tracking-[0.2em] ${
                  activePath === link.path ? 'text-primary' : 'text-slate-400 hover:text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => navigate('/auth', { state: { mode: 'login' } })} 
              className="text-xs font-black uppercase tracking-widest text-slate-500 px-6 py-3 hover:bg-slate-50 rounded-2xl transition-all"
            >
              Войти
            </button>
            <button 
              onClick={() => navigate('/auth', { state: { mode: 'register' } })} 
              className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
            >
              Регистрация
            </button>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className={`p-3 rounded-2xl transition-all active:scale-90 ${isMenuOpen ? 'bg-white text-primary rotate-90' : 'bg-slate-100 text-foreground md:hidden'}`}
          >
            {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </header>

      {/* High-End Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[190] bg-primary flex flex-col pt-32 px-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          </div>
          
          <nav className="space-y-6 relative z-10">
            {navLinks.map((link, i) => (
              <Link 
                key={link.name} 
                to={link.path} 
                onClick={() => setIsMenuOpen(false)}
                className="block text-5xl font-black text-white/40 hover:text-white transition-all transform hover:translate-x-4 tracking-tighter animate-in slide-in-from-left duration-500"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pb-16 space-y-6 relative z-10">
            <div className="flex gap-4">
              <button 
                onClick={() => { setIsMenuOpen(false); navigate('/auth', { state: { mode: 'login' } }); }} 
                className="flex-1 py-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] text-white font-black text-lg uppercase tracking-widest active:scale-95 transition-all"
              >
                Войти
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); navigate('/auth', { state: { mode: 'register' } }); }} 
                className="flex-1 py-6 bg-white rounded-[2.5rem] text-primary font-black text-lg uppercase tracking-widest active:scale-95 transition-all shadow-2xl"
              >
                Начать
              </button>
            </div>
            <button onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} className="w-full flex items-center justify-center gap-2 text-white/50 font-black uppercase tracking-[0.3em] text-xs">
              <Globe className="w-4 h-4" /> Язык: {lang}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicHeader;
