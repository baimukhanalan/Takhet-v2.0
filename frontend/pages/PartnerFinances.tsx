
import React from 'react';
import { DollarSign, TrendingUp, ArrowUpRight, Wallet, Calendar, Download, PieChart, ArrowDownRight } from 'lucide-react';

const PartnerFinances: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Финансовый центр</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Управление доходами и взаиморасчетами клиники.</p>
        </div>
        <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-3">
          <Download className="w-4 h-4" /> Выгрузить отчет
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-border shadow-sm space-y-6 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Баланс к выплате</p>
            <p className="text-5xl font-black text-slate-900 mt-2">₸2,450,000</p>
            <div className="mt-6 flex items-center gap-2 text-success font-black text-xs uppercase">
              <TrendingUp className="w-4 h-4" /> +15.4% к пр. месяцу
            </div>
          </div>
          <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-50 group-hover:text-primary/5 transition-colors duration-500" />
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-border shadow-sm space-y-6">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Средний чек</p>
          <p className="text-5xl font-black text-slate-900 mt-2">₸14,200</p>
          <button className="text-primary font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-2">
            Анализ цен <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-6 relative overflow-hidden">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Комиссия Takhet+</p>
          <p className="text-5xl font-black mt-2">15%</p>
          <p className="text-slate-500 text-xs font-bold leading-relaxed">Фиксированная ставка для партнеров. Все налоги включены.</p>
          <PieChart className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5" />
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-xl font-black uppercase tracking-tight">Последние транзакции</h3>
           <div className="flex gap-2">
             <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-all"><Calendar className="w-5 h-5"/></button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Дата</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Врач</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Услуга</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Сумма</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { date: 'Сегодня, 14:20', doc: 'Др. Михаил М.', service: 'Видео-консультация', amount: '₸15,000', status: 'Success' },
                { date: 'Сегодня, 12:45', doc: 'Др. Асем С.', service: 'Повторный прием', amount: '₸8,000', status: 'Success' },
                { date: 'Вчера, 18:10', doc: 'Др. Алиби Б.', service: 'Выезд на дом', amount: '₸25,000', status: 'Pending' },
              ].map((t, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 text-sm font-bold text-slate-500">{t.date}</td>
                  <td className="p-6 text-sm font-black text-slate-800">{t.doc}</td>
                  <td className="p-6 text-sm font-medium text-slate-600">{t.service}</td>
                  <td className="p-6 text-sm font-black text-primary">{t.amount}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${t.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartnerFinances;
