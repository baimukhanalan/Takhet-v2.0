
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  PhoneOff, MessageSquare, FileText, 
  BrainCircuit, CheckCircle2, Stethoscope, 
  X, FilePlus, ClipboardList, Activity, Pill, Fingerprint, Download, Loader2, Key, AlertTriangle, ArrowRight, ShieldCheck, FileSearch, Info, ShieldAlert, ChevronDown
} from 'lucide-react';
import { analyzeHealthData } from '../services/gemini';
import { MockDB } from '../services/db';
import { roleApi } from '../services/roleApi';

const ConsultationRoom: React.FC<{ user: User }> = ({ user }) => {
  const { id = 'default' } = useParams();
  const navigate = useNavigate();
  const isDoctor = user.role === UserRole.DOCTOR;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [sessionFiles, setSessionFiles] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'diagnosis' | 'plan' | 'prescriptions'>('diagnosis');
  const [doctorNotes, setDoctorNotes] = useState({ complaints: '', anamnesis: '' });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [finalReport, setFinalReport] = useState<any>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [patientInput, setPatientInput] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (e) { console.error("Media error", e); }
    };
    setup();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          resolve(result.includes(',') ? result.split(',')[1] : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await roleApi.uploadMedicalFile({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64
      });

      MockDB.uploadFile(id, { name: file.name, type: file.type, synced: true });
      setSessionFiles(MockDB.getFiles(id));
    } catch {
      MockDB.uploadFile(id, { name: file.name, type: file.type, synced: false });
      setSessionFiles(MockDB.getFiles(id));
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleCreateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const result = await analyzeHealthData("Medical Report", `Complaints: ${doctorNotes.complaints}, Files: ${sessionFiles.length}`);
      setFinalReport(result);
    } catch (e) { console.error(e); } finally { setIsGeneratingReport(false); }
  };

  const handleSign = async () => {
    setIsSigned(true);
    try {
      if (isDoctor) {
        await roleApi.doctorUpdateCaseStatus(id, 'closed');
      }
    } catch {
      // keep local success state even if backend update fails
    }

    MockDB.addRecord({
      title: `Консультация: ${new Date().toLocaleDateString()}`,
      date: new Date().toLocaleDateString(),
      type: 'Visit',
      status: 'Analyzed',
      summary: finalReport?.summary || 'Осмотр завершен.',
      isSigned: true,
      signedBy: user.name
    });
  };

  const handleEndCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsCallEnded(true);
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col md:flex-row overflow-y-auto no-scrollbar md:overflow-hidden">
      {/* Video Context - Full screen height on mobile by default */}
      <div className="min-h-screen md:flex-1 relative flex flex-col shrink-0">
        {!isCallEnded ? (
          <div className="flex-1 relative">
             <div className="absolute inset-0 bg-slate-800">
               <img src={`https://picsum.photos/seed/doc-${id}/1200/800`} className="w-full h-full object-cover opacity-50" alt="Remote" />
             </div>
             
             {/* Small self-view */}
             <div className="absolute top-6 right-6 w-28 md:w-48 aspect-video bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20">
               <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover -scale-x-100 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} />
               {isVideoOff && <div className="absolute inset-0 flex items-center justify-center text-white/40"><VideoOff /></div>}
             </div>

             {/* Controls Overlay */}
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
                <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white backdrop-blur-md'}`}><MicOff className="w-6 h-6" /></button>
                <button onClick={handleEndCall} className="p-6 bg-red-600 text-white rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all"><PhoneOff className="w-8 h-8" /></button>
                <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white backdrop-blur-md'}`}><VideoOff className="w-6 h-6" /></button>
             </div>

             {/* Mobile Indicator to scroll down */}
             <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-white/50 animate-bounce md:hidden flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-widest mb-2">Детали и файлы</span>
                <ChevronDown className="w-5 h-5" />
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8 bg-slate-950">
             <ShieldCheck className="w-20 h-20 text-primary animate-pulse" />
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Звонок завершен</h2>
             {isDoctor && !isSigned && (
               <button onClick={handleSign} className="px-10 py-5 bg-primary text-white rounded-[2rem] font-black uppercase text-xs shadow-xl">Подписать отчет ЭЦП</button>
             )}
             <button onClick={() => navigate('/dashboard')} className="px-8 py-4 text-slate-500 hover:text-white font-black uppercase text-xs transition-colors">Выйти из комнаты</button>
          </div>
        )}
      </div>

      {/* Panels Side/Below Area */}
      <div className="w-full md:w-[500px] bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col shrink-0 min-h-screen md:min-h-0 overflow-hidden">
        {isDoctor ? (
          <div className="flex-1 flex flex-col">
            <div className="p-6 bg-slate-50 border-b flex gap-2 overflow-x-auto no-scrollbar">
              {['diagnosis', 'plan', 'prescriptions'].map(s => (
                <button key={s} onClick={() => setActiveSection(s as any)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap ${activeSection === s ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex-1 p-8 space-y-6">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Заметки врача</label>
               <textarea value={doctorNotes.complaints} onChange={e => setDoctorNotes({...doctorNotes, complaints: e.target.value})} className="w-full h-64 bg-slate-50 border-none rounded-3xl p-6 font-bold" placeholder="Жалобы, осмотр..." />
               
               {finalReport && (
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
                     <BrainCircuit className="w-6 h-6 text-emerald-600 shrink-0" />
                     <p className="text-xs font-bold text-emerald-800 leading-relaxed">{finalReport.summary}</p>
                  </div>
               )}
            </div>
            <div className="p-8 border-t bg-white">
               {!finalReport ? (
                  <button onClick={handleCreateReport} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase flex items-center justify-center gap-2">
                     {isGeneratingReport ? <Loader2 className="animate-spin" /> : <Fingerprint className="w-5 h-5" />} Сгенерировать отчет ИИ
                  </button>
               ) : (
                  <button onClick={handleSign} disabled={isSigned} className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-xs uppercase shadow-xl flex items-center justify-center gap-2">
                     {isSigned ? <><ShieldCheck className="w-5 h-5" /> Подписано ЭЦП</> : 'Подписать результат ЭЦП'}
                  </button>
               )}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8 space-y-10 overflow-y-auto no-scrollbar">
             <div className="space-y-4">
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Ваши жалобы</h3>
                <textarea value={patientInput} onChange={e => setPatientInput(e.target.value)} className="w-full h-40 bg-slate-50 border-none rounded-[2.5rem] p-6 font-bold shadow-inner" placeholder="Опишите ваши ощущения..." />
             </div>
             <div className="space-y-6">
                <h3 className="text-xl font-black">Прикрепить документы</h3>
                <label className="flex flex-col items-center justify-center p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] cursor-pointer hover:bg-slate-100 transition-all group">
                   <input type="file" className="hidden" onChange={handleFileUpload} />
                   <FilePlus className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-black text-slate-500 uppercase mt-4">{isUploadingFile ? 'Загрузка...' : 'Загрузить файл'}</span>
                </label>
                <div className="grid gap-3">
                   {sessionFiles.map((f, i) => (
                      <div key={i} className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                         <div className="flex flex-col"><span className="text-xs font-bold text-slate-700">{f.name}</span><span className="text-[9px] font-bold text-slate-400 uppercase">{f.synced ? 'Cloud synced' : 'Local only'}</span></div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationRoom;
