import React, { Suspense, lazy, useEffect, useState } from 'react';
import { User } from '../types';
import { Users, Video, DollarSign, Calendar as CalendarIcon, TrendingUp, Radar, ShieldEllipsis, ChevronRight, Award, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../services/useLanguage';
import { roleApi } from '../../services/roleApi';
import { useLiveRefresh } from '../services/useLiveRefresh';

const DoctorRevenueChart = lazy(() =>
  import('../components/charts/DashboardCharts').then((module) => ({ default: module.DoctorRevenueChart }))
);

type DoctorDashboardData = {
  profile: {
    id: string;
    fullName: string;
    specialty: string;
    active: boolean;
    verified: boolean;
    experienceYears: number;
    rating: number;
    reviewsCount: number;
    headline?: string;
    clinicName?: string;
    responseTargetHours?: number;
  };
  earnings: {
    totalPaid: number;
    currency: string;
    count: number;
    revenueHistory?: { name: string; amount: number }[];
  };
  myCasesCount: number;
  queueCount: number;
};

type DoctorCase = {
  id: string;
  patientId: string;
  doctorId: string | null;
  status: 'open' | 'active' | 'in_review' | 'closed';
  summary: string | null;
  createdAt: string;
};

const formatPatientName = (patientId: string) => `Пациент ${patientId.slice(0, 8)}`;
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const formatCaseStatus = (value: DoctorCase['status']) =>
  value === 'closed' ? 'Завершено' : value === 'in_review' ? 'На проверке' : value === 'active' ? 'В работе' : 'Открыто';
const DoctorDashboard: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DoctorDashboardData | null>(null);
  const [appointments, setAppointments] = useState<DoctorCase[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const [dashboardData, appointmentData] = await Promise.all([
          roleApi.doctorDashboard(),
          roleApi.doctorAppointments()
        ]);

        setDashboard(dashboardData);
        setAppointments(appointmentData.filter((item) => item.status !== 'closed'));

        const realRevenueHistory = dashboardData.earnings?.revenueHistory || [];
        setRevenueHistory(
          realRevenueHistory.length
            ? realRevenueHistory.map((item) => ({ name: item.name, amount: Number(item.amount || 0) }))
            : [
                { name: 'W1', amount: 0 },
                { name: 'W2', amount: 0 },
                { name: 'W3', amount: 0 },
                { name: 'W4', amount: 0 }
              ]
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить кабинет врача');
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    };

  useEffect(() => {
    void loadData();
  }, []);

  useLiveRefresh(async () => {
    await loadData(true);
  }, { intervalMs: 15000 });

  const stats = [
    { icon: Video, color: 'bg-blue-50 text-primary', label: t.dashboard.doctor.sessions, val: dashboard?.earnings?.count ?? 0, action: () => navigate('/consultations') },
    { icon: Users, color: 'bg-blue-50 text-blue-600', label: t.dashboard.doctor.patients, val: new Set(appointments.map((item) => item.patientId)).size, action: () => navigate('/patients') },
    { icon: DollarSign, color: 'bg-orange-50 text-orange-600', label: t.dashboard.doctor.revenue, val: `₸${Number(dashboard?.earnings?.totalPaid || 0).toLocaleString()}`, action: () => navigate('/finances') }
  ];

  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка кабинета врача</div>;
  }

  if (error || !dashboard) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error || 'Кабинет временно недоступен'}</div>;
  }

  return (
    <div className="space-y-8 md:space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 md:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {t.dashboard.welcome}, <span className="text-primary italic">{dashboard.profile.fullName || user.name}</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">{dashboard.profile.specialty}</p>
          <p className="text-slate-500 font-medium mt-3 max-w-2xl">{dashboard.profile.headline || `Прием, разбор обращений и сопровождение пациентов по направлению ${dashboard.profile.specialty}.`}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white px-5 md:px-8 py-5 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm w-full xl:w-auto">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{t.settings.doctor.reputation}</span>
            <div className="flex items-center gap-2 text-primary font-black text-2xl">
              <Award className="w-5 h-5 text-indigo-500" /> {dashboard.profile.rating || 4.8}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Отзывы</span>
            <div className="text-slate-900 font-black text-2xl">{dashboard.profile.reviewsCount || 0}</div>
          </div>
          <div className="flex items-center gap-3 text-blue-600">
            <ShieldEllipsis className="w-6 h-6" />
            <span className="text-sm font-black uppercase tracking-widest">{dashboard.profile.verified ? 'Подтвержден' : 'На проверке'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={stat.action}
            className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] border border-border shadow-sm flex flex-col md:flex-row items-center gap-3 md:gap-6 group hover:scale-[1.02] transition-all text-center md:text-left w-full"
          >
            <div className={`w-10 h-10 md:w-14 md:h-14 ${stat.color} rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform shrink-0`}>
              <stat.icon className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div className="min-w-0 w-full">
              <p className="text-slate-400 text-[7px] md:text-[9px] font-black uppercase tracking-widest leading-none break-words">{stat.label}</p>
              <p className="text-base md:text-2xl font-black text-slate-900 mt-1 md:mt-2 break-words">{stat.val}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-10">
        <div className="xl:col-span-8 space-y-10">
          <div className="space-y-6">
            <h3 className="text-lg md:text-xl font-black uppercase tracking-widest text-slate-400 flex items-center gap-3 px-2"><CalendarIcon className="w-5 h-5 md:w-6 md:h-6" /> {t.dashboard.doctor.upcoming}</h3>
            <div className="grid gap-4">
              {appointments.length > 0 ? appointments.slice(0, 6).map((app) => (
                <div key={app.id} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:shadow-xl transition-all min-w-0">
                  <button onClick={() => navigate(`/consultation/${app.id}`)} className="flex items-center gap-4 md:gap-6 min-w-0 w-full sm:w-auto text-left">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-primary/5 text-primary flex items-center justify-center shadow-md shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-lg md:text-xl text-slate-900 break-words">{formatPatientName(app.patientId)}</h4>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-0">
                        <span className="flex items-center gap-1.5 shrink-0"><Clock className="w-3 md:w-3.5 h-3 md:h-3.5 text-primary" /> {formatTime(app.createdAt)}</span>
                        <span className="hidden md:block w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                        <span className="text-primary break-words">{formatCaseStatus(app.status)}</span>
                      </div>
                    </div>
                  </button>
                  <Link to={`/consultation/${app.id}`} className="w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 bg-slate-900 text-white rounded-[1rem] md:rounded-[1.5rem] font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-primary transition-all shadow-lg flex items-center justify-center gap-3 shrink-0">
                    {app.status === 'active' ? 'Открыть кейс' : t.dashboard.doctor.join} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )) : (
                <div className="py-12 md:py-16 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[2.5rem] md:rounded-[3.5rem] text-center">
                  <p className="text-slate-300 font-black uppercase tracking-widest text-xs md:text-sm">Нет активных консультаций</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 xl:p-10 rounded-[2.5rem] xl:rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{t.dashboard.doctor.revenue}</h3>
              <span className="text-success font-black text-[10px]">{dashboard.earnings.currency}</span>
            </div>
            <div className="h-64 w-full">
              <Suspense fallback={null}>
                <DoctorRevenueChart data={revenueHistory} />
              </Suspense>
            </div>
            <div className="pt-6 border-t border-slate-50">
              <Link to="/finances" className="w-full py-5 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3">
                {t.dashboard.doctor.detailReport} <TrendingUp className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 p-6 md:p-8 xl:p-10 rounded-[2.5rem] xl:rounded-[3.5rem] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-10 -mt-10" />
            <div className="relative z-10 space-y-8">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center"><Radar className="w-8 h-8 text-primary" /></div>
              <div>
                <h4 className="text-2xl font-black uppercase tracking-tight leading-tight">Профиль врача</h4>
                <p className="text-slate-400 text-sm font-medium mt-4 leading-relaxed">
                  {(dashboard.profile.clinicName || dashboard.profile.specialty)}. Рейтинг {dashboard.profile.rating || 4.8}/5. Целевое время ответа: {dashboard.profile.responseTargetHours || 2} ч.
                </p>
              </div>
              <div className="grid gap-3">
                <Link to="/settings" className="w-full py-5 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl block text-center hover:bg-white/15 transition-all">Открыть профиль</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
