import React, { useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BrainCircuit,
  Camera,
  CheckCircle2,
  Eye,
  FileSearch,
  RefreshCw,
  Upload,
  Users,
  X,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { analyzeHealthData } from '../services/gemini';
import { roleApi } from '../../services/roleApi';

type AnalysisResult = {
  summary: string;
  recommendations: string[];
};

const AIAnalysisCenter: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'analysis' | 'symptoms'>('analysis');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setCapturedImage(null);
    setError(null);
    setIsCameraOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError('Доступ к камере отклонён.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvasRef.current.toDataURL('image/jpeg', 0.9));
    stopCamera();
  };

  const resetState = () => {
    setResult(null);
    setError(null);
    setSelectedFiles([]);
    setCapturedImage(null);
  };

  const archiveAnalysisResult = async (analysis: AnalysisResult) => {
    if (user.role !== UserRole.PATIENT) return;

    const created = await roleApi.patientCreateCase(
      mode === 'analysis' ? 'Медархив: анализ данных через Лабораторию ИИ' : 'Медархив: фото-скрининг через Лабораторию ИИ'
    );
    const uploadedDocs =
      mode === 'analysis'
        ? await Promise.all(
            selectedFiles.map(async (file) => {
              const uploaded = await roleApi.uploadMedicalFileSmart(file);
              return {
                name: file.name,
                analysis: [
                  analysis.summary,
                  ...(analysis.recommendations || []).map((item) => `- ${item}`),
                  `Файл: ${uploaded.bucket}/${uploaded.path}`
                ].join('\n')
              };
            })
          )
        : [
            {
              name: 'Фото симптома',
              analysis: [analysis.summary, ...(analysis.recommendations || []).map((item) => `- ${item}`)].join('\n')
            }
          ];

    await roleApi.patientSaveConsultationDraft(created.id, {
      transcript: [],
      uploadedDocs,
      aiSummary: analysis.summary
    });
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const payload =
        mode === 'analysis'
          ? selectedFiles.map((file) => `${file.name} (${Math.round(file.size / 1024)} KB)`).join(', ')
          : 'Загружено фото симптома для визуального анализа.';

      const analysis = await analyzeHealthData(
        mode === 'analysis' ? 'medical-data' : 'symptom-photo',
        payload || 'Данные не указаны'
      );

      const nextResult = {
        summary: analysis.summary,
        recommendations: analysis.recommendations || []
      };

      setResult(nextResult);
      void archiveAnalysisResult(nextResult).catch((archiveError) => {
        console.error('Archive analysis result failed:', archiveError);
      });
    } catch {
      setError('Ошибка сервиса ИИ.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canRun = mode === 'analysis' ? selectedFiles.length > 0 : Boolean(capturedImage);

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 px-3 sm:px-4 lg:px-0">
      {isCameraOpen && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <button
            onClick={stopCamera}
            className="absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-xl text-white rounded-2xl border border-white/20"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={capturePhoto}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full border-8 border-slate-200 active:scale-90 transition-transform"
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-3 text-center md:text-left">
          <div className="w-16 h-16 bg-primary text-white rounded-[1.6rem] flex items-center justify-center mx-auto md:mx-0 shadow-xl shadow-primary/20">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase">Лаборатория ИИ</h1>
        </div>

        <div className="bg-white p-1.5 rounded-[2rem] border border-slate-200 flex shadow-sm">
          <button
            onClick={() => {
              setMode('analysis');
              resetState();
            }}
            className={`px-6 md:px-8 py-3.5 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === 'analysis' ? 'bg-primary text-white shadow-lg' : 'text-slate-400'
            }`}
          >
            Данные
          </button>
          <button
            onClick={() => {
              setMode('symptoms');
              resetState();
            }}
            className={`px-6 md:px-8 py-3.5 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === 'symptoms' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400'
            }`}
          >
            Фото
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-6 md:p-10 lg:p-14 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl min-h-[560px]">
            {!result && !isAnalyzing ? (
              <div className="space-y-10">
                {mode === 'analysis' ? (
                  <div className="space-y-8">
                    <label className="border-4 border-dashed border-slate-100 rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-16 text-center group transition-all cursor-pointer bg-slate-50/50 hover:bg-white hover:border-primary/20 block">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) => event.target.files && setSelectedFiles(Array.from(event.target.files))}
                      />
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 md:mb-8 text-primary group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 md:w-10 md:h-10" />
                      </div>
                      <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">Загрузите анализы</p>
                      {selectedFiles.length > 0 && (
                        <p className="mt-4 text-primary font-black uppercase text-xs">Выбрано: {selectedFiles.length} файл(ов)</p>
                      )}
                    </label>

                    <div className="bg-blue-50/50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-blue-100 flex items-start gap-5">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 text-primary shadow-sm">
                        <FileSearch className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-2">Цели анализа данных</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          ИИ извлекает значения из документов, сверяет отклонения и помогает быстро подготовить кейс для врача.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button
                        onClick={startCamera}
                        className="border-4 border-dashed border-orange-100 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-12 text-center group bg-orange-50/20 hover:bg-white hover:border-orange-500 transition-all"
                      >
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 text-orange-500 group-hover:scale-110 transition-transform">
                          <Camera className="w-8 h-8" />
                        </div>
                        <p className="font-black text-slate-800 uppercase text-xs tracking-widest">Сделать фото симптома</p>
                      </button>

                      {!capturedImage ? (
                        <label className="border-4 border-dashed border-slate-100 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-12 text-center group bg-slate-50/20 hover:bg-white cursor-pointer transition-all">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onloadend = () => setCapturedImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }}
                          />
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Upload className="w-8 h-8" />
                          </div>
                          <p className="font-black text-slate-800 uppercase text-xs tracking-widest">Из галереи</p>
                        </label>
                      ) : (
                        <div className="relative rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl aspect-video bg-slate-50 border-4 border-white">
                          <img src={capturedImage} className="w-full h-full object-cover" />
                          <button
                            onClick={() => setCapturedImage(null)}
                            className="absolute top-4 right-4 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-orange-50/50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-orange-100 flex items-start gap-5">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 text-orange-500 shadow-sm">
                        <Eye className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-2">Цели фото-скрининга</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Нейросеть проводит визуальный анализ изображения и формирует быстрый предварительный разбор для врача и пациента.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm font-bold text-red-600 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <button
                  onClick={() => void handleAnalyze()}
                  disabled={!canRun}
                  className={`w-full py-6 rounded-[2rem] md:rounded-[2.5rem] font-black text-lg text-white shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50 ${
                    mode === 'symptoms' ? 'bg-orange-600' : 'bg-primary'
                  }`}
                >
                  <Zap className="w-6 h-6" /> Запустить
                </button>
              </div>
            ) : isAnalyzing ? (
              <div className="py-36 text-center space-y-10">
                <RefreshCw className="w-16 h-16 animate-spin text-primary mx-auto opacity-20" />
                <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase">Анализируем...</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-8 gap-5">
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-[1.6rem] flex items-center justify-center shadow-xl ${mode === 'symptoms' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-black text-3xl tracking-tighter uppercase">Готово</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decision Engine Audit Result</p>
                    </div>
                  </div>
                </div>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Заключение
                  </h4>
                  <div className="bg-slate-50/50 p-6 md:p-8 rounded-[2.5rem] text-slate-700 text-base md:text-lg font-medium leading-relaxed border border-slate-100 italic">
                    "{result?.summary}"
                  </div>
                </section>

                {result?.recommendations?.length ? (
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Следующие шаги</h4>
                    <div className="grid gap-3">
                      {result.recommendations.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  {user.role === UserRole.PATIENT ? (
                    <>
                      <button
                        onClick={() => navigate('/doctors-search')}
                        className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-primary transition-all"
                      >
                        Обсудить с врачом
                      </button>
                      <button
                        onClick={() => navigate('/ai-consultation')}
                        className="flex-1 py-5 bg-primary text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-600 transition-all"
                      >
                        ИИ консультация
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate('/swarm-medicine')}
                      className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-primary transition-all"
                    >
                      Перейти в Swarm Medicine
                    </button>
                  )}
                  <button
                    onClick={resetState}
                    className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                  >
                    Новый анализ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
              <Activity className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight">Техническая справка</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Результат анализа ИИ не является окончательным диагнозом и используется как вспомогательная информация для ускорения обработки данных.
            </p>
            <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Безопасность данных: AES-256</span>
            </div>
          </div>

          {user.role === UserRole.DOCTOR ? (
            <div className="bg-indigo-600 rounded-[2.5rem] md:rounded-[3rem] p-8 text-white space-y-5 shadow-2xl">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tight">Swarm Medicine</h4>
              <p className="text-indigo-100 text-sm font-medium">
                Разбор из лаборатории можно сразу перенести в консилиум и оформить как кейс для врача.
              </p>
              <button
                onClick={() => navigate('/swarm-medicine')}
                className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest"
              >
                Открыть Swarm Medicine
              </button>
            </div>
          ) : (
            <div className="bg-primary/5 rounded-[2.5rem] md:rounded-[3rem] p-8 border border-primary/10 space-y-5">
              <h4 className="text-2xl font-black uppercase tracking-tight text-slate-900">Следующий шаг</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                После анализа можно перейти в ИИ консультацию или сразу записаться к врачу с уже подготовленным контекстом.
              </p>
              <div className="grid gap-3">
                <button
                  onClick={() => navigate('/health-browser')}
                  className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest border border-slate-100"
                >
                  Открыть ИИ браузер
                </button>
                <button
                  onClick={() => navigate('/takhet-ai/patient')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
                >
                  Открыть Takhet AI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default AIAnalysisCenter;
