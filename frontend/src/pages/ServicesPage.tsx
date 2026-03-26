import React from 'react';
import { Truck, ShoppingBag, ArrowUpRight, Shield, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FadeIn, FadeInStagger } from '../components/FadeIn';
import { useLanguage } from '../services/useLanguage';

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const services = [
    { 
      id: 'pharmacy', 
      title: t.services.pharmacy, 
      desc: t.services.pharmacyDesc, 
      icon: ShoppingBag, 
      color: 'bg-primary text-white', 
      path: '/pharmacy' 
    },
    { 
      id: 'homevisit', 
      title: t.services.homeVisit, 
      desc: t.services.homeVisitDesc, 
      icon: Truck, 
      color: 'bg-slate-900 text-white', 
      path: '/home-visit' 
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 pb-20 px-4 md:px-0">
      <FadeIn>
        <div className="space-y-2 md:space-y-4">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-none">{t.services.title}</h1>
          <p className="text-muted-foreground text-base md:text-lg font-medium">{t.services.subtitle}</p>
        </div>
      </FadeIn>

      {/* Temporary Warning Banner */}
      <FadeIn direction="up" delay={0.2}>
        <div className="bg-amber-50 border-2 border-amber-100 p-6 md:p-10 rounded-3xl md:rounded-[4rem] flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-xl shadow-amber-500/5">
           <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-100 rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-amber-600" />
           </div>
           <div className="space-y-1 md:space-y-2 text-center md:text-left">
              <h3 className="text-amber-900 font-black uppercase tracking-tight text-xl md:text-2xl">{t.services.warningTitle}</h3>
              <p className="text-amber-800 font-medium text-sm md:text-lg leading-relaxed">
                {t.services.warningDesc}
              </p>
           </div>
        </div>
      </FadeIn>

      <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 opacity-40 pointer-events-none grayscale">
        {services.map(s => (
          <FadeIn key={s.id}>
            <div className="bg-white p-8 md:p-12 rounded-3xl md:rounded-[4rem] border border-border shadow-sm flex flex-col justify-between group h-auto md:h-[450px] gap-8">
               <div className="space-y-6 md:space-y-8">
                  <div className={`w-16 h-16 md:w-24 md:h-24 ${s.color} rounded-2xl md:rounded-[2.5rem] flex items-center justify-center shadow-2xl`}>
                    <s.icon className="w-8 h-8 md:w-12 md:h-12" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight">{s.title}</h3>
                  <p className="text-muted-foreground text-sm md:text-lg font-medium leading-relaxed">{s.desc}</p>
               </div>
               
               <button 
                 className="w-full py-4 md:py-6 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl md:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs flex items-center justify-center gap-2 md:gap-3"
               >
                 {t.services.soon} <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
               </button>
            </div>
          </FadeIn>
        ))}
      </FadeInStagger>

      <FadeIn direction="up" delay={0.4}>
        <div className="bg-slate-50 p-8 md:p-12 rounded-3xl md:rounded-[4rem] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 text-center border border-slate-100">
           <div className="space-y-3 md:space-y-4">
              <Shield className="w-8 h-8 md:w-10 md:h-10 text-primary mx-auto" />
              <h4 className="font-black text-xs md:text-sm uppercase tracking-widest text-slate-700">{t.services.safe}</h4>
              <p className="text-[10px] md:text-xs text-muted-foreground font-bold">{t.services.safeDesc}</p>
           </div>
           <div className="space-y-3 md:space-y-4">
              <Clock className="w-8 h-8 md:w-10 md:h-10 text-primary mx-auto" />
              <h4 className="font-black text-xs md:text-sm uppercase tracking-widest text-slate-700">{t.services.express}</h4>
              <p className="text-[10px] md:text-xs text-muted-foreground font-bold">{t.services.expressDesc}</p>
           </div>
           <div className="space-y-3 md:space-y-4 sm:col-span-2 md:col-span-1">
              <MapPin className="w-8 h-8 md:w-10 md:h-10 text-primary mx-auto" />
              <h4 className="font-black text-xs md:text-sm uppercase tracking-widest text-slate-700">{t.services.accessible}</h4>
              <p className="text-[10px] md:text-xs text-muted-foreground font-bold">{t.services.accessibleDesc}</p>
           </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default ServicesPage;
