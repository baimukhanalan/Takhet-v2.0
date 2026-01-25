
import React from 'react';
import { Calendar, Clock, Video, FileText, ChevronRight, CheckCircle2, MoreVertical, Play, ArrowRight, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_APPOINTMENTS = [
  { id: '1', doctor: 'Др. Михаил Михайлов', specialty: 'Кардиолог', time: '14:00', date: 'Сегодня', status: 'upcoming', type: 'Video', isNow: true },
  { id: '2', doctor: 'Др. Елена Петрова', specialty: 'Терапевт', time: '10:30', date: '25 Мая', status: 'upcoming', type: 'Chat', isNow: false },
  { id: '3', doctor: 'Др. Сергей Волков', specialty: 'Невролог', time: '09:00', date: '10 Мая', status: 'completed', type: 'Video' },
  { id: '4', doctor: 'Марат Смагулов', specialty: 'Психолог', time: '16:00', date: '05 Мая', status: 'completed', type: 'Video' },
];

const PatientAppointments: React.FC = () => {
  const upcoming = MOCK_APPOINTMENTS.filter(app => app.status === 'upcoming');
  const past = MOCK_APPOINTMENTS.filter(app => app.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-foreground tracking-tighter">Приемы</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Ваше здоровье — по расписанию.</p>
        </div>
        <button className="px-8 py-4 bg-white border border-border rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          Новая запись
        </button>
      </div>

      {/* Upcoming Section */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-px bg-primary/20"></div>
           <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Предстоящие консультации</h2>
        </div>
        <div className="grid gap-6">
          {upcoming.map(app => (
            <div key={app.id} className={`bg-white p-8 rounded-[3.5rem] border transition-all flex flex-col md:flex-row items-center justify-between gap-8 ${app.isNow ? 'border-primary shadow-2xl shadow-primary/10 ring-4 ring-primary/5' : 'border-border shadow-sm'}`}>
              <div className="flex items-center gap-8 w-full md:w-auto">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 relative ${app.isNow ? 'bg-primary text-white' : 'bg-blue-50 text-primary'}`}>
                  {app.isNow ? <Play className="w-10 h-10 fill-current" /> : <Calendar className="w-10 h-10" />}
                  {app.isNow && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-white rounded-full animate-ping"></span>}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-black text-foreground leading-tight">{app.doctor}</h3>
                    {app.isNow && <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase tracking-widest">Live</span>}
                  </div>
                  <p className="text-sm font-bold text-primary mb-3 uppercase tracking-widest opacity-70">{app.specialty}</p>
                  <div className="flex items-center gap-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {app.date}</span>
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {app.time}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <Link 
                  to={`/consultation/${app.id}`} 
                  className={`flex-1 md:flex-none px-12 py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 ${app.isNow ? 'bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-105' : 'bg-slate-100 text-foreground hover:bg-slate-200'}`}
                >
                  {app.isNow ? 'Подключиться' : 'Детали'} <ChevronRight className="w-5 h-5" />
                </Link>
                <button className="p-5 bg-slate-50 text-muted-foreground rounded-[2rem] hover:bg-slate-100 transition-colors">
                  <MoreVertical className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
          {upcoming.length === 0 && (
            <div className="py-20 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200 text-center">
               <p className="text-muted-foreground font-bold text-xl">На ближайшее время записей нет</p>
            </div>
          )}
        </div>
      </section>

      {/* Past Section */}
      <section className="space-y-8 opacity-70 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
           <div className="w-12 h-px bg-muted"></div>
           <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">История посещений</h2>
        </div>
        <div className="grid gap-4">
          {past.map(app => (
            <div key={app.id} className="bg-white/60 p-6 rounded-[2.5rem] border border-border flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-white transition-all">
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-muted-foreground flex items-center justify-center shrink-0 group-hover:bg-success/10 group-hover:text-success transition-colors">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground leading-tight">{app.doctor}</h3>
                  <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">{app.specialty}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{app.date} • {app.time} • Завершено</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-6 py-3.5 bg-secondary text-primary rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
                  <Download className="w-4 h-4" /> Заключение
                </button>
                <button className="px-6 py-3.5 border border-border rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Чат
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PatientAppointments;
