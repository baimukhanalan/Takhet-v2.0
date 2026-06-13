import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShoppingBag, ArrowUpRight, Shield, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { FadeIn, FadeInStagger } from '../components/FadeIn';
import { useLanguage } from '../services/useLanguage';
import PublicHeader from '../components/PublicHeader';

const ServicesPage: React.FC<{ isPortal?: boolean }> = ({ isPortal = false }) => {
  const { t } = useLanguage();

  const services = [
    {
      id: 'pharmacy',
      title: t.services.pharmacy,
      desc: t.services.pharmacyDesc,
      icon: ShoppingBag,
      color: 'bg-primary text-white'
    },
    {
      id: 'homevisit',
      title: t.services.homeVisit,
      desc: t.services.homeVisitDesc,
      icon: Truck,
      color: 'bg-slate-900 text-white'
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {!isPortal ? <PublicHeader activePath="/services" /> : null}
      <div className={`max-w-6xl mx-auto space-y-8 md:space-y-12 pb-20 px-4 sm:px-6 lg:px-10 xl:px-0 ${isPortal ? 'pt-0' : 'pt-28 sm:pt-32'}`}>
        <FadeIn>
          <div className="space-y-2 md:space-y-4">
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-none">{t.services.title}</h1>
            <p className="text-muted-foreground text-base md:text-lg font-medium max-w-3xl">{t.services.subtitle}</p>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={0.2}>
          <div className="bg-amber-50 border-2 border-amber-100 p-6 md:p-10 rounded-3xl md:rounded-[4rem] flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-xl shadow-amber-500/5">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-amber-600" />
            </div>
            <div className="space-y-1 md:space-y-2 text-center md:text-left">
              <h3 className="text-amber-900 font-black uppercase tracking-tight text-xl md:text-2xl">Сервисы временно работают в ограниченном режиме</h3>
              <p className="text-amber-800 font-medium text-sm md:text-lg leading-relaxed">
                Сейчас вызов врача на дом и заказ лекарств временно приостановлены из-за вопросов логистики. Информация по услугам сохранена, чтобы пациенту было понятно, кому и в каких случаях они будут полезны после возобновления.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {services.map((service) => (
            <FadeIn key={service.id}>
              <Link to={`/services/${service.id}`} className="block h-full">
                <div className="bg-white p-8 md:p-12 rounded-3xl md:rounded-[4rem] border border-border shadow-sm flex flex-col justify-between group h-full min-h-[340px] md:min-h-[450px] gap-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/20">
                  <div className="space-y-6 md:space-y-8">
                    <div className={`w-16 h-16 md:w-24 md:h-24 ${service.color} rounded-2xl md:rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-105`}>
                      <service.icon className="w-8 h-8 md:w-12 md:h-12" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight">{service.title}</h3>
                    <p className="text-muted-foreground text-sm md:text-lg font-medium leading-relaxed">{service.desc}</p>
                  </div>

                  <div className="w-full py-4 md:py-6 bg-slate-50 text-slate-700 border border-slate-100 rounded-xl md:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs flex items-center justify-center gap-2 md:gap-3 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                    Открыть описание
                    <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>
              </Link>
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
    </div>
  );
};

export default ServicesPage;
