import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, FileText, ChevronRight, CheckCircle2, MoreVertical, Play, ArrowRight, Download, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MockDB } from '../services/db';
import { Appointment } from '../types';

const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    setAppointments(MockDB.getAppointments());
    const handleUpdate = () => setAppointments(MockDB.getAppointments());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const upcoming = appointments.filter(app => app.status !== 'completed' && app.status !== 'cancelled');
  const past = appointments.filter(app => app.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto space-y-10 md:space-y-16 pb-32 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-none uppercase">Мои приемы</h1>
          <p className="text-muted-foreground text-base md:text-lg font-medium">Ваше здоровье — по расписанию.</p>
        </div>
        <Link to="/doctors-search" className="w-full md:w-auto px-6 md:px-10 py-4 md:py-5 bg-white border border-border rounded-xl md:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3">
          Новая запись <Plus className="w-4 h-4" />
        </Link>
      </div>

      {/* Upcoming Section */}
      <section className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-8 md:w-12 h-px bg-primary/20"></div>
           <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] text-primary">Предстоящие консультации</h2>
        </div>
        <div className="grid gap-4 md:gap-6">
          {upcoming.length > 0 ? upcoming.map(app => {
            const isNow = app.status === 'ongoing';
            return (
              <div key={app.id} className={`bg-white p-6 md:p-8 rounded-3xl md:rounded-[3.5rem] border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 ${isNow ? 'border-primary shadow-2xl shadow-primary/10 ring-4 ring-primary/5' : 'border-border shadow-sm'}`}>
                <div className="flex items-center gap-4 md:gap-8 w-full lg:w-auto">
                  <div className={`w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-[2rem] flex items-center justify-center shrink-0 relative ${isNow ? 'bg-primary text-white' : 'bg-blue-50 text-primary'}`}>
                    {isNow ? <Play className="w-6 h-6 md:w-10 md:h-10 fill-current" /> : <Calendar className="w-6 h-6 md:w-10 md:h-10" />}
                    {isNow && <span className="absolute -top-1 -right-1 w-4 h-4 md:w-6 md:h-6 bg-red-500 border-2 md:border-4 border-white rounded-full animate-ping"></span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                      <h3 className="text-lg md:text-2xl font-black text-foreground leading-tight break-words">{app.doctorName}</h3>
                      {isNow && <span className="px-3 py-1 bg-red-50 text-red-600 text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-widest">Прямо сейчас</span>}
                    </div>
                    <p className="text-[10px] md:text-sm font-bold text-primary mb-2 md:mb-3 uppercase tracking-widest opacity-70">Видео-консультация</p>
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-1.5 md:gap-2"><Calendar className="w-3 h-3 md:w-4 md:h-4 text-primary" /> {app.date}</span>
                      <span className="flex items-center gap-1.5 md:gap-2"><Clock className="w-3 h-3 md:w-4 md:h-4 text-primary" /> {app.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 w-full lg:w-auto">
                   <Link 
                    to={`/consultation/${app.id}`} 
                    className={`flex-1 lg:flex-none px-6 md:px-12 py-4 md:py-5 rounded-xl md:rounded-[2rem] font-black text-sm md:text-lg transition-all flex items-center justify-center gap-2 md:gap-3 ${isNow ? 'bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-105' : 'bg-slate-100 text-foreground hover:bg-slate-200'}`}
                  >
                    {isNow ? 'Подключиться' : 'Детали'} <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </Link>
                  <button className="p-4 md:p-5 bg-slate-50 text-muted-foreground rounded-xl md:rounded-[2rem] hover:bg-slate-100 transition-colors">
                    <MoreVertical className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>
            )
          }) : (
            <div className="py-16 md:py-24 bg-slate-50/50 rounded-3xl md:rounded-[4rem] border-4 border-dashed border-slate-100 text-center space-y-4">
               <Calendar className="w-10 h-10 md:w-12 md:h-12 text-slate-200 mx-auto" />
               <p className="text-slate-400 font-bold text-base md:text-xl uppercase tracking-widest">У вас нет активных записей</p>
            </div>
          )}
        </div>
      </section>

      {/* Past Section */}
      <section className="space-y-6 md:space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-8 md:w-12 h-px bg-muted"></div>
           <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">История посещений</h2>
        </div>
        <div className="grid gap-3 md:gap-4">
          {past.length > 0 ? past.map(app => (
            <div key={app.id} className="bg-white/60 p-5 md:p-8 rounded-2xl md:rounded-[3rem] border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 group hover:bg-white transition-all opacity-80 hover:opacity-100">
              <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-100 text-muted-foreground flex items-center justify-center shrink-0 group-hover:bg-success/10 group-hover:text-success transition-colors">
                  <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base md:text-xl font-black text-foreground leading-tight break-words">{app.doctorName}</h3>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{app.date} • {app.time} • Завершено</p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none px-4 md:px-8 py-3 md:py-4 bg-primary/5 text-primary rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
                  <Download className="w-3 h-3 md:w-4 md:h-4" /> Заключение
                </button>
                <button className="flex-1 sm:flex-none px-4 md:px-8 py-3 md:py-4 border border-border rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Чат
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-16 md:py-20 opacity-30 font-black uppercase tracking-[0.4em] text-xs md:text-sm">История пуста</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PatientAppointments;
