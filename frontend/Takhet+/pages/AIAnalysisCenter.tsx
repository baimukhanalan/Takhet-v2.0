
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, BrainCircuit, ShieldCheck, FileSearch, Loader2, 
  CheckCircle2, AlertCircle, Camera, Eye, X, 
  ChevronRight, Info, Zap, Thermometer, FlaskConical,
  Smartphone, RefreshCw, FileText, ArrowRight, ShieldAlert,
  Dna, Database, Beaker, TrendingUp, SearchCode, Binary, MapPin, Clock,
  UserCheck, ShieldEllipsis, Users, Activity, Radar, HelpCircle, Layers, Fingerprint, EyeOff,
  Microscope, ScanSearch, DatabaseZap, Search
} from 'lucide-react';
import { analyzeHealthData } from '../services/gemini';
import { translations, Language } from '../services/i18n';
import { MockDB } from '../services/db';
import { calculateDecisionRoute, checkSwarmEligibility, generateMockSwarmConsensus } from '../services/medicalEngine';
import { DecisionRoute, SwarmCase } from '../types';

const AIAnalysisCenter: React.FC = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [route, setRoute] = useState<DecisionRoute | null>(null);
  const [swarm, setSwarm] = useState<SwarmCase | null>(null);
  const [isSwarmLoading, setIsSwarmLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'analysis' | 'symptoms'>('analysis');
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    const handleUpdate = () => setLang(MockDB.getLang());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const t = translations[lang];

  const startCamera = async () => {
    setIsCameraOpen(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError("Доступ к камере отклонен.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setRoute(null);
    setSwarm(null);

    let contentStr = mode === 'analysis' 
      ? `User uploaded files: ${selectedFiles.map(f => f.name).join(", ")}`
      : "Visual symptom photo provided. Clinical task: Extract diagnostic markers, cross-reference datasets.";
    
    try {
      const data = await analyzeHealthData(
        mode === 'analysis' ? "Laboratory Test Report" : "Dermatological Photo Diagnostic", 
        contentStr,
        capturedImage || undefined,
        lang
      );
      
      if (data) {
        setResult(data);
        const engineRoute = calculateDecisionRoute(mode === 'analysis' ? 'Analysis' : 'Photo', data);
        setRoute(engineRoute);
        
        MockDB.addRecord({
          title: `ИИ: ${mode === 'analysis' ? 'Анализ данных' : 'Фото-диагностика'}`,
          type: mode === 'analysis' ? 'Analysis' : 'Photo',
          summary: data.summary,
          status: 'Analyzed',
          date: new Date().toLocaleDateString(),
          fullData: { ...data, decisionRoute: engineRoute }
        });
      } else throw new Error();
    } catch (err) {
      setError("Ошибка сервиса ИИ.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTriggerSwarm = () => {
    setIsSwarmLoading(true);
    setTimeout(() => {
      const consensus = generateMockSwarmConsensus(route?.specialist || 'Общая практика');
      setSwarm(consensus);
      setIsSwarmLoading(false);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700 px-4">
      {isCameraOpen && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
           <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
           <div className="absolute top-10 right-10">
              <button onClick={stopCamera} className="p-4 bg-white/10 backdrop-blur-xl text-white rounded-2xl border border-white/20"><X className="w-6 h-6" /></button>
           </div>
           <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
              <button onClick={capturePhoto} className="w-24 h-24 bg-white rounded-full border-8 border-slate-200 active:scale-90 transition-transform" />
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-4 text-center md:text-left">
          <div className="w-16 h-16 bg-primary text-white rounded-[1.8rem] flex items-center justify-center mx-auto md:mx-0 shadow-xl shadow-primary/20">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase">{t.ai.lab}</h1>
        </div>
        
        <div className="bg-white p-1.5 rounded-[2rem] border border-slate-200 flex shadow-sm">
          <button onClick={() => { setMode('analysis'); setResult(null); setRoute(null); setSwarm(null); }} className={`px-8 py-3.5 rounded-[1.7rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'analysis' ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}>
            <FlaskConical className="w-4 h-4 mr-2 inline" /> {t.ai.tabData}
          </button>
          <button onClick={() => { setMode('symptoms'); setResult(null); setRoute(null); setSwarm(null); }} className={`px-8 py-3.5 rounded-[1.7rem] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'symptoms' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400'}`}>
            <Camera className="w-4 h-4 mr-2 inline" /> {t.ai.tabPhoto}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 lg:p-14 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden min-h-[550px]">
            {!result && !isAnalyzing ? (
              <div className="space-y-12">
                {mode === 'analysis' ? (
                  <div className="space-y-10">
                    <label className="border-4 border-dashed border-slate-100 rounded-[3.5rem] p-12 lg:p-20 text-center group transition-all cursor-pointer bg-slate-50/50 hover:bg-white hover:border-primary/20 block">
                      <input type="file" multiple className="hidden" onChange={(e) => e.target.files && setSelectedFiles(Array.from(e.target.files))} />
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-8 text-primary group-hover:scale-110 transition-transform">
                        <Upload className="w-10 h-10" />
                      </div>
                      <p className="text-2xl font-black text-slate-800 tracking-tight uppercase">Загрузите анализы</p>
                      {selectedFiles.length > 0 && <p className="mt-4 text-primary font-black uppercase text-xs">Выбрано: {selectedFiles.length} файл(ов)</p>}
                    </label>
                    <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex items-start gap-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 text-primary shadow-sm"><FileSearch className="w-6 h-6" /></div>
                      <div>
                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-2">Цели анализа данных</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">ИИ извлекает числовые значения из документов, сопоставляет их с референсными интервалами и находит скрытые зависимости между показателями.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button onClick={startCamera} className="border-4 border-dashed border-orange-100 rounded-[3rem] p-12 text-center group bg-orange-50/20 hover:bg-white hover:border-orange-500 transition-all">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 text-orange-500 group-hover:scale-110 transition-transform">
                          <Camera className="w-8 h-8" />
                        </div>
                        <p className="font-black text-slate-800 uppercase text-xs tracking-widest">Сделать фото симптома</p>
                      </button>
                      {!capturedImage ? (
                        <label className="border-4 border-dashed border-slate-100 rounded-[3rem] p-12 text-center group bg-slate-50/20 hover:bg-white cursor-pointer transition-all">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onloadend = () => setCapturedImage(reader.result as string);
                               reader.readAsDataURL(file);
                             }
                          }} />
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Upload className="w-8 h-8" />
                          </div>
                          <p className="font-black text-slate-800 uppercase text-xs tracking-widest">Из галереи</p>
                        </label>
                      ) : (
                        <div className="relative rounded-[3rem] overflow-hidden group shadow-2xl aspect-video bg-slate-50 border-4 border-white">
                          <img src={capturedImage} className="w-full h-full object-cover" />
                          <button onClick={() => setCapturedImage(null)} className="absolute top-4 right-4 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                        </div>
                      )}
                    </div>
                    <div className="bg-orange-50/50 p-8 rounded-[2.5rem] border border-orange-100 flex items-start gap-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 text-orange-500 shadow-sm"><Eye className="w-6 h-6" /></div>
                      <div>
                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-2">Цели фото-скрининга</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Нейросеть проводит визуальный анализ текстуры, цвета и контуров поражения, сравнивая их с базой патологических маркеров для оценки риска.</p>
                      </div>
                    </div>
                  </div>
                )}
                <button 
                  onClick={handleAnalysis} 
                  disabled={mode === 'analysis' ? selectedFiles.length === 0 : !capturedImage} 
                  className={`w-full py-7 rounded-[2.5rem] font-black text-xl text-white shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-4 ${mode === 'symptoms' ? 'bg-orange-600' : 'bg-primary'}`}
                >
                  <Zap className="w-6 h-6" /> {t.ai.run}
                </button>
              </div>
            ) : isAnalyzing ? (
              <div className="py-40 text-center space-y-12">
                <RefreshCw className="w-20 h-20 animate-spin text-primary mx-auto opacity-20" />
                <p className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{t.ai.analyzing}</p>
              </div>
            ) : (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-10 gap-6">
                   <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-xl ${mode === 'symptoms' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-black text-3xl tracking-tighter uppercase">{t.ai.ready}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decision Engine Audit Result</p>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                      <div className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 ${result.riskLevel === 'High' ? 'bg-red-50 border-red-200 text-red-500' : result.riskLevel === 'Medium' ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                        Clinical Score: {route ? (route.riskScore * 100).toFixed(0) : 0}%
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2"><Info className="w-4 h-4" /> Заключение</h4>
                      <div className="bg-slate-50/50 p-8 rounded-[3rem] text-slate-700 text-lg font-medium leading-relaxed border border-slate-100 italic">
                        "{result.summary}"
                      </div>
                   </section>

                   <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Вероятностные паттерны</h4>
                      <div className="space-y-5">
                        {result.probabilities?.map((p: any, i: number) => (
                          <div key={i} className="space-y-2">
                             <div className="flex justify-between text-[11px] font-black uppercase text-slate-600 px-2">
                                <span>{p.label}</span>
                                <span className="text-primary">{p.value}%</span>
                             </div>
                             <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${p.value > 70 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${p.value}%` }} />
                             </div>
                          </div>
                        ))}
                      </div>
                   </section>
                </div>

                {/* DYNAMIC WHAT AND WHY BLOCK */}
                <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white space-y-10 relative overflow-hidden shadow-2xl border border-white/5">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20" />
                   <div className="relative z-10 flex items-center gap-6">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary backdrop-blur-md">
                         <HelpCircle className="w-7 h-7" />
                      </div>
                      <div>
                         <h4 className="text-2xl font-black uppercase tracking-tighter">Что это и для чего?</h4>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           {mode === 'analysis' ? 'Механика цифрового аудита данных' : 'Механика визуального анализа'}
                         </p>
                      </div>
                   </div>

                   <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {mode === 'analysis' ? (
                        <>
                          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                             <div className="flex items-center gap-2 text-primary">
                                <Microscope className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Парсинг данных</span>
                             </div>
                             <p className="text-xs text-slate-300 font-medium leading-relaxed">Система извлекает сырые значения из бланков, игнорируя шумы печати и рукописные пометки.</p>
                          </div>
                          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                             <div className="flex items-center gap-2 text-indigo-400">
                                <Layers className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Нормализация</span>
                             </div>
                             <p className="text-xs text-slate-300 font-medium leading-relaxed">Показатели приводятся к единой системе единиц (СИ) и сопоставляются с вашим профилем здоровья.</p>
                          </div>
                          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                             <div className="flex items-center gap-2 text-emerald-400">
                                <DatabaseZap className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Поиск корреляций</span>
                             </div>
                             <p className="text-xs text-slate-300 font-medium leading-relaxed">ИИ ищет косвенные связи между разными анализами, которые могут указывать на системные дефициты.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                             <div className="flex items-center gap-2 text-orange-400">
                                <ScanSearch className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Сегментация</span>
                             </div>
                             <p className="text-xs text-slate-300 font-medium leading-relaxed">ИИ выделяет границы поражения и отделяет его от здоровых тканей для точного замера параметров.</p>
                          </div>
                          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                             <div className="flex items-center gap-2 text-indigo-400">
                                <Fingerprint className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Маркерный поиск</span>
                             </div>
                             <p className="text-xs text-slate-300 font-medium leading-relaxed">Анализируются цвет, симметричность, текстура краев и наличие сосудистых паттернов.</p>
                          </div>
                          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                             <div className="flex items-center gap-2 text-emerald-400">
                                <Search className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Библиотечное сравнение</span>
                             </div>
                             <p className="text-xs text-slate-300 font-medium leading-relaxed">Снимок сравнивается с десятками тысяч подтвержденных клинических случаев из атласа патологий.</p>
                          </div>
                        </>
                      )}
                   </div>

                   <div className="relative z-10 p-6 bg-primary/20 rounded-[2rem] border border-primary/20 flex items-start gap-4">
                      <ShieldAlert className="w-6 h-6 text-primary shrink-0 mt-1" />
                      <p className="text-sm font-bold text-slate-300 leading-relaxed italic">
                        Данный отчет формируется для вашего врача. Он сокращает время на интерпретацию и помогает сфокусироваться на критических отклонениях.
                      </p>
                   </div>
                </div>

                {/* SWARM MEDICINE INTERACTIVE BLOCK */}
                {route && checkSwarmEligibility(route) && (
                   <div className="bg-indigo-600 rounded-[3.5rem] p-10 text-white space-y-10 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20" />
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                         <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                               <ShieldEllipsis className="w-8 h-8 text-white" />
                            </div>
                            <div>
                               <h4 className="text-2xl font-black uppercase tracking-tighter leading-tight">Swarm Medicine</h4>
                               <p className="text-indigo-100 text-xs font-bold opacity-70">Сложный случай: требуется консенсус экспертов</p>
                            </div>
                         </div>
                         {!swarm ? (
                           <button 
                             onClick={handleTriggerSwarm}
                             disabled={isSwarmLoading}
                             className="px-10 py-5 bg-white text-indigo-600 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50"
                           >
                             {isSwarmLoading ? <Loader2 className="animate-spin" /> : <Radar className="w-5 h-5" />} Запросить консенсус
                           </button>
                         ) : (
                           <div className="flex items-center gap-4 bg-emerald-500 px-8 py-4 rounded-full border border-emerald-400 shadow-xl animate-in zoom-in">
                              <CheckCircle2 className="w-6 h-6" />
                              <span className="font-black uppercase tracking-widest text-[10px]">Консенсус получен</span>
                           </div>
                         )}
                      </div>

                      {swarm && (
                         <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 p-10 space-y-8 animate-in slide-in-from-top-4 duration-700">
                            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                               <div className="flex items-center gap-4">
                                  <Users className="w-8 h-8 text-indigo-200" />
                                  <span className="text-xl font-black">Мнение сообщества: {swarm.consensusScore}%</span>
                               </div>
                            </div>
                            <div className="grid gap-6">
                               {swarm.opinions.map((op, i) => (
                                 <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                                    <div className="flex justify-between items-center">
                                       <span className="text-[8px] font-black uppercase tracking-[0.3em] text-indigo-200">Экспертная гипотеза #{i+1}</span>
                                       <span className="text-[10px] font-bold text-emerald-400">Достоверность: {Math.round(op.confidence*100)}%</span>
                                    </div>
                                    <p className="font-black text-lg text-white">«{op.hypothesis}»</p>
                                    <p className="text-sm text-indigo-100/60 font-medium">{op.argument}</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                      )}
                   </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button onClick={() => navigate('/doctors-search')} className="flex-1 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-primary transition-all">Обсудить результат с врачом</button>
                  <button onClick={() => { setResult(null); setRoute(null); setSwarm(null); setCapturedImage(null); setSelectedFiles([]); }} className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-[2.5rem] font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all border border-slate-100">Новый анализ</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className={`bg-slate-950 p-10 rounded-[4rem] text-white relative overflow-hidden group shadow-2xl border border-white/5 transition-all ${route?.urgency === 'High' ? 'ring-4 ring-red-500/20' : ''}`}>
              <ShieldAlert className={`w-14 h-14 mb-8 ${route?.urgency === 'High' ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} />
              <h4 className="text-2xl font-black tracking-tight leading-tight uppercase mb-6">Decision Engine Log</h4>
              <div className="space-y-4 font-mono text-[10px] text-slate-400 bg-black/40 p-5 rounded-2xl border border-white/5">
                 <p className="flex justify-between"><span>Audit:</span> <span className="text-white">Active</span></p>
                 <p className="flex justify-between"><span>Red Flags:</span> <span className={route?.redFlags?.length ? 'text-red-500' : 'text-emerald-500'}>{route?.redFlags?.length || 0}</span></p>
                 <p className="flex justify-between"><span>Swarm Priority:</span> <span className="text-indigo-400">{route ? (checkSwarmEligibility(route) ? 'HIGH' : 'NORMAL') : 'NONE'}</span></p>
                 <p className="flex justify-between"><span>Data_Health:</span> <span className="text-white">Verified</span></p>
              </div>
              {route?.redFlags?.map((flag, i) => (
                <div key={i} className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black text-red-500 uppercase flex items-center gap-2">
                   <AlertCircle className="w-3 h-3" /> {flag}
                </div>
              ))}
           </div>
           
           <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
              <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
                 <Activity className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight">Техническая справка</h4>
              <div className="space-y-4">
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">Результат анализа ИИ не является окончательным диагнозом и используется врачом как вспомогательная информация для ускорения обработки данных.</p>
                 <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Безопасность данных: AES-256</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default AIAnalysisCenter;
