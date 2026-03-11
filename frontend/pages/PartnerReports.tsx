
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, ArrowUpRight, DollarSign, Users, Briefcase, Download, Filter, ChevronDown, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { MockDB } from '../services/db';
import { translations, Language } from '../services/i18n';
import { roleApi } from '../services/roleApi';

const DATA_GROWTH = [
  { name: 'Янв', revenue: 4.2, consults: 120 },
  { name: 'Фев', revenue: 3.8, consults: 110 },
  { name: 'Мар', revenue: 5.1, consults: 150 },
  { name: 'Апр', revenue: 6.2, consults: 180 },
  { name: 'Май', revenue: 5.8, consults: 165 },
  { name: 'Июн', revenue: 7.4, consults: 210 },
];

const PIE_DATA = [
  { name: 'Кардиология', value: 400, color: '#0D47A1' },
  { name: 'Неврология', value: 300, color: '#00BFA5' },
  { name: 'Педиатрия', value: 300, color: '#64B5F6' },
  { name: 'Терапия', value: 200, color: '#CFD8DC' },
];

const PartnerReports: React.FC = () => {
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  const [period, setPeriod] = useState('30_days');
  const [backendStats, setBackendStats] = useState<any>(null);

  useEffect(() => {
    const handleUpdate = async () => {
      setLang(MockDB.getLang());
      try {
        const [dashboard, payments] = await Promise.all([
          roleApi.partnerDashboard(),
          roleApi.partnerPayments()
        ]);
        setBackendStats({ dashboard, payments });
      } catch {
        setBackendStats(null);
      }
    };
    handleUpdate();
    window.addEventListener('storage_update', handleUpdate as any);
    return () => window.removeEventListener('storage_update', handleUpdate as any);
  }, []);

  const t = translations[lang];

  const totalPayments = backendStats?.payments?.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0) || 0;
  const paymentCount = backendStats?.payments?.length || 0;
  const avgCheck = paymentCount ? Math.round(totalPayments / paymentCount) : 14200;
  const totalCases = backendStats?.dashboard?.analytics?.totalCases || 0;
  const closedCases = backendStats?.dashboard?.analytics?.closedCases || 0;
  const conversion = totalCases ? Math.min(100, Math.round((closedCases / totalCases) * 100)) : 72;


  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">{t.sidebar.reports}</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Финансовая и операционная аналитика клиники.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-8 py-4 bg-white border border-border rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
             <Calendar className="w-5 h-5 text-primary" /> Последние 30 дней <ChevronDown className="w-4 h-4" />
          </button>
          <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
             <Download className="w-5 h-5" /> Экспорт PDF
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* Main Revenue Chart */}
         <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-border shadow-sm space-y-10">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-black tracking-tight uppercase">Динамика выручки</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Миллионы тенге (₸)</p>
               </div>
               <div className="bg-primary/5 text-primary px-5 py-2 rounded-2xl flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> <span className="font-black text-sm">{backendStats ? `+${backendStats.dashboard?.analytics?.closedCases || 0}` : '+24%'}</span>
               </div>
            </div>
            <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DATA_GROWTH}>
                     <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#0D47A1" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#0D47A1" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF1" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '10px', fontWeight: 'bold'}} />
                     <YAxis axisLine={false} tickLine={false} style={{fontSize: '10px', fontWeight: 'bold'}} />
                     <Tooltip contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'}} />
                     <Area type="monotone" dataKey="revenue" stroke="#0D47A1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Distribution Chart */}
         <div className="lg:col-span-4 bg-white p-10 rounded-[3.5rem] border border-border shadow-sm space-y-10">
            <h3 className="text-2xl font-black tracking-tight uppercase">По направлениям</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                     <Pie data={PIE_DATA} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {PIE_DATA.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </RePieChart>
               </ResponsiveContainer>
            </div>
            <div className="space-y-4">
               {PIE_DATA.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                        <span className="text-sm font-bold text-slate-600">{item.name}</span>
                     </div>
                     <span className="text-sm font-black text-slate-900">{((item.value / 1200) * 100).toFixed(0)}%</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Secondary Stats */}
         <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
               { label: 'Средний чек', val: `${avgCheck.toLocaleString()}₸`, icon: DollarSign, change: '+5%' },
               { label: 'Конверсия записи', val: `${conversion}%`, icon: Briefcase, change: '+12%' },
               { label: 'Новые пациенты', val: `+${backendStats?.dashboard?.analytics?.activeCases || 240}`, icon: Users, change: '+18%' },
               { label: 'LTV пациента', val: `${((backendStats?.dashboard?.paymentCount || 4) * 12000).toLocaleString()}₸`, icon: BarChart3, change: '+3%' },
            ].map((stat, i) => (
               <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm group hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between mb-4">
                     <div className="w-12 h-12 bg-slate-50 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <stat.icon className="w-6 h-6" />
                     </div>
                     <span className="text-[10px] font-black text-success uppercase">{stat.change}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground mt-1">{stat.val}</p>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default PartnerReports;
