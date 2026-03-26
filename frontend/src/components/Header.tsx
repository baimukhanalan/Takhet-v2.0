import React, { useState, useEffect } from 'react';
import { Bell, Search, X, Check, Info, AlertCircle, CheckCircle2, Globe } from 'lucide-react';
import { User } from '../types';
import { MockDB, Notification } from '../services/db';
import { Language } from '../services/i18n';
import { useLanguage } from '../services/useLanguage';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const { t } = useLanguage();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [lang, setLang] = useState<Language>(MockDB.getLang());

  useEffect(() => {
    const load = () => {
      setNotifications(MockDB.getNotifications());
      setLang(MockDB.getLang());
    };
    load();
    window.addEventListener('storage_update', load);
    return () => window.removeEventListener('storage_update', load);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLangChange = (newLang: Language) => {
    MockDB.setLang(newLang);
    setIsLangOpen(false);
  };

  return (
    <header className="h-20 lg:h-16 bg-background/70 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
      <div className="flex-1 max-w-xl pl-16 lg:pl-0">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={t.common.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none font-medium"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 relative">
        <div className="relative">
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="p-2.5 rounded-full text-muted-foreground hover:bg-secondary transition-all flex items-center gap-2"
          >
            <Globe className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{lang}</span>
          </button>
          {isLangOpen && (
            <div className="absolute top-14 right-0 bg-background rounded-2xl border border-border shadow-2xl p-2 w-32 animate-in fade-in zoom-in-95 z-[60]">
              {(['ru', 'kz', 'en'] as Language[]).map(l => (
                <button 
                  key={l}
                  onClick={() => handleLangChange(l)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${lang === l ? 'bg-primary/5 text-primary' : 'hover:bg-secondary text-muted-foreground'}`}
                >
                  {l} {lang === l && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className={`p-2.5 rounded-full relative transition-all ${isNotifOpen ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary'}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-background rounded-full text-[8px] flex items-center justify-center text-white font-black animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </button>
        {/* Notification Dropdown */}
        {isNotifOpen && (
          <div className="absolute top-14 right-0 w-80 md:w-96 bg-background rounded-[2rem] border border-border shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
               <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{t.common.notifications}</h4>
               <button onClick={() => setIsNotifOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="max-h-96 overflow-y-auto no-scrollbar divide-y divide-border">
               {notifications.length > 0 ? notifications.map(n => (
                 <div 
                   key={n.id} 
                   onClick={() => MockDB.markNotificationRead(n.id)}
                   className={`p-5 flex gap-4 transition-all cursor-pointer ${!n.isRead ? 'bg-primary/5' : 'hover:bg-secondary'}`}
                 >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                     n.type === 'success' ? 'bg-success/10 text-success' : 
                     n.type === 'alert' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-primary'
                   }`}>
                     {n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
                      n.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                   </div>
                   <div className="flex-1 space-y-1">
                      <p className={`text-sm tracking-tight ${!n.isRead ? 'font-black text-foreground' : 'font-bold text-muted-foreground'}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-muted font-black uppercase">{n.time}</p>
                   </div>
                 </div>
               )) : (
                 <div className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs">{t.common.emptyNotifications}</div>
               )}
            </div>
          </div>
        )}
        
        <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 pl-2 max-w-[120px] sm:max-w-[200px]">
          <div className="text-right hidden md:block min-w-0">
            <p className="text-sm font-black text-foreground leading-tight break-words">{user.name}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest break-words">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden shadow-sm shrink-0">
            <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
