import React, { useState, useEffect } from 'react';
import { Bell, Search, X, Check, Info, AlertCircle, CheckCircle2, Globe } from 'lucide-react';
import { User, UserRole } from '../types';
import type { Language } from '../services/language';
import { useLanguage } from '../services/useLanguage';
import { getStoredLanguage, LANGUAGE_OPTIONS, setStoredLanguage } from '../services/language';
import { roleApi } from '../../services/roleApi';
import { useNavigate } from 'react-router-dom';
import TakhetLogo from './Logo';

type NotificationItem = {
  id: string;
  title?: string | null;
  body?: string | null;
  type?: 'info' | 'alert' | 'success';
  createdAt?: string;
};

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const syncLanguage = () => setLang(getStoredLanguage());

    const loadNotifications = async () => {
      try {
        const data = await roleApi.myNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch {
        setNotifications([]);
      }
    };

    syncLanguage();
    void loadNotifications();
    window.addEventListener('storage_update', syncLanguage);
    return () => window.removeEventListener('storage_update', syncLanguage);
  }, []);

  const unreadCount = notifications.length;
  const roleLabel =
    user.role === UserRole.PATIENT
      ? t.roles.patient
      : user.role === UserRole.DOCTOR
        ? t.roles.doctor
        : user.role === UserRole.PARTNER
          ? t.roles.partner
          : t.roles.admin;

  const handleLangChange = (newLang: Language) => {
    setStoredLanguage(newLang);
    setLang(newLang);
    setIsLangOpen(false);
  };

  const handlePlatformSearch = () => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return;

    const patientRoute =
      query.includes('архив') || query.includes('анализ')
        ? '/archive'
        : query.includes('врач') || query.includes('запис') || query.includes('конс')
          ? '/doctors-search'
          : query.includes('чат') || query.includes('уведом')
            ? '/chat'
            : query.includes('настрой')
              ? '/settings'
              : '/appointments';

    const doctorRoute = query.includes('пациент') ? '/patients' : query.includes('фин') ? '/finances' : query.includes('настрой') ? '/settings' : '/consultations';

    const partnerRoute = query.includes('врач') ? '/partner-doctors' : query.includes('фин') ? '/finances' : query.includes('настрой') ? '/settings' : '/reports';

    const route =
      user.role === UserRole.PATIENT
        ? patientRoute
        : user.role === UserRole.DOCTOR
          ? doctorRoute
          : user.role === UserRole.PARTNER
            ? partnerRoute
            : '/admin-dashboard';

    navigate(route);
  };

  return (
    <header className="bg-background/70 backdrop-blur-xl border-b border-border flex items-center justify-between gap-3 px-3 sm:px-5 md:px-8 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-xl pl-14 sm:pl-16 lg:pl-0">
        <button onClick={() => navigate('/?landing=1')} className="hidden md:hidden sm:hidden max-lg:flex items-center gap-2 shrink-0 rounded-2xl bg-secondary/40 px-3 py-2 border border-border/60">
          <TakhetLogo className="w-6 h-6" />
          <span className="text-xs font-black tracking-tight text-foreground">Takhet<span className="text-primary">+</span></span>
        </button>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlatformSearch()}
            placeholder={t.common.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 relative shrink-0">
        <div className="relative">
          <button onClick={() => setIsLangOpen(!isLangOpen)} className="p-2.5 rounded-full text-muted-foreground hover:bg-secondary transition-all flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{lang}</span>
          </button>
          {isLangOpen && (
            <div className="absolute top-14 right-0 bg-background rounded-2xl border border-border shadow-2xl p-2 w-32 animate-in fade-in zoom-in-95 z-[60]">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleLangChange(option.value)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${lang === option.value ? 'bg-primary/5 text-primary' : 'hover:bg-secondary text-muted-foreground'}`}
                >
                  <span>{option.flag} {option.label}</span> {lang === option.value && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-2.5 rounded-full relative transition-all ${isNotifOpen ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-background rounded-full text-[8px] flex items-center justify-center text-white font-black animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </button>

        {isNotifOpen && (
          <div className="absolute top-14 right-0 w-[min(22rem,calc(100vw-1.5rem))] sm:w-80 md:w-96 bg-background rounded-[2rem] border border-border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
              <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t.common.notifications}</h4>
              <button onClick={() => setIsNotifOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto no-scrollbar divide-y divide-border">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="p-5 flex gap-4 transition-all bg-primary/5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notification.type === 'success' ? 'bg-success/10 text-success' : notification.type === 'alert' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-primary'}`}>
                      {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : notification.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm tracking-tight font-black text-foreground">{notification.title || t.common.notificationFallbackTitle}</p>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{notification.body || t.common.notificationFallbackBody}</p>
                      <p className="text-[10px] text-muted font-black uppercase">{notification.createdAt ? new Date(notification.createdAt).toLocaleString(lang === 'kk' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU') : t.common.recently}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs">{t.common.emptyNotifications}</div>
              )}
            </div>
          </div>
        )}

        <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

        <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 max-w-[110px] sm:max-w-[200px] min-w-0">
          <div className="text-right hidden md:block min-w-0">
            <p className="text-sm font-black text-foreground leading-tight break-words">{user.name}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest break-words">{roleLabel}</p>
          </div>
          <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden shadow-sm shrink-0">
            <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
