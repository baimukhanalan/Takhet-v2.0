import React from 'react';
import { ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PartnerReports: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center border border-amber-500/20 mb-8 animate-pulse">
        <ShieldAlert className="w-12 h-12 text-amber-500" />
      </div>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-none">Работа раздела приостановлена</h1>
        <p className="text-xl text-muted-foreground font-medium leading-relaxed">
          В связи с интеграцией новой системы предиктивной аналитики <span className="text-primary font-bold">Takhet AI v2.0</span>, 
          раздел отчетов временно недоступен для калибровки алгоритмов доходности и синхронизации с динамической базой данных клиники.
        </p>
        <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="px-6 py-3 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
            Ожидаемое время запуска: 24 марта
          </div>
          <button 
            onClick={() => navigate('/takhet-ai')}
            className="px-8 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5" /> Спросить Takhet AI о статусе
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerReports;
