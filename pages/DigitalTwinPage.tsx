
import React, { useState, useEffect, useRef } from 'react';
import { User, DigitalTwinState, BodyType, ActivityType } from '../types';
// Added ToggleLeft and ToggleRight to the imports to fix the errors on lines 375, 381, 387
import { 
  Activity, HeartPulse, ShieldAlert, 
  RotateCw, Ruler, Weight, 
  Smoking, Clock, Zap, ArrowLeft, 
  TrendingUp, Info, X, Plus,
  UserCheck, Move3d, FileText, Sparkles, BrainCircuit,
  Dna, Target, Gauge, ZapOff, CheckCircle2, Moon, AlertTriangle, RefreshCcw,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MockDB } from '../services/db';
import { calculateWhatIfEffect } from '../services/medicalEngine';

const DigitalTwin3DModel: React.FC<{ twin: DigitalTwinState }> = ({ twin }) => {
  const [rotation, setRotation] = useState(20);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef(0);

  const bmi = twin.weight / ((twin.height / 100) ** 2);
  const isMale = twin.gender === 'male';
  
  const bodyTypeScale = twin.bodyType === 'Ectomorph' ? 0.85 : twin.bodyType === 'Endomorph' ? 1.35 : 1.1;
  const bmiFactor = Math.max(0.7, Math.min(1.7, bmi / 22));
  const finalVolume = bodyTypeScale * bmiFactor;

  const shouldersWidth = isMale ? 135 * finalVolume : 110 * finalVolume;
  const hipsWidth = isMale ? 90 * finalVolume : 130 * finalVolume;
  const thickness = 65 * finalVolume;

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    lastX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const delta = currentX - lastX.current;
    setRotation(prev => prev + delta * 1.5);
    lastX.current = currentX;
  };

  const handleEnd = () => setIsDragging(false);

  return (
    <div 
      className="relative w-full h-[600px] flex items-center justify-center perspective-[2500px] select-none cursor-grab active:cursor-grabbing overflow-hidden rounded-[4rem] bg-gradient-to-b from-slate-50/50 to-blue-50/30"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#0D47A1 1px, transparent 0)', backgroundSize: '40px 40px' }} 
      />

      <div 
        className="relative transition-transform duration-200 ease-out preserve-3d"
        style={{ transform: `rotateY(${rotation}deg)` }}
      >
        <div className="relative flex flex-col items-center">
           <div 
             className="bg-white border border-slate-200 rounded-full mb-3 shadow-sm transition-all duration-500"
             style={{ width: '52px', height: '68px', transform: `translateZ(${thickness * 0.15}px)` }}
           />

           <div className="preserve-3d relative">
              <div 
                className="bg-white border border-slate-200/80 rounded-[3rem] transition-all duration-700 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] backdrop-blur-[2px]"
                style={{ 
                  width: `${shouldersWidth}px`, 
                  height: '185px',
                  clipPath: isMale 
                    ? 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)' 
                    : 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                  transform: `translateZ(${thickness / 2}px)`
                }}
              >
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full blur-2xl ${twin.systemStatus.cardio < 75 ? 'bg-red-500/20' : 'bg-primary/5'}`} />
                 {twin.bloodPressure.sys > 140 && <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-16 h-16 bg-red-400/10 rounded-full animate-pulse blur-xl" />}
              </div>
              <div 
                className="absolute top-0 left-1/2 bg-slate-100 border-x border-slate-200 opacity-20"
                style={{ width: `${thickness}px`, height: '185px', transform: 'translateX(-50%) rotateY(90deg)', borderRadius: '2rem' }}
              />
           </div>

           <div 
             className="bg-white border border-slate-200/80 -mt-2 transition-all duration-700 rounded-[2.2rem] shadow-sm"
             style={{ width: `${hipsWidth}px`, height: '70px', transform: `translateZ(${thickness * 0.1}px)` }}
           />

           <div className="flex gap-12 mt-2">
              <div className="w-14 h-52 bg-white rounded-full border border-slate-200/60 shadow-sm" />
              <div className="w-14 h-52 bg-white rounded-full border border-slate-200/60 shadow-sm" />
           </div>
        </div>

        <div className="absolute top-[85px] w-full flex justify-between" style={{ width: `${shouldersWidth + 80}px`, left: '50%', transform: 'translateX(-50%)' }}>
           <div className="w-12 h-44 bg-white/90 rounded-full border border-slate-200/60" style={{ transform: 'rotate(10deg)' }} />
           <div className="w-12 h-44 bg-white/90 rounded-full border border-slate-200/60" style={{ transform: 'rotate(-10deg)' }} />
        </div>
      </div>

      <div className="absolute top-10 right-10 pointer-events-none space-y-4">
         <div className="bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Index Volume</p>
            <div className="flex items-center gap-3">
               <span className="text-slate-900 text-2xl font-black">{finalVolume.toFixed(2)}</span>
               <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(finalVolume/2.5)*100}%` }} />
               </div>
            </div>
         </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-md px-8 py-4 rounded-full border border-slate-200 shadow-sm hover:bg-white transition-all">
         <Move3d className="w-5 h-5 text-primary opacity-50" />
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Вращайте симуляцию</span>
      </div>
    </div>
  );
};

