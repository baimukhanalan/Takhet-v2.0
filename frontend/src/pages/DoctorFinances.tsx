import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { roleApi } from '../../services/roleApi';

const DoctorFinances: React.FC = () => {
  const [earnings, setEarnings] = useState<{ totalPaid: number; currency: string; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await roleApi.doctorEarnings();
        setEarnings(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить финансы врача');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка финансов</div>;
  }

  if (error || !earnings) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error || 'Финансовый раздел временно недоступен'}</div>;
  }

  const average = earnings.count > 0 ? Math.round(earnings.totalPaid / earnings.count) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Финансовый обзор</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Всего оплачено</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{earnings.currency} {Number(earnings.totalPaid).toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-green-600 font-bold text-sm">
            <TrendingUp className="w-4 h-4" /> {earnings.count} оплаченных консультаций
          </div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Средний платеж</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">{earnings.currency} {average.toLocaleString()}</p>
          <div className="mt-4 text-blue-600 font-bold text-sm">Рассчитано по реальным оплатам</div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Статус выплат</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">Под контролем</p>
          <div className="mt-4 flex items-center gap-2 text-slate-600 font-bold text-sm">
            <Wallet className="w-4 h-4" /> Автоматизация выплат потребует боевого банковского контура
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorFinances;

