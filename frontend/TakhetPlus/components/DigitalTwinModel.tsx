
import React, { useState, useEffect } from 'react';
import { DigitalTwinState } from '../types';
import { Brain, ShieldAlert, Heart, Zap, Wind } from 'lucide-react';
import { MockDB } from '../services/db';
import { translations, Language } from '../services/i18n';

interface Props {
  state: DigitalTwinState;
}

const DigitalTwinModel: React.FC<Props> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'stats'>('visual');
  const [lang, setLang] = useState<Language>(MockDB.getLang());

  useEffect(() => {
    const handleUpdate = () => setLang(MockDB.getLang());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const t = translations[lang]?.dashboard?.digitalTwin || translations.ru.dashboard.digitalTwin;

  return (
    <div className="relative w-full bg-slate-900 rounded-[3rem] p-6 md:p-10 overflow-hidden shadow-2xl border border-white/5 h-full">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[120px] -mr-40 -mt-40"></div>
      
      <div className="flex justify-between items-center mb-10 relative z-10">
        <div>
          <h3 className="text-white text-2xl font-black tracking-tighter uppercase">{t.title} <span className="text-accent text-xs">{t.version}</span></h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">{t.subtitle}</p>
        </div>
        <div className="flex bg-white/5 rounded-2xl p-1 backdrop-blur-md">
          {[
            { id: 'visual', label: t.tabModel },
            { id: 'stats', label: t.tabForecast }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'visual' ? (
        <div className="relative h-80 flex items-center justify-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
             <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping duration-[3s]"></div>
             <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse blur-3xl"></div>
             <div className="relative w-32 h-32 bg-gradient-to-tr from-primary to-accent rounded-full flex flex-col items-center justify-center shadow-[0_0_80px_rgba(13,71,161,0.6)] border-4 border-white/20 z-10">
                <span className="text-white text-4xl font-black leading-none">{state.overallScore}</span>
                <span className="text-[8px] text-white/60 font-black uppercase tracking-widest mt-1">{t.healthScore}</span>
             </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center scale-90 md:scale-100">
             {[
               { icon: Heart, label: t.systems.cardio, status: state.systemStatus.cardio, pos: 'top-0 left-1/2 -translate-x-1/2' },
               { icon: Brain, label: t.systems.neuro, status: state.systemStatus.neuro, pos: 'bottom-0 left-1/2 -translate-x-1/2' },
               { icon: Zap, label: t.systems.metabol, status: state.systemStatus.metabolic, pos: 'left-0 top-1/2 -translate-y-1/2' },
               { icon: ShieldAlert, label: t.systems.immune, status: state.systemStatus.immunity, pos: 'right-0 top-1/2 -translate-y-1/2' },
               { icon: Wind, label: t.systems.respir, status: state.systemStatus.respiratory, pos: 'top-10 right-10' }
             ].map((node, i) => (
               <div key={i} className={`absolute ${node.pos} flex flex-col items-center gap-2 group transition-all`}>
                  <div className={`w-14 h-14 rounded-3xl border-2 flex items-center justify-center transition-all shadow-lg ${node.status < 70 ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-white group-hover:bg-white group-hover:text-slate-900'}`}>
                    <node.icon className="w-7 h-7" />
                  </div>
                  <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">{node.label} {node.status}%</span>
                  </div>
               </div>
             ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right duration-500">
           {state.risks.map((risk, i) => (
             <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-colors">
                <div className="space-y-1">
                   <h4 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{risk.label} <span className="text-primary-foreground/40 font-normal">[{risk.type}]</span></h4>
                   <p className="text-slate-400 text-[10px] font-bold">{t.horizon}: {risk.timeline}</p>
                </div>
                <div className="text-right">
                   <p className={`text-2xl font-black ${risk.probability > 25 ? 'text-red-500' : 'text-accent'}`}>{risk.probability}%</p>
                   <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${risk.probability > 25 ? 'bg-red-500' : 'bg-accent'}`} style={{ width: `${risk.probability}%` }}></div>
                   </div>
                </div>
             </div>
           ))}
           <div className="md:col-span-2 pt-6 border-t border-white/10 flex justify-between items-center px-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t.bioAge}</span>
                <span className="text-3xl font-black text-accent">{state.bioAge} {t.years}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t.systemWear}</span>
                <span className="text-3xl font-black text-white">12%</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DigitalTwinModel;
