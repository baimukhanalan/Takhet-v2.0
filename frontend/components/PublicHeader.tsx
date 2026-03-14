
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Menu, X, Check } from 'lucide-react';
import { UserRole } from '../types';
import { MockDB } from '../services/db';
import { translations, Language } from '../services/i18n';

interface PublicHeaderProps {
  onLogin?: (role: UserRole) => void;
  activePath: string;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ activePath }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  const navigate = useNavigate();

  useEffect(() => {
    const handleUpdate = () => setLang(MockDB.getLang());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const t = translations[lang];

  const handleLangChange = (newLang: Language) => {
    MockDB.setLang(newLang);
    setIsLangOpen(false);
  };

  const navLinks = [
    { name: t.nav.patients, path: '/' },
    { name: t.nav.community, path: '/community' },
    { name: t.nav.doctors, path: '/doctors' },
    { name: t.nav.partners, path: '/partners' },
    { name: t.nav.mental, path: '/mental' },
  ];

  return (
    <>
      <header className={`fixed top-0 w-full z-[200] transition-all duration-500 h-20 flex items-center justify-between px-6 md:px-20 ${isMenuOpen ? 'bg-transparent border-transparent' : 'bg-white/70 backdrop-blur-2xl border-b border-slate-100'}`}>
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2">
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
          <div className="relative">
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="p-3 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <Globe className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{lang}</span>
            </button>
            {isLangOpen && (
              <div className="absolute top-14 right-0 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2 w-32 animate-in fade-in zoom-in-95">
                {(['ru', 'kz', 'en'] as Language[]).map(l => (
                  <button 
                    key={l}
                    onClick={() => handleLangChange(l)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${lang === l ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 text-slate-400'}`}
                  >
                    {l} {lang === l && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => navigate('/auth', { state: { mode: 'login' } })} 
              className="text-xs font-black uppercase tracking-widest text-slate-500 px-6 py-3 hover:bg-slate-50 rounded-2xl transition-all"
            >
              {t.nav.auth}
            </button>
            <button 
              onClick={() => navigate('/auth', { state: { mode: 'register' } })} 
              className="bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
            >
              {t.nav.reg}
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
                className="flex-1 py-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] text-white font-black text-lg uppercase tracking-widest"
              >
                {t.nav.auth}
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); navigate('/auth', { state: { mode: 'register' } }); }} 
                className="flex-1 py-6 bg-white rounded-[2.5rem] text-primary font-black text-lg uppercase tracking-widest shadow-2xl"
              >
                {t.nav.reg}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicHeader;
