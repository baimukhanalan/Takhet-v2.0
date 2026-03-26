import React, { useState, useEffect } from 'react';
// Added Activity to the imports to resolve the ReferenceError on line 99
import { Video, Clock, CheckCircle2, ChevronRight, User, Calendar, FileText, Settings, Plus, Key, Download, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MockDB } from '../services/db';
import { Appointment } from '../types';

const DoctorConsultations: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const load = () => setAppointments(MockDB.getAppointments());
    load();
    window.addEventListener('storage_update', load);
    return () => window.removeEventListener('storage_update', load);
  }, []);

  const upcoming = appointments.filter(app => app.status !== 'completed' && app.status !== 'cancelled');
  const past = appointments.filter(app => app.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-32 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase">Приемы и Архив</h1>
          <p className="text-muted-foreground mt-2 font-medium text-lg">Управляйте текущими записями и просматривайте подписанные отчеты.</p>
        </div>
        <button className="px-8 py-4 bg-white border border-border rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3">
          <Settings className="w-5 h-5" /> Настройка графика
        </button>
      </div>

      <section className="space-y-8">
        <h2 className="text-2xl font-black uppercase tracking-widest text-primary flex items-center gap-4">
          <Calendar className="w-8 h-8" /> Сегодня
        </h2>
        <div className="grid gap-6">
          {upcoming.length > 0 ? upcoming.map(app => (
            <div key={app.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-2xl transition-all">
              <div className="flex items-center gap-6 md:gap-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{app.patientName}</h3>
                  <div className="flex items-center gap-4 md:gap-6 mt-2 text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> {app.time}</span>
                    <span className="flex items-center gap-2 text-primary"><Video className="w-3.5 h-3.5 md:w-4 md:h-4" /> {app.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Link 
                  to={`/consultation/${app.id}`}
                  className={`flex-1 md:flex-none px-12 py-5 rounded-[2rem] font-black text-sm transition-all flex items-center justify-center gap-3 ${
                    app.status === 'ongoing' 
                      ? 'bg-red-600 text-white shadow-2xl shadow-red-200 hover:bg-red-700 animate-pulse' 
                      : 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105'
                  }`}
                >
                  {app.status === 'ongoing' ? 'Продолжить' : 'Начать прием'} <ChevronRight className="w-5 h-5" />
                </Link>
                <button className="px-8 py-5 border border-border rounded-[2rem] font-black text-sm hover:bg-slate-50 transition-all">
                  Карта
                </button>
              </div>
            </div>
          )) : (
             <div className="py-24 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100 text-center opacity-30">
               <p className="font-black text-xl uppercase tracking-widest">Записей на сегодня нет</p>
             </div>
          )}
        </div>
      </section>

      {/* ARCHIVE SECTION */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-6">
           <h2 className="text-xl font-black uppercase tracking-[0.3em] text-muted-foreground">Архив консультаций</h2>
           <span className="text-[10px] font-black uppercase tracking-widest text-success bg-success/5 px-3 py-1 rounded-lg border border-success/10 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" /> Все отчеты верифицированы
           </span>
        </div>
        <div className="grid gap-4">
          {past.length > 0 ? past.map(app => (
            <div key={app.id} className="bg-slate-50 p-8 rounded-[3.5rem] border border-border flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-white transition-all">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white text-emerald-500 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-foreground tracking-tight">{app.patientName}</h3>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{app.date}</p>
                     <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3 text-primary" /> Конец: {app.completedAt || '14:25'}
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Activity className="w-3 h-3 text-primary" /> Длит.: {app.durationMinutes || 25} мин
                     </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                   <Key className="w-4 h-4 text-emerald-600" />
                   <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Подписано</span>
                </div>
                <button className="p-4 bg-white border border-border rounded-2xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                   <Download className="w-5 h-5" />
                </button>
                <button className="px-6 py-4 bg-white border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all">
                  Детали
                </button>
              </div>
            </div>
          )) : (
             <div className="text-center py-20 opacity-30 font-black uppercase tracking-[0.4em]">История приемов пуста</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DoctorConsultations;
