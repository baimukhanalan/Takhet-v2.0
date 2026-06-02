import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Wallet, Calendar, Download, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { roleApi } from '../../services/roleApi';

type PartnerPayment = {
  id: string;
  caseId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  provider: string;
  createdAt: string;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const PartnerFinances: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PartnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await roleApi.partnerPayments();
        setPayments(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить финансы партнера');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const stats = useMemo(() => {
    const paid = payments.filter((item) => item.status === 'paid');
    const pending = payments.filter((item) => item.status === 'pending');
    const totalPaid = paid.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const average = paid.length > 0 ? Math.round(totalPaid / paid.length) : 0;
    return { totalPaid, average, pending: pending.length, currency: paid[0]?.currency || payments[0]?.currency || '₸' };
  }, [payments]);

  if (loading) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.3em] text-slate-400">Загрузка финансов</div>;
  }

  if (error) {
    return <div className="max-w-7xl mx-auto py-20 text-center font-black uppercase tracking-[0.2em] text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Финансовый центр</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Все поступления и статусы оплат клиники собраны в одном разделе.</p>
        </div>
        <button onClick={() => {
          const rows = [['date','caseId','provider','amount','currency','status'], ...payments.map((item) => [formatDate(item.createdAt), item.caseId, item.provider, String(item.amount), item.currency, item.status])];
          const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'partner-payments.csv';
          link.click();
          URL.revokeObjectURL(url);
        }} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-3">
          <Download className="w-4 h-4" /> Выгрузить отчет
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-border shadow-sm space-y-6 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Получено</p>
            <p className="text-5xl font-black text-slate-900 mt-2">{stats.currency} {stats.totalPaid.toLocaleString()}</p>
            <div className="mt-6 flex items-center gap-2 text-success font-black text-xs uppercase">
              <TrendingUp className="w-4 h-4" /> {payments.filter((item) => item.status === 'paid').length} оплачено
            </div>
          </div>
          <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-50 group-hover:text-primary/5 transition-colors duration-500" />
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-border shadow-sm space-y-6">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Средний платеж</p>
          <p className="text-5xl font-black text-slate-900 mt-2">{stats.currency} {stats.average.toLocaleString()}</p>
          <button onClick={() => navigate('/reports')} className="text-primary font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-2">
            Анализ цен <TrendingUp className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-white space-y-6 relative overflow-hidden">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Ожидают</p>
          <p className="text-5xl font-black mt-2">{stats.pending}</p>
          <p className="text-slate-500 text-xs font-bold leading-relaxed">Количество транзакций, которые еще ждут завершения оплаты.</p>
          <PieChart className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5" />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] border border-border shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xl font-black uppercase tracking-tight">Последние транзакции</h3>
          <div className="flex gap-2">
            <button onClick={() => navigate('/reports')} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-all"><Calendar className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Дата</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Обращение</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Провайдер</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Сумма</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 text-sm font-bold text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="p-6 text-sm font-black text-slate-800">{item.caseId.slice(0, 8)}</td>
                  <td className="p-6 text-sm font-medium text-slate-600">{item.provider}</td>
                  <td className="p-6 text-sm font-black text-primary">{item.currency || '₸'} {Number(item.amount).toLocaleString()}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${item.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : item.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                      {item.status === 'paid' ? 'Оплачено' : item.status === 'pending' ? 'Ожидает' : 'Ошибка'}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 font-black uppercase tracking-widest">Нет транзакций</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartnerFinances;

