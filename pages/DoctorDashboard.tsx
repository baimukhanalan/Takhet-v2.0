
import React, { useState, useEffect } from 'react';
import { User, Appointment, SwarmCase } from '../types';
// Added Clock and Zap to the imports to resolve the missing names in JSX
import { Users, Video, DollarSign, Star, Calendar as CalendarIcon, ArrowUpRight, TrendingUp, Radar, ShieldEllipsis, CheckCircle2, ChevronRight, Award, Clock, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { MockDB } from '../services/db';
import { translations, Language } from '../services/i18n';

const DoctorDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [swarmCases, setSwarmCases] = useState<SwarmCase[]>([]);
  const [stats, setStats] = useState(MockDB.getDoctorStats());
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
  const [lang, setLang] = useState<Language>(MockDB.getLang());

  useEffect(() => {
    const loadData = () => {
      setLang(MockDB.getLang());
      setAppointments(MockDB.getAppointments().filter(a => a.status !== 'completed'));
      setSwarmCases(MockDB.getOpenSwarmCases());
      setStats(MockDB.getDoctorStats());
      setRevenueHistory(MockDB.getRevenueHistory());
    };
    loadData();
    window.addEventListener('storage_update', loadData);
    return () => window.removeEventListener('storage_update', loadData);
  }, []);

  const t = translations[lang];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {t.dashboard.welcome}, <span className="text-primary italic">Dr. {user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">Expert Dashboard • v4.2 stable</p>
        </div>
        <div className="flex items-center gap-8 bg-white px-8 py-5 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Reputation</span>
            <div className="flex items-center gap-2 text-primary font-black text-2xl">
               <Award className="w-5 h-5 text-indigo-500" /> {stats.revenue / 1000} pts
            </div>
          </div>
          <div className="w-px h-10 bg-slate-100"></div>
          <div className="flex items-center gap-3 text-amber-500">
            <Star className="w-6 h-6 fill-current" />
            <span className="text-2xl font-black">{stats.rating}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
        {[
          { icon: Video, color: 'bg-blue-50 text-primary', label: 'Сессии', val: stats.sessions },
          { icon: Users, color: 'bg-emerald-50 text-emerald-600', label: 'Пациенты', val: stats.patients },
          { icon: DollarSign, color: 'bg-orange-50 text-orange-600', label: 'Доход', val: `₸${stats.revenue.toLocaleString()}` },
          { icon: Radar, color: 'bg-indigo-50 text-indigo-600', label: 'Swarm Tasks', val: swarmCases.length },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] border border-border shadow-sm flex items-center gap-6 group hover:scale-[1.02] transition-all">
            <div className={`w-14 h-14 ${stat.color} rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-2">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* SWARM MEDICINE PANEL FOR DOCTORS */}
        <div className="lg:col-span-8 space-y-10">
           <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-xl font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><ShieldEllipsis className="w-6 h-6" /> Swarm Medicine Задачи</h3>
                 <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">+50 pts за консенсус</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {swarmCases.length > 0 ? swarmCases.map(sc => (
                   <div key={sc.id} className="bg-indigo-900 p-8 rounded-[3.5rem] text-white space-y-6 relative overflow-hidden group hover:scale-[1.02] transition-all shadow-xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[60px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
                      <div className="relative z-10 flex justify-between items-start">
                         <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <Radar className="w-6 h-6" />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-3 py-1 rounded-full">New Case</span>
                      </div>
                      <div className="relative z-10">
                         <h4 className="text-xl font-black tracking-tight">{sc.specialtyRequired}</h4>
                         <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">Анонимное рассмотрение</p>
                      </div>
                      <p className="relative z-10 text-sm text-indigo-100/60 font-medium leading-relaxed italic">«Нетипичные изменения на снимке. Требуется второе экспертное мнение для уточнения...»</p>
                      <button className="relative z-10 w-full py-4 bg-white text-indigo-900 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-50 transition-colors">
                        Рассмотреть кейс
                      </button>
                   </div>
                 )) : (
                   <div className="col-span-full py-16 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[3.5rem] text-center">
                      <p className="text-slate-300 font-black uppercase tracking-widest">Нет активных Swarm запросов</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-400 flex items-center gap-3 px-2"><CalendarIcon className="w-6 h-6" /> Мои приемы</h3>
              <div className="grid gap-4">
                 {appointments.map(app => (
                    <div key={app.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:shadow-xl transition-all">
                       <div className="flex items-center gap-6">
                          <img src={`https://picsum.photos/seed/${app.id}/100`} className="w-14 h-14 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all shadow-md" />
                          <div>
                             <h4 className="font-black text-xl text-slate-900">{app.patientName}</h4>
                             <div className="flex items-center gap-4 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> {app.time}</span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-primary">{app.type}</span>
                             </div>
                          </div>
                       </div>
                       <Link to={`/consultation/${app.id}`} className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all shadow-lg flex items-center gap-3">
                          {app.status === 'ongoing' ? 'В эфире' : 'Начать'} <ChevronRight className="w-4 h-4" />
                       </Link>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* RIGHT ANALYTICS SIDEBAR */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Выручка</h3>
                 <span className="text-success font-black text-[10px]">+14.2%</span>
              </div>
              <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueHistory}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" hide />
                       <YAxis hide />
                       <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}} />
                       <Bar dataKey="amount" fill="#0D47A1" radius={[8, 8, 8, 8]} barSize={20}>
                          {revenueHistory.map((e, i) => <Cell key={i} fill={i === revenueHistory.length-1 ? '#0D47A1' : '#cbd5e1'} />)}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
              <div className="pt-6 border-t border-slate-50">
                 <Link to="/finances" className="w-full py-5 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3">
                    Весь отчет <TrendingUp className="w-4 h-4" />
                 </Link>
              </div>
           </div>

           <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-10 -mt-10" />
              <div className="relative z-10 space-y-8">
                 <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center"><Zap className="w-8 h-8 text-primary" /></div>
                 <div>
                    <h4 className="text-2xl font-black uppercase tracking-tight leading-tight">Takhet+ <br/>AI Copilot</h4>
                    <p className="text-slate-400 text-sm font-medium mt-4 leading-relaxed">Система проанализировала загруженные данные пациентов на сегодня и выявила 2 критических отклонения.</p>
                 </div>
                 <Link to="/ai-analysis" className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl block text-center hover:bg-blue-600 transition-all">Проверить Red Flags</Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;