const DigitalTwinPage: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [twin, setTwin] = useState<DigitalTwinState | null>(null);
  const [activeTab, setActiveTab] = useState<'bio' | 'vitals' | 'habits'>('bio');
  const [whatIfChanges, setWhatIfChanges] = useState<Partial<DigitalTwinState>>({});
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    const data = MockDB.getActiveMemberData();
    if (data) setTwin(data.digitalTwin);
  }, []);

  const handleUpdate = (params: Partial<DigitalTwinState>) => {
    if (!twin) return;
    const newTwin = { ...twin, ...params };
    setTwin(newTwin);
    MockDB.updateTwinParams(MockDB.getSelectedMemberId(), params);
  };

  const handleSimulate = (changes: Partial<DigitalTwinState>) => {
    setIsSimulating(true);
    setWhatIfChanges(prev => ({ ...prev, ...changes }));
    setTimeout(() => setIsSimulating(false), 300);
  };

  const simulationResult = twin ? calculateWhatIfEffect(twin, whatIfChanges) : null;

  if (!twin) return null;

  const bmi = +(twin.weight / ((twin.height / 100) ** 2)).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto pb-40 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-4 lg:px-0">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate('/dashboard')} className="p-5 bg-white rounded-3xl hover:bg-slate-50 border border-slate-100 transition-all shadow-sm group">
             <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
           </button>
           <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Digital <span className="text-primary italic">Twin</span></h1>
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.4em] mt-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Динамическая модель состояния
              </p>
           </div>
        </div>
        
        <div className="flex items-center gap-10 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden group">
           <div className={`absolute inset-0 bg-primary/5 transition-opacity duration-1000 ${isSimulating ? 'opacity-100' : 'opacity-0'}`} />
           <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary"><Gauge className="w-6 h-6" /></div>
              <div className="text-right">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Health Score</p>
                 <p className={`text-3xl font-black transition-all ${isSimulating ? 'text-primary scale-110' : 'text-slate-900'}`}>
                    {isSimulating ? simulationResult?.score : twin.overallScore}%
                 </p>
              </div>
           </div>
           <div className="w-px h-10 bg-slate-100 relative z-10" />
           <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Dna className="w-6 h-6" /></div>
              <div className="text-right">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Био-возраст</p>
                 <p className={`text-3xl font-black transition-all ${isSimulating ? 'text-emerald-500 scale-110' : 'text-emerald-600'}`}>
                    {isSimulating ? simulationResult?.bioAge : twin.bioAge}
                 </p>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4 lg:px-0">
        
        {/* LEFT CONTROL PANEL */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 flex">
              {(['bio', 'vitals', 'habits'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-4 rounded-[1.8rem] text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                  {t === 'bio' ? 'База' : t === 'vitals' ? 'Vitals' : 'Стиль'}
                </button>
              ))}
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 min-h-[500px]">
              {activeTab === 'bio' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid grid-cols-2 gap-3">
                     {['male', 'female'].map(g => (
                       <button 
                        key={g} 
                        onClick={() => handleUpdate({gender: g as any})}
                        className={`py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest border transition-all ${twin.gender === g ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                       >
                         {g === 'male' ? 'Мужчина' : 'Женщина'}
                       </button>
                     ))}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-2">Рост (см)</label>
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-3">
                           <Ruler className="w-4 h-4 text-slate-300" />
                           <input type="number" value={twin.height} onChange={e => handleUpdate({height: +e.target.value})} className="bg-transparent border-none outline-none font-black text-lg w-full" />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-2">Вес (кг)</label>
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-3">
                           <Weight className="w-4 h-4 text-slate-300" />
                           <input type="number" value={twin.weight} onChange={e => handleUpdate({weight: +e.target.value})} className="bg-transparent border-none outline-none font-black text-lg w-full" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-2">Морфотип</label>
                     <div className="grid gap-2">
                        {(['Ectomorph', 'Mesomorph', 'Endomorph'] as BodyType[]).map(t => (
                          <button key={t} onClick={() => handleUpdate({bodyType: t})} className={`p-5 rounded-2xl border text-left transition-all ${twin.bodyType === t ? 'border-primary bg-primary/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                             <div className="flex justify-between items-center">
                                <span className="font-bold text-xs uppercase tracking-widest">{t}</span>
                                {twin.bodyType === t && <CheckCircle2 className="w-4 h-4 text-primary" />}
                             </div>
                          </button>
                        ))}
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'vitals' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                   <div className="space-y-6">
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                         <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Давление (SYS/DIA)</h4>
                            <HeartPulse className="w-5 h-5 text-red-400" />
                         </div>
                         <div className="flex items-center gap-4">
                            <input type="number" value={twin.bloodPressure.sys} onChange={e => handleUpdate({bloodPressure: {...twin.bloodPressure, sys: +e.target.value}})} className="w-20 bg-white p-4 rounded-xl font-black text-xl text-center border border-slate-200" />
                            <span className="text-2xl font-black text-slate-300">/</span>
                            <input type="number" value={twin.bloodPressure.dia} onChange={e => handleUpdate({bloodPressure: {...twin.bloodPressure, dia: +e.target.value}})} className="w-20 bg-white p-4 rounded-xl font-black text-xl text-center border border-slate-200" />
                            <span className="text-xs font-bold text-slate-400">mmHg</span>
                         </div>
                         {twin.bloodPressure.sys > 140 && <p className="text-[9px] font-black text-red-500 uppercase flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> Высокое давление</p>}
                      </div>

                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                         <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Глюкоза</h4>
                            <Zap className="w-5 h-5 text-amber-400" />
                         </div>
                         <div className="flex items-center gap-4">
                            <input type="number" step="0.1" value={twin.glucose} onChange={e => handleUpdate({glucose: +e.target.value})} className="w-32 bg-white p-4 rounded-xl font-black text-xl text-center border border-slate-200" />
                            <span className="text-xs font-bold text-slate-400">mmol/L</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${twin.glucose > 6 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${(twin.glucose / 15) * 100}%` }} />
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'habits' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="space-y-6">
                     {[
                       { label: 'Сон (час/день)', key: 'sleepHours' as const, icon: Moon, max: 12 },
                       { label: 'Стресс', key: 'stressLevel' as const, icon: AlertTriangle, max: 10 }
                     ].map(item => (
                        <div key={item.key} className="space-y-4">
                           <div className="flex justify-between items-center px-2">
                              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                 <item.icon className="w-3 h-3" /> {item.label}
                              </label>
                              <span className="text-sm font-black text-slate-900">{twin[item.key]}</span>
                           </div>
                           <input type="range" min="0" max={item.max} step="0.5" value={twin[item.key]} onChange={e => handleUpdate({[item.key]: +e.target.value})} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" />
                        </div>
                     ))}
                  </div>

                  <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50">
                     <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">История поведенческих факторов</p>
                     <div className="flex items-end gap-1 h-12">
                        {[40, 60, 55, 80, 70, 90, 85].map((h, i) => (
                          <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary transition-all cursor-help" style={{ height: `${h}%` }} title={`Day ${i+1}: ${h}%`} />
                        ))}
                     </div>
                  </div>
                </div>
              )}
           </div>
        </div>

        {/* 3D VISUALIZER COLUMN */}
        <div className="lg:col-span-5 bg-white rounded-[4rem] flex flex-col justify-between overflow-hidden shadow-sm relative border border-slate-100">
           <div className="p-12 flex justify-between items-start relative z-10">
              <div className="space-y-1">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Biometric simulation</h2>
                 <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">Rendering Live</p>
              </div>
              <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-700 ${bmi > 25 ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                 ИМТ: {bmi}
              </div>
           </div>
           
           <DigitalTwin3DModel twin={twin} />

           <div className="p-10 grid grid-cols-3 gap-8 relative z-10 bg-slate-50/50 backdrop-blur-md border-t border-slate-100">
              {[
                { label: 'Cardio', val: twin.systemStatus.cardio, color: 'bg-red-400', icon: HeartPulse },
                { label: 'Metabol', val: twin.systemStatus.metabolic, color: 'bg-amber-400', icon: Zap },
                { label: 'Neuro', val: twin.systemStatus.neuro, color: 'bg-blue-400', icon: BrainCircuit }
              ].map(s => (
                <div key={s.label} className="space-y-3">
                   <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5"><s.icon className="w-2.5 h-2.5" /> {s.label}</div>
                      <span className="text-slate-700">{s.val}%</span>
                   </div>
                   <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} transition-all duration-1000`} style={{ width: `${s.val}%` }} />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* WHAT-IF SIMULATOR COLUMN */}
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-slate-900 p-10 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-10 -mt-10" />
              <div className="relative z-10 flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-primary backdrop-blur-md"><RefreshCcw className="w-5 h-5" /></div>
                 <h3 className="text-xl font-black uppercase tracking-tight">What-if симулятор</h3>
              </div>
              
              <div className="relative z-10 space-y-6">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Симуляция изменений образа жизни на прогноз здоровья:</p>
                 
                 <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                       <span className="text-xs font-bold">Бросить курить</span>
                       <button onClick={() => handleSimulate({ smoking: whatIfChanges.smoking === 0 ? twin.smoking : 0 })}>
                          {whatIfChanges.smoking === 0 ? <ToggleRight className="text-emerald-400 w-8 h-8" /> : <ToggleLeft className="text-slate-600 w-8 h-8" />}
                       </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                       <span className="text-xs font-bold">Снизить вес (-5кг)</span>
                       <button onClick={() => handleSimulate({ weight: whatIfChanges.weight ? undefined : twin.weight - 5 })}>
                          {whatIfChanges.weight ? <ToggleRight className="text-emerald-400 w-8 h-8" /> : <ToggleLeft className="text-slate-600 w-8 h-8" />}
                       </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                       <span className="text-xs font-bold">Сон 8+ часов</span>
                       <button onClick={() => handleSimulate({ sleepHours: whatIfChanges.sleepHours ? undefined : 8.5 })}>
                          {whatIfChanges.sleepHours ? <ToggleRight className="text-emerald-400 w-8 h-8" /> : <ToggleLeft className="text-slate-600 w-8 h-8" />}
                       </button>
                    </div>
                 </div>

                 {isSimulating && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300">
                       <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                       <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Прогноз пересчитан</span>
                    </div>
                 )}
              </div>
           </div>

           <div className="bg-primary p-10 rounded-[3.5rem] text-white flex flex-col justify-between h-[300px] shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                 <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6"><FileText className="w-7 h-7 text-white" /></div>
                 <h4 className="text-3xl font-black leading-[0.9] tracking-tighter uppercase">Паспорт <br/>здоровья</h4>
                 <p className="text-white/60 text-xs mt-4 font-semibold italic">Для передачи врачу вне системы.</p>
              </div>
              <button className="w-full py-5 bg-white text-primary rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-lg relative z-10 hover:bg-slate-50 transition-colors">Сформировать PDF</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinPage;
