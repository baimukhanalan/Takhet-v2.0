import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Check, Globe, Menu, X } from 'lucide-react';
import { UserRole } from '../types';
import type { Language } from '../services/language';
import { getStoredLanguage, setStoredLanguage } from '../services/language';
import { useLanguage } from '../services/useLanguage';

interface PublicHeaderProps {
  onLogin?: (role: UserRole) => void;
  activePath: string;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ activePath }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const handleUpdate = () => setLang(getStoredLanguage());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const handleLangChange = (newLang: Language) => {
    setStoredLanguage(newLang);
    setLang(newLang);
    setIsLangOpen(false);
  };

  const navLinks: { name: string; path: string; state?: unknown }[] = [
    { name: t.nav.patients, path: '/' },
    { name: t.sidebar.services, path: '/services' },
    { name: t.nav.takhetAI, path: '/takhet-ai/try' },
    { name: t.nav.doctors, path: '/doctors' },
    { name: t.nav.partners, path: '/partners' },
    { name: t.nav.mental, path: '/mental' },
    { name: 'Takhet Labs', path: '/takhet-labs' },
    { name: 'Enterprise', path: '/enterprise' },
  ];

  return (
    <>
      <header className={`fixed top-0 w-full z-[200] transition-all duration-500 min-h-20 flex items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-20 ${isMenuOpen ? 'bg-transparent border-transparent' : 'bg-background/70 backdrop-blur-2xl border-b border-border'}`}>
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            {!isMenuOpen && <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground animate-in fade-in duration-500">Takhet<span className="text-primary">+</span></span>}
          </Link>
          <nav className="hidden xl:flex items-center gap-6 2xl:gap-8 min-w-0">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                state={link.state}
                className={`text-[10px] 2xl:text-[11px] font-black transition-all uppercase tracking-[0.2em] whitespace-nowrap ${activePath === link.path ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          <div className="relative">
            <button onClick={() => setIsLangOpen(!isLangOpen)} className="p-3 rounded-2xl bg-secondary text-muted-foreground hover:bg-secondary/80 transition-all flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{lang}</span>
            </button>
            {isLangOpen && (
              <div className="absolute top-14 right-0 bg-background rounded-2xl border border-border shadow-2xl p-2 w-32 animate-in fade-in zoom-in-95">
                {(['ru', 'kz', 'en'] as Language[]).map((l) => (
                  <button key={l} onClick={() => handleLangChange(l)} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${lang === l ? 'bg-primary/5 text-primary' : 'hover:bg-secondary text-muted-foreground'}`}>
                    {l} {lang === l && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button onClick={() => navigate('/auth', { state: { mode: 'login', from: location, forcePublicAuth: true } })} className="text-xs font-black uppercase tracking-widest text-muted-foreground px-5 xl:px-6 py-3 hover:bg-secondary rounded-2xl transition-all whitespace-nowrap">
              {t.nav.auth}
            </button>
            <button onClick={() => navigate('/auth', { state: { role: UserRole.PATIENT, mode: 'register', from: location, forcePublicAuth: true } })} className="bg-primary text-white px-6 xl:px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
              {t.nav.reg}
            </button>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`p-3 rounded-2xl transition-all active:scale-90 ${isMenuOpen ? 'bg-background text-primary rotate-90' : 'bg-secondary text-foreground xl:hidden'}`}>
            {isMenuOpen ? <X className="w-7 h-7 sm:w-8 sm:h-8" /> : <Menu className="w-6 h-6 sm:w-7 sm:h-7" />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[190] bg-primary flex flex-col pt-24 sm:pt-28 px-5 sm:px-8 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
            <nav className="space-y-4 sm:space-y-5 relative z-10">
              {navLinks.map((link, i) => (
                <Link key={link.name} to={link.path} state={link.state} onClick={() => setIsMenuOpen(false)} className="block text-3xl sm:text-5xl font-black text-white/50 hover:text-white transition-all transform hover:translate-x-2 sm:hover:translate-x-4 tracking-tighter animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 80}ms` }}>
                  {link.name}
                </Link>
              ))}
            </nav>
            <div className="mt-auto pb-10 sm:pb-16 space-y-4 sm:space-y-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => { setIsMenuOpen(false); navigate('/auth', { state: { mode: 'login', from: location, forcePublicAuth: true } }); }} className="py-5 sm:py-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] sm:rounded-[2.5rem] text-white font-black text-base sm:text-lg uppercase tracking-widest">
                  {t.nav.auth}
                </button>
                <button onClick={() => { setIsMenuOpen(false); navigate('/auth', { state: { role: UserRole.PATIENT, mode: 'register', from: location, forcePublicAuth: true } }); }} className="py-5 sm:py-6 bg-white rounded-[1.5rem] sm:rounded-[2.5rem] text-primary font-black text-base sm:text-lg uppercase tracking-widest shadow-2xl">
                  {t.nav.reg}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicHeader;
