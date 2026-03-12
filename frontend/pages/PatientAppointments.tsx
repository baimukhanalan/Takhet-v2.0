import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, CheckCircle2, MoreVertical, Play, Download, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MockDB } from '../services/db';
import { Appointment } from '../types';
import { roleApi } from '../services/roleApi';

const mapCaseToAppointment = (c: any): Appointment => ({
  id: c.id,
  patientName: c.patientId || 'Patient',
  doctorName: c.doctorId || 'TBD',
  date: new Date(c.createdAt).toLocaleDateString(),
  time: new Date(c.createdAt).toLocaleTimeString(),
  type: 'Video',
  status: c.status === 'closed' ? 'completed' : c.status === 'active' ? 'ongoing' : 'upcoming'
});

const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const createQuickCase = async () => {
    const summary = window.prompt('Опишите кратко симптомы для создания кейса');
    if (!summary) return;
    try {
      await roleApi.patientCreateCase(summary);
      const cases = await roleApi.patientCases();
      setAppointments((cases || []).map(mapCaseToAppointment));
    } catch {
      MockDB.addAppointment({
        doctorName: 'Назначается',
        patientName: 'Пациент',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        status: 'upcoming',
        type: 'Video'
      });
      setAppointments(MockDB.getAppointments());
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const cases = await roleApi.patientCases();
        setAppointments((cases || []).map(mapCaseToAppointment));
      } catch {
        setAppointments(MockDB.getAppointments());
      }
    };

    load();
    window.addEventListener('storage_update', load as any);
    return () => window.removeEventListener('storage_update', load as any);
  }, []);

  const upcoming = appointments.filter(app => app.status !== 'completed' && app.status !== 'cancelled');
  const past = appointments.filter(app => app.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-foreground tracking-tighter">Мои приемы</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Ваше здоровье — по расписанию.</p>
        </div>
        <Link to="/doctors-search" className="px-10 py-5 bg-white border border-border rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-3">
          Новая запись <Plus className="w-4 h-4" />
        </Link>
        <button onClick={createQuickCase} className="px-10 py-5 bg-primary text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-blue-800 transition-all shadow-sm">
          Быстрый кейс
        </button>
      </div>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-px bg-primary/20"></div>
           <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Предстоящие консультации</h2>
        </div>
        <div className="grid gap-6">
          {upcoming.length > 0 ? upcoming.map(app => {
            const isNow = app.status === 'ongoing';
            return (
              <div key={app.id} className={`bg-white p-8 rounded-[3.5rem] border transition-all flex flex-col md:flex-row items-center justify-between gap-8 ${isNow ? 'border-primary shadow-2xl shadow-primary/10 ring-4 ring-primary/5' : 'border-border shadow-sm'}`}>
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 relative ${isNow ? 'bg-primary text-white' : 'bg-blue-50 text-primary'}`}>
                    {isNow ? <Play className="w-10 h-10 fill-current" /> : <Calendar className="w-10 h-10" />}
                    {isNow && <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-4 border-white rounded-full animate-ping"></span>}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground leading-tight">{app.doctorName}</h3>
                    <div className="flex items-center gap-6 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-3">
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {app.date}</span>
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {app.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <Link to={`/consultation/${app.id}`} className={`flex-1 md:flex-none px-12 py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 ${isNow ? 'bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-105' : 'bg-slate-100 text-foreground hover:bg-slate-200'}`}>
                    {isNow ? 'Подключиться' : 'Детали'} <ChevronRight className="w-5 h-5" />
                  </Link>
                  <button className="p-5 bg-slate-50 text-muted-foreground rounded-[2rem] hover:bg-slate-100 transition-colors"><MoreVertical className="w-6 h-6" /></button>
                </div>
              </div>
            );
          }) : <div className="text-center py-20 opacity-30 font-black uppercase tracking-[0.4em]">У вас нет активных записей</div>}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center gap-4">
           <div className="w-12 h-px bg-muted"></div>
           <h2 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">История посещений</h2>
        </div>
        <div className="grid gap-4">
          {past.length > 0 ? past.map(app => (
            <div key={app.id} className="bg-white/60 p-8 rounded-[3rem] border border-border flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-muted-foreground flex items-center justify-center shrink-0"><CheckCircle2 className="w-7 h-7" /></div>
                <div>
                  <h3 className="text-xl font-black text-foreground leading-tight">{app.doctorName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{app.date} • {app.time} • Завершено</p>
                </div>
              </div>
              <button className="px-8 py-4 bg-primary/5 text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
                <Download className="w-4 h-4" /> Заключение
              </button>
            </div>
          )) : <div className="text-center py-20 opacity-30 font-black uppercase tracking-[0.4em]">История пуста</div>}
        </div>
      </section>
    </div>
  );
};

export default PatientAppointments;
