
import React, { useState, useEffect } from 'react';
import { Bell, Search, User as UserIcon, X, Check, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { MockDB, Notification } from '../services/db';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const load = () => setNotifications(MockDB.getNotifications());
    load();
    window.addEventListener('storage_update', load);
    return () => window.removeEventListener('storage_update', load);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-20 lg:h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
      <div className="flex-1 max-w-xl pl-12 lg:pl-0">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Поиск по системе..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 relative">
        <button 
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className={`p-2.5 rounded-full relative transition-all ${isNotifOpen ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-white rounded-full text-[8px] flex items-center justify-center text-white font-black animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isNotifOpen && (
          <div className="absolute top-14 right-0 w-80 md:w-96 bg-white rounded-[2rem] border border-slate-100 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
               <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Уведомления</h4>
               <button onClick={() => setIsNotifOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="max-h-96 overflow-y-auto no-scrollbar divide-y divide-slate-50">
               {notifications.length > 0 ? notifications.map(n => (
                 <div 
                   key={n.id} 
                   onClick={() => MockDB.markNotificationRead(n.id)}
                   className={`p-5 flex gap-4 transition-all cursor-pointer ${!n.isRead ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                 >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                     n.type === 'success' ? 'bg-success/10 text-success' : 
                     n.type === 'alert' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-primary'
                   }`}>
                     {n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
                      n.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                   </div>
                   <div className="flex-1 space-y-1">
                      <p className={`text-sm tracking-tight ${!n.isRead ? 'font-black text-slate-800' : 'font-bold text-slate-500'}`}>{n.title}</p>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">{n.body}</p>
                      <p className="text-[10px] text-slate-300 font-black uppercase">{n.time}</p>
                   </div>
                 </div>
               )) : (
                 <div className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs">Уведомлений нет</div>
               )}
            </div>
          </div>
        )}
        
        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-slate-800 leading-tight">{user.name}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden shadow-sm">
            <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
