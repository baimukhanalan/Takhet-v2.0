import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { User } from '../types';
import { Building2, Users, Briefcase, TrendingUp, Shield, Plus, Trash2, Percent, Star, X, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../services/useLanguage';
import { roleApi } from '../../services/roleApi';
import { useLiveRefresh } from '../services/useLiveRefresh';

const PartnerPerformanceChart = lazy(() =>
  import('../components/charts/DashboardCharts').then((module) => ({ default: module.PartnerPerformanceChart }))
);

type PartnerDashboardResponse = {
  analytics: {
    totalCases: number;
    activeCases: number;
    inReviewCases: number;
    closedCases: number;
  };
  doctorStats: {
    total: number;
    active: number;
    pending: number;
  };
  paymentCount: number;
};

type PartnerDoctor = {
  id: string;
  fullName?: string;
  specialty?: string;
  active?: boolean;
  verified?: boolean;
  experienceYears?: number;
  rating?: number;
  reviewsCount?: number;
  headline?: string;
};

const looksCorrupted = (value?: string) =>
  typeof value === 'string' &&
  (!value.trim() ||
    value.includes('Р') ||
    value.includes('�') ||
    value.includes('вЂ') ||
    value.includes('???') ||
    /^\?{3,}/.test(value.trim()));

const doctorName = (doctor: PartnerDoctor) => {
  const value = (doctor.fullName || '').trim();
  if (!value || looksCorrupted(value)) return `Врач ${doctor.id.slice(0, 8)}`;
  return value;
};
const doctorSpecialty = (doctor: PartnerDoctor) => {
  const value = (doctor.specialty || '').trim();
  if (!value || looksCorrupted(value)) return 'Общая практика';
  if (value.toLowerCase() === 'general practice') return 'Общая практика';
  return value;
};
const PartnerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [showManageDocs, setShowManageDocs] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [commission, setCommission] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboard, setDashboard] = useState<PartnerDashboardResponse | null>(null);
  const [doctors, setDoctors] = useState<PartnerDoctor[]>([]);
  const [requests, setRequests] = useState<{ pendingDoctors: PartnerDoctor[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const [dashboardData, doctorsData, requestData, profileData] = await Promise.all([
        roleApi.partnerDashboard(),
        roleApi.partnerDoctors(),
        roleApi.partnerRequests(),
        roleApi.partnerProfile()
      ]);

      setDashboard(dashboardData);
      setDoctors(doctorsData);
      setRequests(requestData);
      setCommission(Number(profileData?.commission || 15));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить партнерский кабинет');
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
  }, { intervalMs: 20000 });

  useEffect(() => {
    const section = (location.state as { section?: string } | null)?.section;
    if (section === 'manage-doctors') {
      setShowManageDocs(true);
    }
    if (section === 'activate-doctors') {
      setShowManageDocs(true);
      setShowAddDoc(true);
    }
  }, [location.state]);

  const handleRemoveDoctor = async (id: string) => {
    await roleApi.partnerDeactivateDoctor(id);
    await loadData();
  };

  const handleAddDoctor = async (id: string) => {
    await roleApi.partnerActivateDoctor(id);
    setShowAddDoc(false);
    await loadData();
  };

  const handleSaveCommission = async () => {
    await roleApi.partnerUpdateProfile({ commission });
    setNotice(`Комиссия клиники сохранена: ${commission}%. Вы можете изменить ее в любой момент.`);
  };

  const filteredDocs = useMemo(
    () => doctors.filter((doctor) => doctorName(doctor).toLowerCase().includes(searchTerm.toLowerCase()) || doctorSpecialty(doctor).toLowerCase().includes(searchTerm.toLowerCase())),
    [doctors, searchTerm]
  );

  const availableDoctors = (requests?.pendingDoctors || []).filter((doctor) => !doctor.verified);

  const clinicPerformance = useMemo(() => {
    if (!dashboard) return [];
    return [
      { month: 'В работе', revenue: dashboard.analytics.activeCases, consults: dashboard.analytics.activeCases },
      { month: 'На проверке', revenue: dashboard.analytics.inReviewCases, consults: dashboard.analytics.inReviewCases },
      { month: 'Закрыто', revenue: dashboard.analytics.closedCases, consults: dashboard.analytics.closedCases },
      { month: 'Оплаты', revenue: dashboard.paymentCount, consults: dashboard.paymentCount }
    ];
  }, [dashboard]);

  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка партнерского кабинета</div>;
  }

  if (error || !dashboard) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error || 'Кабинет временно недоступен'}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 pb-20">
      {notice && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-emerald-700 font-bold">
          {notice}
        </div>
      )}

      {showManageDocs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
            <button onClick={() => setShowManageDocs(false)} className="absolute top-8 right-8 z-10 p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <div className="p-6 md:p-10 border-b bg-slate-50/50">
              <h2 className="text-3xl font-black tracking-tight">Управление врачами</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Полный список специалистов клиники</p>
            </div>
            <div className="p-6 md:p-10 flex-1 overflow-y-auto no-scrollbar space-y-6">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Поиск врача..."
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none"
                />
              </div>
              <div className="space-y-3">
                {filteredDocs.map((doctor) => (
                  <div key={doctor.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-primary/20 transition-all gap-4 min-w-0">
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0 font-black">
                        {doctorName(doctor).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 break-words">{doctorName(doctor)}</h4>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest break-words">{doctorSpecialty(doctor)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-8 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-slate-900">{doctor.verified ? 'Активен' : 'Ожидает'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{doctor.experienceYears || 0} лет опыта</p>
                      </div>
                      <button onClick={() => void handleRemoveDoctor(doctor.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 md:p-10 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <button onClick={() => setShowAddDoc(true)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Plus className="w-4 h-4" /> Активировать врача
              </button>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Всего: {doctors.length}</p>
            </div>
          </div>
        </div>
      )}

      {showAddDoc && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in zoom-in-95">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative">
            <button onClick={() => setShowAddDoc(false)} className="absolute top-8 right-8 z-10 p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <div className="p-6 md:p-10 border-b bg-slate-50/50">
              <h2 className="text-2xl font-black tracking-tight">Ожидают активации</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Неподтвержденные врачи</p>
            </div>
            <div className="p-6 md:p-10 max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
              {availableDoctors.length > 0 ? availableDoctors.map((doctor) => (
                <div key={doctor.id} className="p-5 bg-slate-50 rounded-2xl flex items-center justify-between gap-4 min-w-0">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0 font-black">
                      {doctorName(doctor).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 break-words">{doctorName(doctor)}</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase break-words">{doctorSpecialty(doctor)}</p>
                    </div>
                  </div>
                  <button onClick={() => void handleAddDoctor(doctor.id)} className="px-4 py-2 bg-primary text-white rounded-xl font-black text-[10px] uppercase shrink-0">Активировать</button>
                </div>
              )) : (
                <p className="text-center text-slate-400 py-10 font-bold">Нет ожидающих врачей</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6" /></div>
            <h3 className="text-xl font-bold text-primary">{user.name}</h3>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">{t.dashboard.partner.orgTitle}</h1>
          <p className="text-muted-foreground mt-2 text-lg">Управление врачами, обращениями и финансовыми показателями клиники.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <button onClick={() => navigate('/reports')} className="px-6 py-3.5 bg-white border border-border rounded-2xl font-bold hover:bg-slate-50 transition-all">{t.dashboard.partner.export}</button>
          <button onClick={() => setShowManageDocs(true)} className="px-6 py-3.5 bg-primary text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-primary/20">{t.dashboard.partner.manageDocs}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 xl:gap-8">
        {[
          { label: t.dashboard.partner.activeDocs, val: dashboard.doctorStats.active.toString(), icon: Users, color: 'text-primary bg-primary/10' },
          { label: t.dashboard.partner.totalConsults, val: dashboard.analytics.totalCases.toString(), icon: Briefcase, color: 'text-accent bg-accent/10' },
          { label: t.dashboard.partner.revenueMTD, val: dashboard.paymentCount.toString(), icon: TrendingUp, color: 'text-success bg-success/10' },
          { label: 'Рейтинг сети', val: doctors.length > 0 ? (doctors.reduce((sum, doctor) => sum + Number(doctor.rating || 0), 0) / doctors.length).toFixed(1) : '4.8', icon: Star, color: 'text-amber-600 bg-amber-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-border shadow-sm group hover:scale-[1.02] transition-transform">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}><stat.icon className="w-6 h-6" /></div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-extrabold text-foreground mt-1">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-10">
        <div className="xl:col-span-2 space-y-10">
          <div className="bg-white p-6 md:p-8 xl:p-10 rounded-[2.5rem] xl:rounded-[3rem] border border-border shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
              <h2 className="text-2xl font-extrabold">{t.dashboard.partner.growth}</h2>
              <select className="bg-background border-none text-xs font-bold rounded-xl px-4 py-2"><option>Сейчас</option></select>
            </div>
            <div className="h-80 w-full">
              <Suspense fallback={null}>
                <PartnerPerformanceChart data={clinicPerformance} />
              </Suspense>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 xl:p-10 rounded-[2.5rem] xl:rounded-[3rem] border border-border shadow-sm">
            <h2 className="text-2xl font-extrabold mb-8">Врачи</h2>
            <div className="space-y-6">
              {doctors.slice(0, 3).map((doctor, i) => (
                <div key={doctor.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50 rounded-3xl gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-lg font-black text-slate-300 shrink-0">0{i + 1}</span>
                    <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0 font-black">
                      {doctorName(doctor).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 break-words">{doctorName(doctor)}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-amber-500 font-black">
                        <Star className="w-3 h-3 fill-current" /> {doctor.rating || 4.8} · {doctor.reviewsCount || 0} отзывов
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-black text-slate-900">{doctorSpecialty(doctor)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{doctor.experienceYears || 0} лет</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 md:p-8 xl:p-10 rounded-[2.5rem] xl:rounded-[3rem] text-white relative overflow-hidden">
            <h3 className="text-xl font-bold mb-4">{t.dashboard.partner.verificationStatus}</h3>
            <div className="flex items-center gap-3 text-success mb-6">
              <Shield className="w-8 h-8" />
              <span className="font-bold uppercase tracking-widest text-sm">Активно</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">Клиника активна. Проверка врачей, аналитика и отчеты доступны в одном кабинете.</p>
            <button onClick={() => navigate('/reports')} className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all">Открыть комплаенс</button>
          </div>

          <div className="bg-primary p-6 md:p-8 xl:p-10 rounded-[2.5rem] xl:rounded-[3rem] text-white space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Percent className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold">Комиссия клиники</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
                <span>Текущая ставка</span>
                <span>{commission}%</span>
              </div>
              <input type="range" min="5" max="30" value={commission} onChange={(e) => setCommission(parseInt(e.target.value, 10))} className="w-full accent-white" />
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">Настройте комфортную ставку для внутреннего контроля клиники и регулярно пересматривайте ее по результатам работы.</p>
            <button onClick={() => void handleSaveCommission()} className="w-full py-4 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all">{'\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;


