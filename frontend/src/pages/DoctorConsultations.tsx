import React, { useEffect, useState } from 'react';
import { Video, Clock, CheckCircle2, ChevronRight, User, Calendar, Settings, Key, Download, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { roleApi } from '../../services/roleApi';
import { useLiveRefresh } from '../services/useLiveRefresh';

type DoctorCase = {
  id: string;
  patientId: string;
  status: 'open' | 'active' | 'in_review' | 'closed';
  summary: string | null;
  createdAt: string;
  appointmentDate?: string | null;
  appointmentSlot?: string | null;
};

const formatPatientName = (patientId: string) => `Пациент ${patientId.slice(0, 8)}`;
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const parseBookingDetails = (summary: string | null) => {
  const text = summary || '';
  return {
    appointmentDate: text.match(/^Дата:\s*(.+)$/m)?.[1]?.trim() || null,
    appointmentSlot: text.match(/^Время:\s*(.+)$/m)?.[1]?.trim() || null
  };
};
const getBookingDetails = (item: DoctorCase) => {
  const parsed = parseBookingDetails(item.summary);
  return {
    appointmentDate: item.appointmentDate || parsed.appointmentDate,
    appointmentSlot: item.appointmentSlot || parsed.appointmentSlot
  };
};

const DoctorConsultations: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<DoctorCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await roleApi.doctorAppointments();
        setAppointments(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить консультации');
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    };

  useEffect(() => {
    void load();
  }, []);

  useLiveRefresh(async () => {
    await load(true);
  }, { intervalMs: 12000 });

  const upcoming = appointments.filter((app) => app.status !== 'closed');
  const past = appointments.filter((app) => app.status === 'closed');

  if (loading) {
    return <div className="max-w-6xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка консультаций</div>;
  }

  if (error) {
    return <div className="max-w-6xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 md:space-y-16 pb-24 md:pb-32 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase">Приемы и архив</h1>
          <p className="text-muted-foreground mt-2 font-medium text-lg">Список активных и завершенных кейсов врача.</p>
        </div>
        <button onClick={() => navigate('/settings')} className="px-8 py-4 bg-white border border-border rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3">
          <Settings className="w-5 h-5" /> Расписание
        </button>
      </div>

      <section className="space-y-8">
        <h2 className="text-2xl font-black uppercase tracking-widest text-primary flex items-center gap-4">
          <Calendar className="w-8 h-8" /> Активные
        </h2>
        <div className="grid gap-6">
          {upcoming.length > 0 ? upcoming.map((app) => {
            const bookingDetails = getBookingDetails(app);
            return (
              <div key={app.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 group hover:shadow-2xl transition-all">
                <div className="flex items-center gap-4 md:gap-8 min-w-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                    <User className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl md:text-3xl font-black text-foreground tracking-tight break-words">{formatPatientName(app.patientId)}</h3>
                    <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-2 text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> {bookingDetails.appointmentSlot || formatTime(app.createdAt)}</span>
                      <span className="flex items-center gap-2 text-primary"><Video className="w-3.5 h-3.5 md:w-4 md:h-4" /> {app.status === 'active' ? 'Активно' : app.status === 'in_review' ? 'На разборе' : 'Открыто'}</span>
                      <span>{bookingDetails.appointmentDate || formatDate(app.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto">
                  <Link
                    to={`/consultation/${app.id}`}
                    className={`flex-1 md:flex-none px-12 py-5 rounded-[2rem] font-black text-sm transition-all flex items-center justify-center gap-3 ${
                      app.status === 'active'
                        ? 'bg-red-600 text-white shadow-2xl shadow-red-200 hover:bg-red-700'
                        : 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105'
                    }`}
                  >
                    {app.status === 'active' ? 'Открыть кейс' : 'Продолжить'} <ChevronRight className="w-5 h-5" />
                  </Link>
                  <button onClick={() => navigate(`/consultation/${app.id}`)} className="px-8 py-5 border border-border rounded-[2rem] font-black text-sm hover:bg-slate-50 transition-all">
                    Данные
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="py-24 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100 text-center opacity-30">
              <p className="font-black text-xl uppercase tracking-widest">Активных консультаций нет</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 sm:px-6">
          <h2 className="text-xl font-black uppercase tracking-[0.3em] text-muted-foreground">Архив консультаций</h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-success bg-success/5 px-3 py-1 rounded-lg border border-success/10 flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3" /> Завершенные кейсы
          </span>
        </div>
        <div className="grid gap-4">
          {past.length > 0 ? past.map((app) => {
            const bookingDetails = getBookingDetails(app);
            return (
              <div key={app.id} className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border border-border flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 group hover:bg-white transition-all">
                <div className="flex items-center gap-4 md:gap-8 min-w-0">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white text-blue-500 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-lg md:text-2xl text-foreground tracking-tight break-words">{formatPatientName(app.patientId)}</h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{bookingDetails.appointmentDate || formatDate(app.createdAt)}</p>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3 text-primary" /> Время: {bookingDetails.appointmentSlot || formatTime(app.createdAt)}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Activity className="w-3 h-3 text-primary" /> Статус: {app.status}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <div className="px-5 py-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Закрыто</span>
                  </div>
                  <button onClick={() => {
                    const content = [`Кейс: ${app.id}`, `Пациент: ${formatPatientName(app.patientId)}`, `Статус: ${app.status}`, `Запись: ${bookingDetails.appointmentDate || formatDate(app.createdAt)} ${bookingDetails.appointmentSlot || formatTime(app.createdAt)}`].join('\n');
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `case-${app.id.slice(0, 8)}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }} className="p-4 bg-white border border-border rounded-2xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                    <Download className="w-5 h-5" />
                  </button>
                  <button onClick={() => navigate(`/consultation/${app.id}`)} className="px-6 py-4 bg-white border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all">
                    Детали
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-20 opacity-30 font-black uppercase tracking-[0.4em]">История приемов пуста</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DoctorConsultations;
