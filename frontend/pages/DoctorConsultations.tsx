import React, { useState, useEffect } from 'react';
import { Video, Clock, CheckCircle2, ChevronRight, User, Calendar, Settings, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MockDB } from '../services/db';
import { Appointment } from '../types';
import { roleApi } from '../services/roleApi';

const mapCaseToAppointment = (c: any): Appointment => ({
  id: c.id,
  doctorName: c.doctorId || 'Doctor',
  patientName: c.patientId || 'Patient',
  date: new Date(c.createdAt).toLocaleDateString(),
  time: new Date(c.createdAt).toLocaleTimeString(),
  type: 'Video',
  status: c.status === 'closed' ? 'completed' : c.status === 'active' ? 'ongoing' : 'upcoming'
});

const DoctorConsultations: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const load = async () => {
    try {
      const doctorAppointments = await roleApi.doctorAppointments();
      setAppointments((doctorAppointments || []).map(mapCaseToAppointment));
    } catch {
      setAppointments(MockDB.getAppointments());
    }
  };

  useEffect(() => {
    load();
    window.addEventListener('storage_update', load as any);
    return () => window.removeEventListener('storage_update', load as any);
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await roleApi.doctorUpdateCaseStatus(id, 'closed');
      await load();
    } catch {
      setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: 'completed' } : a)));
    }
  };

  const upcoming = appointments.filter(app => app.status !== 'completed' && app.status !== 'cancelled');
  const past = appointments.filter(app => app.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-32 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase">Приемы и Архив</h1>
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
            <div key={app.id} className="bg-white p-8 rounded-[3.5rem] border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-2xl transition-all">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-foreground tracking-tight">{app.patientName}</h3>
                  <div className="flex items-center gap-6 mt-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {app.time}</span>
                    <span className="flex items-center gap-2 text-primary"><Video className="w-4 h-4" /> {app.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Link
                  to={`/consultation/${app.id}`}
                  className={`flex-1 md:flex-none px-8 py-5 rounded-[2rem] font-black text-sm transition-all flex items-center justify-center gap-3 ${
                    app.status === 'ongoing'
                      ? 'bg-red-600 text-white shadow-2xl shadow-red-200 hover:bg-red-700 animate-pulse'
                      : 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105'
                  }`}
                >
                  {app.status === 'ongoing' ? 'Продолжить' : 'Начать прием'} <ChevronRight className="w-5 h-5" />
                </Link>
                <button onClick={() => handleComplete(app.id)} className="px-8 py-5 rounded-[2rem] border border-border font-black text-sm hover:bg-slate-50">
                  Завершить
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

      <section className="space-y-8">
        <div className="flex items-center justify-between px-6">
          <h2 className="text-xl font-black uppercase tracking-[0.3em] text-muted-foreground">Архив консультаций</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-success bg-success/5 px-3 py-1 rounded-lg border border-success/10 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> Все отчеты подписаны ЭЦП
          </span>
        </div>
        <div className="grid gap-4">
          {past.length > 0 ? past.map(app => (
            <div key={app.id} className="bg-slate-50 p-8 rounded-[3.5rem] border border-border flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white text-emerald-500 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-foreground tracking-tight">{app.patientName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{app.date} • {app.time}</p>
                </div>
              </div>
            </div>
          )) : <div className="text-center py-20 opacity-30 font-black uppercase tracking-[0.4em]">Архив пуст</div>}
        </div>
      </section>
    </div>
  );
};

export default DoctorConsultations;
