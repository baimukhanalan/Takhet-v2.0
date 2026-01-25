
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Globe, Menu, X } from 'lucide-react';
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
    <header className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-border h-20 flex items-center justify-between px-6 md:px-20">
      <div className="flex items-center gap-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <HeartPulse className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-foreground">Takhet<span className="text-primary">+</span></span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path} 
              className={`text-sm font-bold transition-colors uppercase tracking-widest ${
                activePath === link.path ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <button onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-border text-xs font-bold uppercase">
          <Globe className="w-4 h-4" /> {lang}
        </button>
        
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={() => navigate('/auth', { state: { mode: 'login' } })} 
            className="text-sm font-bold text-foreground px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Войти
          </button>
          <button 
            onClick={() => navigate('/auth', { state: { mode: 'register' } })} 
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            Регистрация
          </button>
        </div>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-foreground">
          {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b border-border p-6 lg:hidden flex flex-col gap-4 animate-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path} 
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-black text-foreground hover:text-primary transition-colors uppercase tracking-widest"
            >
              {link.name}
            </Link>
          ))}
          <hr className="border-border" />
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate('/auth', { state: { mode: 'login' } })} className="w-full py-4 bg-slate-100 rounded-xl font-bold">Войти</button>
            <button onClick={() => navigate('/auth', { state: { mode: 'register' } })} className="w-full py-4 bg-primary text-white rounded-xl font-bold">Регистрация</button>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
