
import React from 'react';
import { Video, Clock, CheckCircle2, ChevronRight, User, Calendar, FileText, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const DoctorConsultations: React.FC = () => {
  const upcoming = [
    { id: '101', patient: 'Алихан Омаров', time: '14:00', type: 'Video', status: 'ready' },
    { id: '102', patient: 'Елена Ким', time: '15:30', type: 'Chat', status: 'upcoming' },
  ];

  const past = [
    { id: '99', patient: 'Сергей Петров', date: 'Вчера', type: 'Video', diagnosis: 'ОРВИ' },
    { id: '98', patient: 'Айя Бекова', date: '20.05.2025', type: 'Video', diagnosis: 'Невралгия' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter">Приемы</h1>
          <p className="text-muted-foreground mt-2 font-medium">Управляйте своим расписанием и картами пациентов.</p>
        </div>
        <button className="px-6 py-3.5 bg-white border border-border rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
          <Settings className="w-4 h-4" /> Настройка графика
        </button>
      </div>

      {/* Active Schedule */}
      <section className="space-y-6">
        <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
          <Calendar className="w-6 h-6" /> Сегодня
        </h2>
        <div className="grid gap-4">
          {upcoming.map(app => (
            <div key={app.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 group hover:shadow-xl transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">{app.patient}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {app.time}</span>
                    <span className="flex items-center gap-1.5 text-primary"><Video className="w-3.5 h-3.5" /> {app.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Link 
                  to={`/consultation/${app.id}`}
                  className={`flex-1 md:flex-none px-10 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                    app.status === 'ready' 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Начать прием <ChevronRight className="w-4 h-4" />
                </Link>
                <button className="px-6 py-4 border border-border rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">
                  Карта
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Archive */}
      <section className="space-y-6">
        <h2 className="text-xl font-black uppercase tracking-widest text-muted-foreground ml-5">История</h2>
        <div className="grid gap-4">
          {past.map(app => (
            <div key={app.id} className="bg-slate-50 p-6 rounded-[2.5rem] border border-border flex flex-col md:flex-row items-center justify-between gap-6 opacity-80 hover:opacity-100 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-white text-muted-foreground flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{app.patient}</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{app.date} • {app.diagnosis}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button className="px-6 py-3 bg-white border border-border rounded-xl font-bold text-xs flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Заключение
                </button>
                <button className="px-6 py-3 bg-white border border-border rounded-xl font-bold text-xs">
                  Детали
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DoctorConsultations;
