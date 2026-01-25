
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  PhoneOff, MessageSquare, FileText, 
  BrainCircuit, Shield, Plus, AlertCircle, RefreshCw, Camera,
  CheckCircle2, HardDrive, ChevronRight, Lock, Stethoscope, Settings2, Info,
  ArrowLeft
} from 'lucide-react';

const ConsultationRoom: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [complaints, setComplaints] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [deviceStatus, setDeviceStatus] = useState({ video: 'loading', audio: 'loading' });
  const [streamActive, setStreamActive] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTracks = () => {
    console.log("Stopping all tracks...");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const setupStream = async () => {
    // Если кнопка нажата, мы сбрасываем всё и пробуем заново
    setIsRetrying(true);
    setPermissionError(null);
    setShowInstructions(false);
    
    console.log("Attempting to access media devices...");

    // 1. Проверка Secure Context (HTTPS)
    if (!window.isSecureContext) {
      setPermissionError('Камера недоступна в небезопасном окружении. Требуется HTTPS.');
      setIsRetrying(false);
      return;
    }

    // 2. Проверка наличия API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError('Ваш браузер не поддерживает доступ к медиа-устройствам.');
      setIsRetrying(false);
      return;
    }

    stopTracks();

    try {
      // 3. Запрос медиа
      const constraints = { 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        } 
      };

      console.log("Requesting getUserMedia with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Successfully acquired media stream.");
      handleSuccess(stream);

    } catch (err: any) {
      console.error("Critical Media Access Error:", err.name, err.message);
      
      // Обработка конкретных ошибок браузера
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Браузер заблокировал доступ. Нажмите на значок замка в адресной строке и разрешите камеру/микрофон вручную.');
        setShowInstructions(true);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('Камера или микрофон не обнаружены. Проверьте физическое подключение устройств.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setPermissionError('Камера уже используется другим приложением (например, Zoom или Skype). Закройте их и повторите.');
      } else {
        setPermissionError(`Ошибка оборудования (${err.name}): ${err.message}`);
      }
      
      setDeviceStatus({ video: 'error', audio: 'error' });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSuccess = (stream: MediaStream) => {
    streamRef.current = stream;
    setDeviceStatus({
      video: stream.getVideoTracks().length > 0 ? 'ok' : 'missing',
      audio: stream.getAudioTracks().length > 0 ? 'ok' : 'missing'
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.onloadedmetadata = () => {
        localVideoRef.current?.play().catch(e => {
          console.warn("Autoplay failed, waiting for user click", e);
        });
      };
      setStreamActive(true);
      setPermissionError(null);
      setShowInstructions(false);
    }
  };

  useEffect(() => {
    // Попытка авто-запуска при монтировании
    setupStream();
    return () => stopTracks();
  }, []);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = !isMuted);
      streamRef.current.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
    }
  }, [isMuted, isVideoOff]);

  const handleEndCall = () => {
    stopTracks();
    navigate('/dashboard');
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-4 bg-background selection:bg-primary/10">
      <div className="flex-1 bg-slate-900 rounded-[3rem] overflow-hidden relative shadow-2xl min-h-[500px] border-4 border-white">
        
        {/* Экран блокировки/ошибки */}
        {(permissionError || isRetrying) && !streamActive && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
              
              <div className="relative mx-auto w-24 h-24">
                <div className={`absolute inset-0 bg-primary/20 rounded-[2.5rem] animate-ping ${isRetrying ? 'block' : 'hidden'}`}></div>
                <div className="relative w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center">
                  {isRetrying ? (
                    <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                  ) : (
                    <Lock className="w-10 h-10 text-red-500" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-3xl font-black text-white tracking-tighter">
                  {isRetrying ? 'Инициализация...' : 'Требуется доступ'}
                </h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">
                  {permissionError || 'Нажмите кнопку ниже, чтобы вызвать окно запроса разрешений браузера.'}
                </p>
              </div>

              {showInstructions && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left space-y-4">
                  <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" /> Инструкция по разблокировке:
                  </h4>
                  <ol className="text-xs text-slate-400 space-y-3 list-decimal pl-4 font-medium">
                    <li>Нажмите на иконку <span className="text-white font-bold inline-flex items-center gap-1"><Lock className="w-3 h-3"/> Замка</span> в левой части адресной строки.</li>
                    <li>Убедитесь, что <b>Камера</b> и <b>Микрофон</b> имеют статус "Разрешить".</li>
                    <li>Если всё разрешено, но не работает — сбросьте настройки сайта и обновите страницу.</li>
                  </ol>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={setupStream}
                  disabled={isRetrying}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-primary/20 disabled:opacity-50"
                >
                  {isRetrying ? 'ПОДОЖДИТЕ...' : 'ВКЛЮЧИТЬ КАМЕРУ'}
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-4 text-slate-500 font-bold hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Отменить прием
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remote Video Placeholder */}
        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
          <img 
            src={`https://picsum.photos/seed/${id}/1200/800`} 
            className="w-full h-full object-cover opacity-20 grayscale" 
            alt="Remote Party"
          />
          {streamActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10">
              <Stethoscope className="w-32 h-32 mb-6" />
              <p className="font-black uppercase tracking-[0.5em] text-sm">Связь установлена</p>
            </div>
          )}
        </div>

        {/* Local Video Preview */}
        <div className="absolute top-8 right-8 w-44 md:w-64 aspect-video bg-black rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-2xl z-30 group">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-700 ${isVideoOff || !streamActive ? 'opacity-0' : 'opacity-100'}`} 
          />
          {(isVideoOff || !streamActive) && (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <VideoOff className="w-6 h-6 text-white/20" />
              </div>
            </div>
          )}
          {/* Status Dots */}
          <div className="absolute bottom-4 left-4 flex gap-1.5">
            <div className={`w-2 h-2 rounded-full ${deviceStatus.video === 'ok' ? 'bg-success shadow-[0_0_8px_#00C853]' : 'bg-red-500'}`} />
            <div className={`w-2 h-2 rounded-full ${deviceStatus.audio === 'ok' ? 'bg-success shadow-[0_0_8px_#00C853]' : 'bg-red-500'}`} />
          </div>
        </div>

        {/* Call Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-40">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-6 rounded-[2rem] transition-all shadow-xl backdrop-blur-xl border ${isMuted ? 'bg-red-500 border-red-400 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
          >
            {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          
          <button 
            onClick={handleEndCall}
            className="p-8 bg-red-600 text-white rounded-[2.5rem] hover:bg-red-700 transition-all shadow-2xl shadow-red-900/40 hover:scale-110 active:scale-95 border-4 border-white/20"
          >
            <PhoneOff className="w-10 h-10" />
          </button>

          <button 
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-6 rounded-[2rem] transition-all shadow-xl backdrop-blur-xl border ${isVideoOff ? 'bg-red-500 border-red-400 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
          >
            {isVideoOff ? <VideoOff className="w-8 h-8" /> : <VideoIcon className="w-8 h-8" />}
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-8 left-8 flex flex-col gap-3 z-20">
          <div className="px-5 py-2.5 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 text-white flex items-center gap-3">
             <Shield className="w-4 h-4 text-accent" />
             <span className="text-[10px] font-black uppercase tracking-widest">Безопасное соединение</span>
          </div>
        </div>
      </div>

      {/* Control Panel (Side) */}
      <div className={`w-full md:w-[420px] flex flex-col gap-6 ${isChatOpen ? 'flex' : 'hidden md:flex'}`}>
        <div className="flex-1 bg-white rounded-[3.5rem] border border-border p-8 flex flex-col shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black flex items-center gap-3 text-primary uppercase tracking-tighter">
              <FileText className="w-6 h-6" /> Медкарта
            </h3>
            <span className="flex items-center gap-2 text-[10px] font-black text-red-600 bg-red-50 px-4 py-2 rounded-full uppercase tracking-widest border border-red-100">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> REC
            </span>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-hide">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Жалобы</label>
              <textarea 
                value={complaints}
                onChange={(e) => setComplaints(e.target.value)}
                placeholder="Заметки врача в реальном времени..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-sm resize-none h-48 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
              />
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-[2.5rem] p-8 border border-blue-100/50">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> Takhet AI Analysis
              </h4>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">Система готова. Начните диалог для автоматического анализа.</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleEndCall}
            className="w-full py-5 bg-foreground text-white rounded-[2.2rem] font-black text-lg mt-8 hover:bg-black transition-all shadow-2xl shadow-foreground/20 flex items-center justify-center gap-3"
          >
            Завершить и сохранить <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex items-center gap-6 shadow-2xl relative overflow-hidden group border border-white/5">
          <div className="p-5 bg-primary/20 rounded-2xl shadow-inner relative z-10 group-hover:scale-110 transition-transform">
            <Settings2 className="w-8 h-8 text-primary" />
          </div>
          <div className="relative z-10">
             <h4 className="font-black text-lg tracking-tight">Hardware</h4>
             <p className="text-xs text-slate-400 font-medium">{streamActive ? 'Активно' : 'Ожидание'}</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all"></div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationRoom;
