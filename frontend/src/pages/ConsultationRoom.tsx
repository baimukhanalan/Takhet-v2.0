import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  PhoneOff, MessageSquare, FileText, 
  BrainCircuit, CheckCircle2, Stethoscope, 
  X, FilePlus, ClipboardList, Activity, Pill, Fingerprint, Download, Loader2, Key, AlertTriangle, ArrowRight, FileSearch, Info, ShieldAlert, ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { analyzeHealthData } from '../services/gemini';
import { MockDB } from '../services/db';

const ConsultationRoom: React.FC<{ user: User }> = ({ user }) => {
  const { id = 'default' } = useParams();
  const navigate = useNavigate();
  const isDoctor = user.role === UserRole.DOCTOR;
  const [appointment, setAppointment] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [sessionFiles, setSessionFiles] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'diagnosis' | 'plan' | 'prescriptions' | 'history'>('diagnosis');
  const [doctorNotes, setDoctorNotes] = useState({ complaints: '', anamnesis: '', diagnosis: '', recommendations: '' });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [finalReport, setFinalReport] = useState<any>(null);
  const [isShared, setIsShared] = useState(false);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [showAIArchive, setShowAIArchive] = useState(false);

  useEffect(() => {
    const loadApp = () => {
      const app = MockDB.getAppointments().find(a => a.id === id);
      if (app) {
        setAppointment(app);
        setDoctorNotes({
          complaints: app.notes || '',
          anamnesis: '',
          diagnosis: app.diagnosis || '',
          recommendations: app.recommendations || ''
        });
        setIsShared(!!app.isShared);
        if (app.status === 'completed') setIsCallEnded(true);
        
        // Load patient records
        setPatientRecords(MockDB.getRecords().filter(r => r.patientId === app.patientId));
      }
    };
    loadApp();
    
    // Mark as in-progress if it was upcoming
    MockDB.startAppointment(id);

    window.addEventListener('storage_update', loadApp);
    
    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (e) { console.error("Media error", e); }
    };
    setup();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      window.removeEventListener('storage_update', loadApp);
    };
  }, [id, isDoctor]);

  const syncNotes = (updates: Partial<typeof doctorNotes>) => {
    const newNotes = { ...doctorNotes, ...updates };
    setDoctorNotes(newNotes);
    MockDB.updateAppointment(id, { 
      notes: newNotes.complaints,
      diagnosis: newNotes.diagnosis,
      recommendations: newNotes.recommendations
    });
  };

  const handleShare = () => {
    setIsShared(true);
    MockDB.updateAppointment(id, { isShared: true });
  };

  const handlePatientConfirm = () => {
    if (!appointment) return;
    MockDB.updateAppointment(id, { patientConfirmed: true });
    setAppointment({ ...appointment, patientConfirmed: true });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      MockDB.uploadFile(id, { name: file.name, type: file.type });
      setSessionFiles(MockDB.getFiles(id));
    }
  };

  const handleCreateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const result = await analyzeHealthData("Medical Report", `Complaints: ${doctorNotes.complaints}, Diagnosis: ${doctorNotes.diagnosis}`);
      setFinalReport(result);
      syncNotes({ recommendations: result.summary });
    } catch (e) { console.error(e); } finally { setIsGeneratingReport(false); }
  };

  const handleFinish = () => {
    if (!appointment) return;
    MockDB.finishAppointment(id);
    MockDB.addRecord({
      patientId: appointment.patientId,
      title: `Консультация: ${new Date().toLocaleDateString()}`,
      date: new Date().toLocaleDateString(),
      type: 'Visit',
      status: 'Analyzed',
      summary: doctorNotes.diagnosis || finalReport?.summary || 'Осмотр завершен.',
      fullData: {
        diagnosis: doctorNotes.diagnosis,
        recommendations: doctorNotes.recommendations,
        notes: doctorNotes.complaints
      }
    });
    setIsCallEnded(true);
  };

  const handleEndCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsCallEnded(true);
    MockDB.finishAppointment(id);
  };

  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');

  return (
    <div className="h-screen bg-[#0A0A0A] text-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 md:h-20 border-b border-white/5 px-4 md:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <VideoIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-black uppercase tracking-widest break-words">Консультация</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-tighter break-words">ID: {id?.slice(0, 8)} • {isDoctor ? 'Режим врача' : 'Режим пациента'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">В сети</span>
          </div>
          <button onClick={() => navigate(-1)} className="p-2 md:p-3 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Main Video Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col gap-4 md:gap-6 overflow-hidden">
          {!isCallEnded ? (
            <>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 overflow-hidden">
                {/* Remote Video (Doctor/Patient) */}
                <div className="relative bg-white/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/10 group shadow-2xl">
                  <img 
                    src={`https://picsum.photos/seed/doc-${id}/1200/800`} 
                    className="w-full h-full object-cover opacity-80"
                    alt="Remote"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                      <UserIcon className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest mb-0.5">Собеседник</p>
                      <h3 className="text-sm md:text-xl font-black">{isDoctor ? (appointment?.patientName || 'Пациент') : (appointment?.doctorName || 'Врач')}</h3>
                    </div>
                  </div>
                  <div className="absolute top-4 md:top-8 right-4 md:right-8 flex gap-2">
                    <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-success rounded-full" />
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">HD 1080p</span>
                    </div>
                  </div>
                </div>

                {/* Local Video */}
                <div className="relative bg-white/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/10 group shadow-2xl">
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover -scale-x-100 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
                    {isVideoOff && <VideoOff className="w-12 h-12 md:w-16 md:h-16 text-white/10 absolute" />}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                      <UserIcon className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest mb-0.5">Вы</p>
                      <h3 className="text-sm md:text-xl font-black">{user.name}</h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="h-20 md:h-24 bg-white/5 backdrop-blur-xl rounded-2xl md:rounded-[2rem] border border-white/10 flex items-center justify-center gap-3 md:gap-6 px-4 md:px-8 shrink-0">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 md:p-5 rounded-xl md:rounded-2xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
                </button>
                <button 
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-3 md:p-5 rounded-xl md:rounded-2xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5 md:w-6 md:h-6" /> : <VideoIcon className="w-5 h-5 md:w-6 md:h-6" />}
                </button>
                <div className="w-px h-8 md:h-10 bg-white/10 mx-1 md:mx-2" />
                <button className="hidden sm:block p-3 md:p-5 bg-white/10 text-white rounded-xl md:rounded-2xl hover:bg-white/20 transition-all">
                  <Download className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button className="p-3 md:p-5 bg-white/10 text-white rounded-xl md:rounded-2xl hover:bg-white/20 transition-all">
                  <Activity className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <div className="w-px h-8 md:h-10 bg-white/10 mx-1 md:mx-2" />
                <button 
                  onClick={handleEndCall}
                  className="px-6 md:px-10 py-3 md:py-5 bg-red-500 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 flex items-center gap-2 md:gap-3"
                >
                  <PhoneOff className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Завершить</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8 bg-slate-950 rounded-3xl">
               <CheckCircle2 className="w-20 h-20 text-primary animate-pulse" />
               <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Прием завершен</h2>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Все данные сохранены в медицинском архиве</p>
               </div>
               <button onClick={() => navigate('/dashboard')} className="px-12 py-5 bg-white/5 text-white rounded-[2rem] border border-white/10 font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">Вернуться в дашборд</button>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-[400px] xl:w-[450px] border-l border-white/5 bg-white/[0.02] flex flex-col shrink-0 overflow-hidden lg:h-full">
          <div className="flex border-b border-white/5 p-2 gap-2">
            <button 
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
            >
              Информация
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
            >
              Чат
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 no-scrollbar">
            {activeTab === 'info' ? (
              <div className="space-y-8 md:space-y-10">
                {isDoctor ? (
                  <>
                    <section className="space-y-4 md:space-y-6">
                      <h4 className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em]">Данные пациента</h4>
                      <div className="bg-white/5 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                            <UserIcon className="w-6 h-6 md:w-7 md:h-7" />
                          </div>
                          <div>
                            <p className="text-base md:text-lg font-black">{appointment?.patientName || 'Пациент'}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase">32 года • Мужчина</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4 border-t border-white/5">
                          <div>
                            <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Группа крови</p>
                            <p className="text-sm md:text-base font-bold">A (II) Rh+</p>
                          </div>
                          <div>
                            <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Вес / Рост</p>
                            <p className="text-sm md:text-base font-bold">78 кг / 182 см</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4 md:space-y-6">
                      <h4 className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em]">Жалобы</h4>
                      <div className="bg-white/5 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/10">
                        <textarea 
                          value={doctorNotes.complaints} 
                          onChange={e => syncNotes({ complaints: e.target.value })}
                          className="w-full bg-transparent border-none focus:ring-0 text-sm md:text-base text-slate-300 leading-relaxed font-medium italic resize-none h-24"
                          placeholder="Опишите жалобы пациента..."
                        />
                      </div>
                    </section>

                    <section className="space-y-4 md:space-y-6">
                      <h4 className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em]">Инструменты врача</h4>
                      <div className="grid grid-cols-1 gap-3 md:gap-4">
                        <button onClick={handleCreateReport} className="w-full p-4 md:p-5 bg-primary text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
                          {isGeneratingReport ? <Loader2 className="animate-spin w-4 h-4" /> : <FileText className="w-4 h-4 md:w-5 md:h-5" />} Выписать рецепт
                        </button>
                        <button onClick={handleFinish} className="w-full p-4 md:p-5 bg-white/5 text-white border border-white/10 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                          <Activity className="w-4 h-4 md:w-5 md:h-5" /> Завершить прием
                        </button>
                      </div>
                    </section>
                  </>
                ) : (
                  <>
                    <section className="space-y-4 md:space-y-6">
                      <h4 className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em]">Ваш врач</h4>
                      <div className="bg-white/5 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex items-center gap-4">
                        <img src={`https://picsum.photos/seed/doc-${id}/200/200`} className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl object-cover" alt="Doctor" referrerPolicy="no-referrer" />
                        <div>
                          <p className="text-base md:text-lg font-black">{appointment?.doctorName || 'Врач'}</p>
                          <p className="text-[10px] md:text-xs text-primary font-black uppercase tracking-widest">Терапевт • Высшая категория</p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4 md:space-y-6">
                      <h4 className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.3em]">Памятка</h4>
                      <div className="bg-white/5 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 space-y-4">
                        <div className="flex gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Info className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                          </div>
                          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                            Подготовьте результаты последних анализов, если они есть у вас на руках.
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-success" />
                          </div>
                          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                            Ваше соединение защищено сквозным шифрованием.
                          </p>
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 space-y-4 md:space-y-6 mb-6">
                  <div className="flex flex-col items-start gap-2">
                    <div className="bg-white/10 p-3 md:p-4 rounded-2xl rounded-tl-none max-w-[85%]">
                      <p className="text-sm md:text-base font-medium">Здравствуйте! Как вы себя чувствуете сегодня?</p>
                    </div>
                    <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase ml-2">Врач • 14:02</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-primary p-3 md:p-4 rounded-2xl rounded-tr-none max-w-[85%]">
                      <p className="text-sm md:text-base font-medium">Добрый день. Немного болит спина.</p>
                    </div>
                    <span className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase mr-2">Вы • 14:03</span>
                  </div>
                </div>
                <div className="relative mt-auto">
                  <input 
                    type="text" 
                    placeholder="Напишите сообщение..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-sm md:text-base focus:outline-none focus:border-primary transition-all pr-12 md:pr-16"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 md:p-3 text-primary hover:scale-110 transition-all">
                    <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ConsultationRoom;
