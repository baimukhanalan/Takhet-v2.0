
import React from 'react';
import { Truck, ShoppingBag, ArrowUpRight, ShieldCheck, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();

  const services = [
    { 
      id: 'pharmacy', 
      title: 'Аптека и Доставка', 
      desc: 'Заказ рецептурных и безрецептурных лекарств с доставкой за 30 минут.', 
      icon: ShoppingBag, 
      color: 'bg-primary text-white', 
      path: '/pharmacy' 
    },
    { 
      id: 'homevisit', 
      title: 'Вызов врача на дом', 
      desc: 'Квалифицированный терапевт или медсестра приедут к вам в течение часа.', 
      icon: Truck, 
      color: 'bg-slate-900 text-white', 
      path: '/home-visit' 
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="space-y-4">
        <h1 className="text-5xl font-black text-foreground tracking-tighter">Сервисы</h1>
        <p className="text-muted-foreground text-lg font-medium">Дополнительные услуги для вашего комфорта.</p>
      </div>

      {/* Temporary Warning Banner */}
      <div className="bg-amber-50 border-2 border-amber-100 p-10 rounded-[4rem] flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-amber-500/5 animate-in slide-in-from-top duration-700">
         <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
         </div>
         <div className="space-y-2 text-center md:text-left">
            <h3 className="text-amber-900 font-black uppercase tracking-tight text-2xl">Временная приостановка</h3>
            <p className="text-amber-800 font-medium text-lg leading-relaxed">
              Работа разделов «Аптека» и «Вызов на дом» временно ограничена в связи с обновлением логистической системы. 
              Мы скоро вернемся с улучшенным сервисом!
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 opacity-40 pointer-events-none grayscale">
        {services.map(s => (
          <div key={s.id} className="bg-white p-12 rounded-[4rem] border border-border shadow-sm flex flex-col justify-between group h-[450px]">
             <div className="space-y-8">
                <div className={`w-24 h-24 ${s.color} rounded-[2.5rem] flex items-center justify-center shadow-2xl`}>
                  <s.icon className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">{s.title}</h3>
                <p className="text-muted-foreground text-lg font-medium leading-relaxed">{s.desc}</p>
             </div>
             
             <button 
               className="w-full py-6 bg-slate-50 text-slate-400 border border-slate-100 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
             >
               Скоро появится <ArrowUpRight className="w-5 h-5" />
             </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 p-12 rounded-[4rem] grid grid-cols-1 md:grid-cols-3 gap-12 text-center border border-slate-100">
         <div className="space-y-4">
            <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
            <h4 className="font-black text-sm uppercase tracking-widest text-slate-700">Безопасно</h4>
            <p className="text-xs text-muted-foreground font-bold">Лицензированные препараты.</p>
         </div>
         <div className="space-y-4">
            <Clock className="w-10 h-10 text-primary mx-auto" />
            <h4 className="font-black text-sm uppercase tracking-widest text-slate-700">Экспресс</h4>
            <p className="text-xs text-muted-foreground font-bold">Доставка за 30 минут.</p>
         </div>
         <div className="space-y-4">
            <MapPin className="w-10 h-10 text-primary mx-auto" />
            <h4 className="font-black text-sm uppercase tracking-widest text-slate-700">Доступно</h4>
            <p className="text-xs text-muted-foreground font-bold">Во всех крупных городах.</p>
         </div>
      </div>
    </div>
  );
};

export default ServicesPage;
