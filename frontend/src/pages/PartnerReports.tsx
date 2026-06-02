import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, CreditCard, Download, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { roleApi } from '../../services/roleApi';

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

type PartnerPayment = {
  id: string;
  amount: number;
  currency?: string | null;
  status?: string | null;
  createdAt?: string;
  caseId?: string | null;
};

const PartnerReports: React.FC = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<PartnerDashboardResponse | null>(null);
  const [payments, setPayments] = useState<PartnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [dashboardData, paymentData] = await Promise.all([
          roleApi.partnerDashboard(),
          roleApi.partnerPayments()
        ]);

        setDashboard(dashboardData);
        setPayments(paymentData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить отчеты');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const totals = useMemo(() => {
    const revenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const paid = payments.filter((payment) => payment.status === 'paid').length;
    return { revenue, paid };
  }, [payments]);

  const downloadReport = () => {
    if (!dashboard) return;

    const lines = [
      'metric,value',
      `total_cases,${dashboard.analytics.totalCases}`,
      `active_cases,${dashboard.analytics.activeCases}`,
      `in_review_cases,${dashboard.analytics.inReviewCases}`,
      `closed_cases,${dashboard.analytics.closedCases}`,
      `active_doctors,${dashboard.doctorStats.active}`,
      `pending_doctors,${dashboard.doctorStats.pending}`,
      `paid_payments,${totals.paid}`,
      `revenue_kzt,${totals.revenue}`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'partner-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка отчетов</div>;
  }

  if (error || !dashboard) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error || 'Отчеты временно недоступны'}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-foreground">Отчеты клиники</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Ключевые показатели, оплаты и структура обращений в одном разделе.</p>
        </div>
        <button onClick={downloadReport} className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
          <Download className="w-4 h-4" />
          Скачать отчет
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'Всего обращений', value: dashboard.analytics.totalCases, icon: BarChart3, action: () => navigate('/dashboard') },
          { label: 'Активные врачи', value: dashboard.doctorStats.active, icon: Users, action: () => navigate('/partner-doctors') },
          { label: 'Оплачено', value: totals.paid, icon: ShieldCheck, action: () => navigate('/finances') },
          { label: 'Выручка', value: `${totals.revenue} ₸`, icon: CreditCard, action: () => navigate('/finances') }
        ].map((item) => (
          <button key={item.label} onClick={item.action} className="rounded-[2rem] bg-white border border-border p-6 shadow-sm text-left">
            <item.icon className="w-8 h-8 text-primary" />
            <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{item.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-[2rem] bg-white border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-2xl font-black tracking-tight uppercase">Статусы обращений</h2>
          {[
            ['Новые', dashboard.analytics.totalCases - dashboard.analytics.activeCases - dashboard.analytics.inReviewCases - dashboard.analytics.closedCases],
            ['В работе', dashboard.analytics.activeCases],
            ['На проверке', dashboard.analytics.inReviewCases],
            ['Закрытые', dashboard.analytics.closedCases]
          ].map(([label, value]) => (
            <button key={label} onClick={() => navigate('/dashboard')} className="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4 w-full text-left">
              <span className="font-black text-slate-700 uppercase tracking-widest text-[10px]">{label}</span>
              <span className="text-xl font-black text-slate-900">{value}</span>
            </button>
          ))}
        </div>

        <div className="rounded-[2rem] bg-white border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-2xl font-black tracking-tight uppercase">Последние оплаты</h2>
          <div className="space-y-3">
            {payments.length > 0 ? payments.slice(0, 6).map((payment) => (
              <button key={payment.id} onClick={() => navigate('/finances')} className="rounded-2xl bg-slate-50 px-5 py-4 flex items-center justify-between gap-4 w-full text-left">
                <div>
                  <p className="font-black text-slate-900">Обращение #{payment.caseId?.slice(0, 8) || '—'}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">{payment.createdAt ? new Date(payment.createdAt).toLocaleString('ru-RU') : 'недавно'}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">{payment.amount} {payment.currency || '₸'}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{payment.status || 'ожидает'}</p>
                </div>
              </button>
            )) : (
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Оплат пока нет</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerReports;

