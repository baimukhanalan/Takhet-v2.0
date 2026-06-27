import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Check, Globe, Menu, X } from 'lucide-react';
import { UserRole } from '../types';
import type { Language } from '../services/language';
import { getStoredLanguage, LANGUAGE_OPTIONS, setStoredLanguage } from '../services/language';
import { useLanguage } from '../services/useLanguage';

interface PublicHeaderProps {
  onLogin?: (role: UserRole) => void;
  activePath: string;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ activePath }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [scrollProgress, setScrollProgress] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const handleUpdate = () => setLang(getStoredLanguage());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  useEffect(() => {
    let frame = 0;
    const updateScrollProgress = () => {
      frame = 0;
      setScrollProgress(Math.max(0, Math.min(1, window.scrollY / 130)));
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateScrollProgress);
    };

    updateScrollProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
    };
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
    { name: t.nav.academy, path: '/academy' },
    { name: t.nav.mental, path: '/mental' },
    { name: t.nav.labs, path: '/takhet-labs' },
    { name: t.nav.enterprise, path: '/enterprise' },
  ];

  return (
    <>
      <header
        className={`takhet-flow-header ${isMenuOpen ? 'takhet-flow-header--menu-open' : ''}`}
        style={{ '--takhet-header-progress': scrollProgress } as React.CSSProperties}
      >
        <div className="takhet-flow-header__bar">
          <Link to="/" className="takhet-flow-header__logo">
            {!isMenuOpen ? <>Takhet<span>+</span></> : null}
          </Link>

          <nav className="takhet-flow-header__nav" aria-label="Основная навигация">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                state={link.state}
                className={activePath === link.path ? 'is-active' : undefined}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="takhet-flow-header__actions">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="takhet-flow-header__language"
                aria-label="Выбрать язык"
                aria-expanded={isLangOpen}
              >
                <Globe aria-hidden="true" />
                <span>{lang}</span>
              </button>
              {isLangOpen ? (
                <div className="takhet-flow-header__language-menu">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <button key={option.value} type="button" onClick={() => handleLangChange(option.value)} className={lang === option.value ? 'is-active' : undefined}>
                      <span>{option.flag} {option.label}</span>
                      {lang === option.value ? <Check aria-hidden="true" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="takhet-flow-header__auth-actions">
              <button type="button" onClick={() => navigate('/auth', { state: { mode: 'login', from: location, forcePublicAuth: true } })}>
                {t.nav.auth}
              </button>
              <button type="button" onClick={() => navigate('/auth', { state: { role: UserRole.PATIENT, mode: 'register', from: location, forcePublicAuth: true } })} className="takhet-flow-header__register">
                {t.nav.reg}
              </button>
            </div>

            <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} className="takhet-flow-header__menu" aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}>
              {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
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
