import React from 'react';
import { ArrowLeft, ArrowUpRight, Clock3, ShieldAlert, UserRoundCheck } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import { useLanguage } from '../services/useLanguage';
import { serviceCatalogMap } from '../services/serviceCatalog';
import { getStoredLanguage } from '../services/language';
import type { Language } from '../services/language';

const pick = (lang: Language, value: { ru: string; kz: string; en: string }) => value[lang] || value.ru;

const ServiceDetailPage: React.FC<{ isPortal?: boolean }> = ({ isPortal = false }) => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const lang = getStoredLanguage();
  const service = serviceId ? serviceCatalogMap[serviceId] : null;

  if (!service) {
    return <Navigate replace to="/services" />;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {!isPortal ? <PublicHeader activePath="/services" /> : null}
      <main className={`px-4 sm:px-6 lg:px-12 xl:px-20 pb-16 sm:pb-20 ${isPortal ? 'pt-0' : 'pt-28 sm:pt-32 lg:pt-36'}`}>
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-slate-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t.auth.back}
          </button>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] items-start">
            <div className="rounded-[2rem] sm:rounded-[2.75rem] lg:rounded-[3.5rem] bg-slate-950 text-white p-6 sm:p-8 lg:p-12 space-y-5 shadow-2xl shadow-slate-950/10">
              <span className="inline-flex px-4 py-2 rounded-full bg-white/10 border border-white/10 text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-white/70">
                {lang === 'kz' ? 'Takhet сервистері' : lang === 'en' ? 'Takhet Services' : 'Сервисы Takhet'}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-tight leading-[0.95]">{pick(lang, service.title)}</h1>
              <p className="text-sm sm:text-lg lg:text-xl text-white/75 font-medium leading-relaxed max-w-3xl">{pick(lang, service.short)}</p>
              <a href="https://www.takhet.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white text-slate-950 px-5 py-3 sm:px-6 sm:py-3.5 font-black uppercase tracking-[0.18em] text-[10px] sm:text-xs hover:scale-[1.02] transition-transform">
                Takhet+
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            <div className="rounded-[2rem] sm:rounded-[2.75rem] lg:rounded-[3.5rem] border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:p-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-slate-400 mb-2">
                    {lang === 'kz' ? 'Мәртебе' : lang === 'en' ? 'Status' : 'Статус'}
                  </p>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900">{pick(lang, service.status)}</h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-2">{pick(lang, service.note)}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white p-5 border border-slate-200">
                  <Clock3 className="w-5 h-5 text-primary mb-3" />
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400 mb-2">
                    {lang === 'kz' ? 'Неге керек' : lang === 'en' ? 'Why it matters' : 'Зачем нужен'}
                  </p>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{pick(lang, service.why)}</p>
                </div>
                <div className="rounded-[1.5rem] bg-white p-5 border border-slate-200">
                  <UserRoundCheck className="w-5 h-5 text-primary mb-3" />
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400 mb-2">
                    {lang === 'kz' ? 'Бұл не' : lang === 'en' ? 'What it is' : 'Что это'}
                  </p>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{pick(lang, service.what)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2 items-start">
            <article className="rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-slate-400 mb-4">{lang === 'kz' ? 'Кімге арналған' : lang === 'en' ? 'Who it is for' : 'Для кого'}</p>
              <ul className="space-y-4">
                {service.forWho.map((item, index) => (
                  <li key={index} className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm sm:text-base text-slate-700 font-medium leading-relaxed">{pick(lang, item)}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.24em] text-slate-400 mb-4">{lang === 'kz' ? 'Не кіреді' : lang === 'en' ? 'What it includes' : 'Что входит'}</p>
              <ul className="space-y-4">
                {service.includes.map((item, index) => (
                  <li key={index} className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm sm:text-base text-slate-700 font-medium leading-relaxed">{pick(lang, item)}</li>
                ))}
              </ul>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ServiceDetailPage;
