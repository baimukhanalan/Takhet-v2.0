import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  ArrowUpRight, ShoppingBag, Fingerprint, 
  BrainCircuit, Plus, X, Truck, Heart, Activity, Settings2, ShieldAlert,
  Mail, Shield, Zap, HeartPulse, Clock, ShieldAlert as DangerIcon, CheckCircle2, AlertCircle,
  Info, Video as VideoIcon, Gauge, ChevronRight, FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MockDB, Notification } from '../services/db';
import { translations, Language } from '../services/i18n';
import { motion, AnimatePresence } from 'motion/react';

const PatientDashboard: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [activeData, setActiveData] = useState<any>(null);
  const [lang, setLang] = useState<Language>(MockDB.getLang());

  useEffect(() => {
    const loadData = () => {
      setLang(MockDB.getLang());
      setActiveData(MockDB.getActiveMemberData());
    };
    loadData();
    window.addEventListener('storage_update', loadData);
    return () => window.removeEventListener('storage_update', loadData);
  }, []);

  const t = translations[lang];

  if (!activeData) return null;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-40 px-4 lg:px-0">
      
      {/* DASHBOARD HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row justify-between items-end gap-8"
      >
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
              <Activity className="w-3.5 h-3.5" /> {t.dashboard.welcome}
           </div>
           <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
             Ваше <span className="text-primary italic">здоровье</span> <br/> в одном месте
           </h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Последнее обновление</p>
              <p className="text-sm font-black text-slate-900">Сегодня, 12:45</p>
           </div>
           <button onClick={() => navigate('/settings')} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <Settings2 className="w-6 h-6 text-slate-400" />
           </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
        
        {/* MAIN CONTENT */}
        <div className="xl:col-span-8 space-y-12 lg:space-y-16">
            {/* STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.1 }}
                 className="p-6 md:p-8 bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm space-y-6 group hover:border-primary/20 transition-all"
               >
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                     <FileText className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Анализы</p>
                     <h4 className="text-3xl md:text-4xl font-black text-slate-900">14</h4>
                  </div>
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.2 }}
                 className="p-6 md:p-8 bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm space-y-6 group hover:border-emerald-200 transition-all"
               >
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
                     <VideoIcon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Консультации</p>
                     <h4 className="text-3xl md:text-4xl font-black text-slate-900">5</h4>
                  </div>
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.3 }}
                 className="p-6 md:p-8 bg-slate-900 rounded-[2rem] md:rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden group sm:col-span-2 md:col-span-1"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary backdrop-blur-xl border border-white/10 shadow-xl relative z-10">
                     <Zap className="w-7 h-7" />
                  </div>
                  <div className="relative z-10">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Статус</p>
                     <h4 className="text-2xl font-black uppercase tracking-tighter">Premium User</h4>
                  </div>
               </motion.div>
            </div>



           {/* RECENT ANALYSES SECTION */}
           <div className="space-y-10">
              <div className="flex items-center justify-between px-6">
                 <h3 className="text-3xl font-black uppercase tracking-tighter">Последние анализы</h3>
                 <Link to="/archive" className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all group">
                    Весь архив <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 {MockDB.getRecords().slice(0, 4).map((record) => (
                    <div key={record.id} className="p-6 md:p-10 bg-white rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer" onClick={() => navigate('/archive')}>
                       <div className="flex items-center gap-6 md:gap-8 mb-6 md:mb-8">
                          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform
                            ${record.type === 'Analysis' ? 'bg-blue-50 text-primary' : 
                              record.type === 'Photo' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                             <FileText className="w-6 h-6 md:w-8 md:h-8" />
                          </div>
                          <div className="min-w-0">
                             <h4 className="font-black text-lg md:text-xl text-slate-900 leading-tight break-words">{record.title}</h4>
                             <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 md:mt-1.5">{record.date}</p>
                          </div>
                       </div>
                       <p className="text-xs md:text-sm text-slate-500 font-medium line-clamp-2 italic mb-6 md:mb-8 leading-relaxed">"{record.summary}"</p>
                       <div className="flex items-center justify-between pt-6 md:pt-8 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                             <span className="text-[8px] md:text-[9px] font-black text-slate-900 uppercase tracking-widest">{record.status}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                       </div>
                    </div>
                 ))}
                 {MockDB.getRecords().length === 0 && (
                    <div className="col-span-full py-24 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                       <Activity className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                       <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Нет недавних анализов</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="xl:col-span-4 h-full space-y-10">
           <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-sm space-y-12 sticky top-24">
              <div className="space-y-8">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Ближайшее событие</h4>
                 <div className="p-8 bg-primary/5 border border-primary/10 rounded-[3rem] space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6">
                       <VideoIcon className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <div className="flex items-center gap-5">
                       <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border-2 border-white">
                          <img src="https://picsum.photos/seed/doctor/200" className="w-full h-full object-cover" alt="" />
                       </div>
                       <div>
                          <p className="text-xl font-black text-slate-900">Др. Каримова</p>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Терапевт</p>
                       </div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-primary/10">
                       <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-xs font-black text-slate-900">Завтра, 14:00</span>
                       </div>
                       <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Детали</button>
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Быстрый доступ</h4>
                 <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => navigate('/doctors-search')} className="w-full p-6 md:p-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-between group overflow-hidden">
                       <span className="break-words pr-2">Запись на прием</span>
                       <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => navigate('/archive')} className="w-full p-6 md:p-8 bg-slate-50 text-slate-900 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all flex items-center justify-between group">
                       <span className="break-words pr-2">Мед. архив</span>
                       <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-300" />
                    </button>
                    <button onClick={() => navigate('/portal/mental')} className="w-full p-6 md:p-8 bg-emerald-50 text-emerald-600 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-between group">
                       <span className="break-words pr-2">Mental Health</span>
                       <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-emerald-300" />
                    </button>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center gap-6">
                 <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400">
                    <Shield className="w-7 h-7" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Данные защищены</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">SSL Encryption Active</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
