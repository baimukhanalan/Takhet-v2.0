import React, { useEffect, useMemo, useState } from 'react';
import { User } from '../types';
import { Activity, FileText, Video as VideoIcon, Zap, Settings2, ChevronRight, Shield, Clock, CreditCard, Plus, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../services/useLanguage';
import { roleApi } from '../../services/roleApi';
import { useLiveRefresh } from '../services/useLiveRefresh';

type PatientCase = {
  id: string;
  patientId: string;
  doctorId: string | null;
  status: 'open' | 'active' | 'in_review' | 'closed';
  summary: string | null;
  createdAt: string;
};

type PatientNotification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type PatientPayment = {
  id: string;
  caseId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatCaseStatus = (status: PatientCase['status']) => {
  switch (status) {
    case 'open':
      return 'Открыт';
    case 'active':
      return 'Активен';
    case 'in_review':
      return 'На разборе';
    case 'closed':
      return 'Закрыт';
    default:
      return status;
  }
};
const formatCaseSummary = (value: string | null) => {
  if (!value) return 'Обращение создано без описания';
  const normalized = value.trim();
  if (!normalized) return 'Обращение создано без описания';
  if (normalized === 'AI consultation request' || normalized === 'Запрос на AI-консультацию') return 'Запрос на ИИ консультацию';
  if (normalized === 'Feedback runtime verification case') return 'Завершенная консультация с отзывом пациента';
  if (normalized === 'Smoke test case from Codex runtime validation') return 'Служебное обращение';
  if (normalized === 'Test payment case from runtime validation') return 'Проверка оплаты';
  if (/^\?+$/.test(normalized) || normalized.includes('????')) return 'Описание обращения требует уточнения';
  if (normalized.startsWith('Doctor response:')) {
    const response = normalized.slice('Doctor response:'.length).trim();
    return response ? `Ответ врача: ${response}` : 'Ответ врача добавлен';
  }
  if (normalized.startsWith('AI consultation request:')) {
    const details = normalized.slice('AI consultation request:'.length).trim();
    return details ? `Запрос на ИИ консультацию: ${details}` : 'Запрос на ИИ консультацию';
  }
  return normalized;
};

const PatientDashboard: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [payments, setPayments] = useState<PatientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingContext, setExportingContext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const [caseData, notificationData, paymentData] = await Promise.all([
          roleApi.patientCases(),
          roleApi.patientNotifications(),
          roleApi.patientPayments()
        ]);
        setCases(caseData);
        setNotifications(notificationData);
        setPayments(paymentData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить кабинет пациента');
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
  }, { intervalMs: 15000 });

  const latestCase = cases[0] || null;
  const unpaidCases = payments.filter((payment) => payment.status === 'pending').length;
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;
  const paidAmount = payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const recentCases = useMemo(() => cases.slice(0, 4), [cases]);

  const downloadJson = (payload: unknown, fileName: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportContext = async () => {
    setExportingContext(true);
    setError(null);
    try {
      const context = await roleApi.patientExportContext();
      downloadJson(context, `takhet-patient-context-${new Date().toISOString().slice(0, 10)}.json`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Не удалось экспортировать контекст пациента');
    } finally {
      setExportingContext(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка кабинета пациента</div>;
  }

  if (error) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-8 md:space-y-12 max-w-7xl mx-auto pb-24 md:pb-40 px-3 sm:px-4 lg:px-0">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 md:gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <Activity className="w-3.5 h-3.5" /> {t.dashboard.welcome}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">
            Личный <span className="text-primary italic">кабинет</span> <br /> пациента
          </h1>
        </div>
        <div className="flex items-center gap-3 md:gap-4 self-start lg:self-auto">
            <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Пользователь</p>
            <p className="text-sm font-black text-slate-900">{user.name}</p>
          </div>
          <button onClick={() => navigate('/settings')} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <Settings2 className="w-6 h-6 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
        <div className="xl:col-span-8 space-y-12 lg:space-y-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Обращения', value: cases.length, icon: FileText, tone: 'bg-blue-50 text-primary', action: () => navigate('/appointments') },
              { label: 'Активные', value: cases.filter((item) => item.status !== 'closed').length, icon: VideoIcon, tone: 'bg-emerald-50 text-emerald-600', action: () => navigate('/appointments') },
              { label: 'Неоплаченные', value: unpaidCases, icon: CreditCard, tone: 'bg-amber-50 text-amber-600', action: () => navigate('/appointments') },
              { label: 'Уведомления', value: unreadNotifications, icon: Zap, tone: 'bg-slate-900 text-white', action: () => navigate('/chat') }
            ].map((item) => (
              <button key={item.label} onClick={item.action} className="p-6 md:p-8 bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm space-y-6 group hover:border-primary/20 transition-all text-left">
                <div className={`w-12 h-12 md:w-14 md:h-14 ${item.tone} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <h4 className="text-3xl md:text-4xl font-black text-slate-900">{item.value}</h4>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 sm:px-6">
              <h3 className="text-3xl font-black uppercase tracking-tighter">Последние обращения</h3>
              <Link to="/appointments" className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all group">
                Мои обращения <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {recentCases.length > 0 ? recentCases.map((record) => (
                <button key={record.id} className="p-6 md:p-10 bg-white rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer text-left" onClick={() => navigate(`/consultation/${record.id}`)}>
                  <div className="flex items-center gap-6 md:gap-8 mb-6 md:mb-8">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center shadow-inner bg-blue-50 text-primary">
                      <FileText className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-lg md:text-xl text-slate-900 leading-tight break-words">Обращение #{record.id.slice(0, 8)}</h4>
                      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 md:mt-1.5">{formatDate(record.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 font-medium line-clamp-3 italic mb-6 md:mb-8 leading-relaxed">{formatCaseSummary(record.summary)}</p>
                  <div className="flex items-center justify-between pt-6 md:pt-8 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[8px] md:text-[9px] font-black text-slate-900 uppercase tracking-widest">{formatCaseStatus(record.status)}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              )) : (
                <div className="col-span-full py-24 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                  <Activity className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Пока нет кейсов</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 h-full space-y-10">
          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 border border-slate-100 shadow-sm space-y-8 md:space-y-12 sticky top-24">
            <div className="space-y-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Последнее действие</h4>
              <div className="p-8 bg-primary/5 border border-primary/10 rounded-[3rem] space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6">
                  <Clock className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">{latestCase ? `Обращение #${latestCase.id.slice(0, 8)}` : 'Нет активности'}</p>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">{latestCase ? formatCaseStatus(latestCase.status) : 'ожидание'}</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-primary/10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs font-black text-slate-900">{latestCase ? formatDate(latestCase.createdAt) : 'Нет даты'}</span>
                  </div>
                  <button onClick={() => latestCase ? navigate(`/consultation/${latestCase.id}`) : navigate('/appointments')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Детали</button>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Быстрые действия</h4>
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => navigate('/doctors-search')} className="w-full p-6 md:p-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-between group overflow-hidden">
                  <span className="break-words pr-2">Выбрать врача</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => navigate('/appointments')} className="w-full p-6 md:p-8 bg-slate-50 text-slate-900 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all flex items-center justify-between group">
                  <span className="break-words pr-2">Мои кейсы и оплаты</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-300" />
                </button>
                <button
                  onClick={handleExportContext}
                  disabled={exportingContext}
                  className="w-full p-6 md:p-8 bg-blue-50 text-primary rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-blue-100 disabled:opacity-60 transition-all flex items-center justify-between group"
                >
                  <span className="break-words pr-2">{exportingContext ? 'Готовлю контекст' : 'Экспорт контекста'}</span>
                  <Download className="w-5 h-5 group-hover:translate-x-1 transition-transform text-primary/40" />
                </button>
                <button
                  onClick={async () => {
                    await roleApi.patientCreateCase('Новое обращение создано из кабинета пациента');
                    navigate('/appointments');
                  }}
                  className="w-full p-6 md:p-8 bg-emerald-50 text-emerald-600 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-between group"
                >
                  <span className="break-words pr-2">Создать кейс</span>
                  <Plus className="w-5 h-5 group-hover:translate-x-1 transition-transform text-emerald-300" />
                </button>
              </div>
            </div>

            <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center gap-6">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Оплачено</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">₸{paidAmount.toLocaleString('ru-RU')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

