import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Download,
  FileText,
  Fingerprint,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  PhoneOff,
  Send,
  Video,
  VideoOff
} from 'lucide-react';
import { User, UserRole } from '../types';
import { advancedChatStream, analyzeHealthData } from '../services/gemini';
import { WebRTCService } from '../services/webrtc';
import { roleApi } from '../../services/roleApi';

type CaseItem = {
  id: string;
  patientId: string;
  doctorId: string | null;
  status: 'open' | 'active' | 'in_review' | 'closed';
  summary: string | null;
  createdAt: string;
};

type TranscriptEntry = {
  speaker: 'patient' | 'doctor' | 'ai' | 'system';
  text: string;
  createdAt: string;
};

type UploadedDoc = {
  name: string;
  analysis: string;
};

type ConsultationReport = {
  status: 'draft' | 'awaiting_doctor' | 'confirmed';
  aiSummary: string;
  doctorRecommendations: string;
  finalReport: string;
  pdfBase64: string | null;
  uploadedDocs: UploadedDoc[];
  transcript: TranscriptEntry[];
};

const speakerLabel: Record<TranscriptEntry['speaker'], string> = {
  patient: 'Пациент',
  doctor: 'Врач',
  ai: 'ИИ',
  system: 'Система'
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const downloadBase64Pdf = (base64: string, fileName: string) => {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const readFileAsText = (file: File) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });

const ConsultationRoom: React.FC<{ user: User }> = ({ user }) => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const isDoctor = user.role === UserRole.DOCTOR;
  const primaryVideoRef = useRef<HTMLVideoElement>(null);
  const tileVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rtcRef = useRef<WebRTCService | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [caseItem, setCaseItem] = useState<CaseItem | null>(null);
  const [reportItem, setReportItem] = useState<ConsultationReport | null>(null);
  const [messages, setMessages] = useState<TranscriptEntry[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [messageText, setMessageText] = useState('');
  const [doctorNotes, setDoctorNotes] = useState({ complaints: '', recommendations: '' });
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);
  const [aiAssistantBusy, setAiAssistantBusy] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [doctorTab, setDoctorTab] = useState<'scribe' | 'analytics'>('scribe');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [relayWarning, setRelayWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isLocalPrimary, setIsLocalPrimary] = useState(!isDoctor);
  const signalingPollRef = useRef<number | null>(null);
  const processedSignalsRef = useRef(new Set<number>());
  const lastSignalIdRef = useRef(0);
  const localSignalSessionRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const remoteSignalSessionRef = useRef<string | null>(null);
  const offerSentRef = useRef(false);
  const answerSentForSessionRef = useRef<string | null>(null);
  const remoteDescriptionReadyRef = useRef(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const aiAssistantSignatureRef = useRef('');
  const doctorRecommendationsEditedRef = useRef(false);
  const sharedContextCaseRef = useRef<string | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const isRecoveringConnectionRef = useRef(false);

  const attachVideoStream = (video: HTMLVideoElement | null, stream: MediaStream | null, muted: boolean) => {
    if (!video) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.muted = muted;
    if (stream) {
      video.playsInline = true;
      void video.play().catch(() => undefined);
    }
  };

  const stopLocalMedia = () => {
    if (signalingPollRef.current) {
      window.clearInterval(signalingPollRef.current);
      signalingPollRef.current = null;
    }
    if (caseItem) {
      void roleApi.consultationSignal(caseItem.id, {
        type: 'leave',
        payload: { sessionId: localSignalSessionRef.current }
      }).catch(() => undefined);
    }
    attachVideoStream(primaryVideoRef.current, null, true);
    attachVideoStream(tileVideoRef.current, null, true);
    rtcRef.current?.stop();
    rtcRef.current = null;
    remoteDescriptionReadyRef.current = false;
    pendingCandidatesRef.current = [];
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRemoteStream(null);
  };

  const setupLocalMedia = async () => {
    stopLocalMedia();
    const iceConfig = await roleApi.consultationIceServers().catch(() => ({
      iceServers: [] as RTCIceServer[],
      relayConfigured: false
    }));
    setRelayWarning(
      iceConfig.relayConfigured === false
        ? 'TURN-сервер не настроен: звонок может не пройти в корпоративной или мобильной сети.'
        : null
    );
    rtcRef.current = new WebRTCService(
      iceConfig.iceServers || [],
      (remoteStream) => {
        setRemoteStream(remoteStream);
      },
      (candidate) => {
        const sessionId = isDoctor ? remoteSignalSessionRef.current : localSignalSessionRef.current;
        if (!caseItem || !sessionId) return;
        void roleApi.consultationSignal(caseItem.id, {
          type: 'ice',
          payload: { sessionId, candidate: candidate.toJSON() }
        }).catch(() => undefined);
      },
      (state) => {
        if (state === 'connected') {
          isRecoveringConnectionRef.current = false;
          setLocalStatus('Видео и аудио подключены');
          return;
        }
        if (state === 'connecting') setLocalStatus('Устанавливаем защищённое соединение…');
        if ((state === 'disconnected' || state === 'failed') && !isCallEnded && !reconnectTimerRef.current) {
          setLocalStatus('Связь прервалась. Переподключаемся…');
          reconnectTimerRef.current = window.setTimeout(() => {
            reconnectTimerRef.current = null;
            void recoverConnection();
          }, state === 'failed' ? 500 : 2500);
        }
      }
    );
    const stream = await rtcRef.current.startLocalStream();
    streamRef.current = stream;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !isVideoOff;
    });
    attachVideoStream(primaryVideoRef.current, isLocalPrimary ? stream : remoteStream, isLocalPrimary);
    attachVideoStream(tileVideoRef.current, isLocalPrimary ? remoteStream : stream, !isLocalPrimary);
  };

  const processConsultationSignals = async () => {
    if (!caseItem || !rtcRef.current) return;
    const signals = await roleApi.consultationSignals(caseItem.id, lastSignalIdRef.current);
    const flushPendingCandidates = async () => {
      if (!rtcRef.current || !remoteDescriptionReadyRef.current) return;
      const candidates = pendingCandidatesRef.current.splice(0);
      for (const candidate of candidates) {
        await rtcRef.current.addCandidate(candidate).catch(() => undefined);
      }
    };

    for (const signal of signals) {
      lastSignalIdRef.current = Math.max(lastSignalIdRef.current, Number(signal.id || 0));
      if (!signal?.id || processedSignalsRef.current.has(signal.id) || signal.senderId === user.id) continue;
      processedSignalsRef.current.add(signal.id);

      const payload = signal.payload || {};
      const sessionId = payload.sessionId;

      if (signal.type === 'offer' && isDoctor && payload.offer && sessionId && answerSentForSessionRef.current !== sessionId) {
        remoteSignalSessionRef.current = sessionId;
        remoteDescriptionReadyRef.current = false;
        const answer = await rtcRef.current.handleOffer(payload.offer);
        remoteDescriptionReadyRef.current = true;
        await flushPendingCandidates();
        answerSentForSessionRef.current = sessionId;
        await roleApi.consultationSignal(caseItem.id, {
          type: 'answer',
          payload: { sessionId, answer }
        });
      }

      if (signal.type === 'answer' && !isDoctor && payload.answer && sessionId === localSignalSessionRef.current) {
        await rtcRef.current.handleAnswer(payload.answer);
        remoteDescriptionReadyRef.current = true;
        await flushPendingCandidates();
      }

      if (signal.type === 'ice' && payload.candidate) {
        const expectedSessionId = isDoctor ? remoteSignalSessionRef.current : localSignalSessionRef.current;
        if (!sessionId || sessionId !== expectedSessionId) continue;
        if (!remoteDescriptionReadyRef.current) {
          pendingCandidatesRef.current.push(payload.candidate);
          continue;
        }
        await rtcRef.current.addCandidate(payload.candidate).catch(() => undefined);
      }

      if (signal.type === 'leave') {
        setRemoteStream(null);
      }
    }
  };

  const startConsultationSignaling = async () => {
    if (!caseItem || !rtcRef.current) return;
    if (!isDoctor && !offerSentRef.current) {
      const offer = await rtcRef.current.createOffer();
      offerSentRef.current = true;
      await roleApi.consultationSignal(caseItem.id, {
        type: 'offer',
        payload: { sessionId: localSignalSessionRef.current, offer }
      });
    }

    await processConsultationSignals().catch((signalError) => {
      setError(signalError instanceof Error ? signalError.message : 'Не удалось подключить консультационную комнату');
    });

    if (!signalingPollRef.current) {
      signalingPollRef.current = window.setInterval(() => {
        void processConsultationSignals().catch(() => undefined);
      }, 1500);
    }
  };

  useEffect(() => {
    const localStream = streamRef.current;
    attachVideoStream(primaryVideoRef.current, isLocalPrimary ? localStream : remoteStream, isLocalPrimary);
    attachVideoStream(tileVideoRef.current, isLocalPrimary ? remoteStream : localStream, !isLocalPrimary);
  }, [isLocalPrimary, remoteStream, isVideoOff]);

  const aiSummary = useMemo(() => {
    if (reportItem?.finalReport?.trim()) return reportItem.finalReport;
    if (reportItem?.aiSummary?.trim()) return reportItem.aiSummary;
    if (!messages.length) return '';
    return messages.map((item) => `${speakerLabel[item.speaker]}: ${item.text}`).join('\n');
  }, [messages, reportItem]);

  const buildConsultationContext = (nextMessages = messages) =>
    [
      `Case summary: ${caseItem?.summary || ''}`,
      `Transcript:\n${nextMessages.map((item) => `${speakerLabel[item.speaker]}: ${item.text}`).join('\n')}`,
      `Documents:\n${uploadedDocs.map((item) => `${item.name}: ${item.analysis}`).join('\n')}`,
      `Current draft:\n${doctorNotes.complaints}`,
      `Doctor recommendations:\n${doctorNotes.recommendations}`
    ]
      .filter(Boolean)
      .join('\n\n')
      .slice(-10000);

  const parseAiDraft = (text: string) => {
    const clean = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
    const recommendationsMatch = clean.match(/(?:Рекомендации врачу|Рекомендации|Doctor recommendations)\s*:\s*([\s\S]*)/i);
    const summary = recommendationsMatch ? clean.slice(0, recommendationsMatch.index).trim() : clean;
    const recommendations = recommendationsMatch?.[1]?.trim() || '';
    return { summary, recommendations };
  };

  const syncPatientDraft = async (nextMessages: TranscriptEntry[], nextDocs: UploadedDoc[], nextSummary?: string) => {
    if (!caseItem || isDoctor) return;
    const nextReport = await roleApi.patientSaveConsultationDraft(caseItem.id, {
      transcript: nextMessages,
      uploadedDocs: nextDocs,
      aiSummary: nextSummary || reportItem?.aiSummary || undefined
    });
    setReportItem(nextReport);
    setMessages(nextReport?.transcript || nextMessages);
    setUploadedDocs(nextReport?.uploadedDocs || nextDocs);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const found = isDoctor
        ? await roleApi.doctorCaseById(id)
        : (await roleApi.patientCases()).find((item: CaseItem) => item.id === id) || null;

      if (!found) {
        setCaseItem(null);
        setReportItem(null);
        setMessages([]);
        setUploadedDocs([]);
        return;
      }

      setCaseItem(found);
      let report = isDoctor ? await roleApi.doctorCaseReport(id) : await roleApi.patientConsultationReport(id);
      if (!isDoctor && found.id && sharedContextCaseRef.current !== found.id) {
        sharedContextCaseRef.current = found.id;
        report = await roleApi.patientShareContextToCase(found.id).catch(() => report);
      }
      setReportItem(report);
      setMessages(report?.transcript || []);
      setUploadedDocs(report?.uploadedDocs || []);
      setDoctorNotes({
        complaints: report?.aiSummary || '',
        recommendations: report?.doctorRecommendations || ''
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить комнату консультации');
    } finally {
      setLoading(false);
    }
  };

  const recoverConnection = async () => {
    if (!caseItem || isCallEnded || isRecoveringConnectionRef.current || !navigator.onLine) return;
    isRecoveringConnectionRef.current = true;
    try {
      offerSentRef.current = false;
      answerSentForSessionRef.current = null;
      remoteSignalSessionRef.current = null;
      remoteDescriptionReadyRef.current = false;
      pendingCandidatesRef.current = [];
      processedSignalsRef.current.clear();
      lastSignalIdRef.current = 0;
      localSignalSessionRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await setupLocalMedia();
      await startConsultationSignaling();
    } catch {
      setError('Не удалось восстановить звонок. Проверьте интернет и разрешения камеры и микрофона.');
    } finally {
      isRecoveringConnectionRef.current = false;
    }
  };

  const syncConsultationReport = async () => {
    if (!caseItem) return;
    const report = isDoctor ? await roleApi.doctorCaseReport(caseItem.id) : await roleApi.patientConsultationReport(caseItem.id);
    setReportItem(report);
    if (Array.isArray(report?.transcript)) {
      setMessages(report.transcript);
    }
    if (Array.isArray(report?.uploadedDocs)) {
      setUploadedDocs(report.uploadedDocs);
    }
    if (!doctorRecommendationsEditedRef.current) {
      setDoctorNotes((prev) => ({
        complaints: report?.aiSummary || report?.finalReport || prev.complaints,
        recommendations: report?.doctorRecommendations || prev.recommendations
      }));
    }
  };

  useEffect(() => {
    void load();
  }, [id, isDoctor]);

  useEffect(() => {
    if (!caseItem?.id || isCallEnded) return;
    const reportSyncTimer = window.setInterval(() => {
      void syncConsultationReport().catch(() => undefined);
    }, 10000);
    return () => window.clearInterval(reportSyncTimer);
  }, [caseItem?.id, isDoctor, isCallEnded]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, uploading, busy]);

  useEffect(() => {
    if (!isDoctor || !caseItem || !aiAssistantEnabled || messages.length === 0) return;
    const signature = JSON.stringify({
      messages: messages.filter((item) => item.speaker !== 'ai').slice(-8).map((item) => [item.speaker, item.text]),
      docs: uploadedDocs.map((item) => item.name),
      summary: caseItem.summary
    });
    if (signature === aiAssistantSignatureRef.current) return;

    const timer = window.setTimeout(async () => {
      aiAssistantSignatureRef.current = signature;
      setAiAssistantBusy(true);
      try {
        const prompt = [
          'You are a silent AI medical assistant for a doctor during a live telemedicine consultation.',
          'Analyze patient complaints, doctor replies, transcript and documents.',
          'Return plain Russian text without Markdown or asterisks.',
          'Structure the answer as:',
          'Краткий разбор: ...',
          'Что уточнить врачу: ...',
          'Предварительный PDF-черновик: ...',
          'Рекомендации врачу: ...',
          buildConsultationContext()
        ].join('\n\n');

        const response = await advancedChatStream(prompt, {
          systemInstruction:
            'Ты медицинский ИИ-помощник врача. Не ставь окончательный диагноз. Помогай вести консультацию, структурировать жалобы, вопросы, риски, документы и черновик PDF-заключения. Ответ строго на русском, чистым текстом.',
          useSearch: false
        });
        const parsed = parseAiDraft(response);
        const aiMessage = {
          speaker: 'ai' as const,
          text: parsed.summary,
          createdAt: new Date().toISOString()
        };
        setMessages((current) => {
          const withoutPreviousSuggestion = current.filter(
            (item) => !(item.speaker === 'ai' && item.text.startsWith('Краткий разбор:'))
          );
          return [...withoutPreviousSuggestion, aiMessage];
        });
        setDoctorNotes((prev) => ({
          complaints: parsed.summary || prev.complaints,
          recommendations: doctorRecommendationsEditedRef.current ? prev.recommendations : parsed.recommendations || prev.recommendations
        }));
        await roleApi.doctorSaveConsultationReportDraft(caseItem.id, {
          aiSummary: parsed.summary,
          doctorRecommendations: doctorRecommendationsEditedRef.current ? doctorNotes.recommendations : parsed.recommendations
        });
      } catch (assistantError) {
        console.error('Consultation AI assistant error:', assistantError);
      } finally {
        setAiAssistantBusy(false);
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [isDoctor, caseItem?.id, aiAssistantEnabled, messages, uploadedDocs]);

  useEffect(() => {
    const setup = async () => {
      try {
        await setupLocalMedia();
        await startConsultationSignaling();
      } catch (mediaError) {
        setError(mediaError instanceof Error ? mediaError.message : 'Камера или микрофон недоступны');
      }
    };

    void setup();
    const reconnectWhenOnline = () => void recoverConnection();
    window.addEventListener('online', reconnectWhenOnline);
    return () => {
      window.removeEventListener('online', reconnectWhenOnline);
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      stopLocalMedia();
    };
  }, [caseItem?.id, isDoctor]);

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  }, [isMuted]);

  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !isVideoOff;
    });
  }, [isVideoOff]);

  const handlePatientSend = async () => {
    const text = messageText.trim();
    if (!text || !caseItem) return;

    const nextMessages = [...messages, { speaker: 'patient' as const, text, createdAt: new Date().toISOString() }];
    setBusy(true);
    setLocalStatus(null);
    setError(null);

    try {
      setMessages(nextMessages);
      setMessageText('');
      await syncPatientDraft(nextMessages, uploadedDocs);
      setLocalStatus('Сообщение сохранено в консультационной комнате');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Не удалось отправить сообщение');
    } finally {
      setBusy(false);
    }
  };

  const handleDoctorSend = async () => {
    const text = messageText.trim();
    if (!text || !caseItem) return;

    setBusy(true);
    setLocalStatus(null);
    setError(null);
    try {
      const nextReport = await roleApi.doctorAppendConsultationMessage(caseItem.id, text);
      setReportItem(nextReport);
      setMessages(nextReport?.transcript || []);
      setUploadedDocs(nextReport?.uploadedDocs || []);
      setMessageText('');
      setLocalStatus('Ответ врача добавлен');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Не удалось отправить ответ');
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !caseItem || isDoctor) return;

    setUploading(true);
    setLocalStatus(null);
    setError(null);
    try {
      const [uploaded, text] = await Promise.all([roleApi.uploadMedicalFileSmart(file), readFileAsText(file)]);

      const analysis = await analyzeHealthData(file.type.startsWith('image/') ? 'medical-image' : 'medical-document', (text || file.name).slice(0, 4000));
      const nextDocs = [...uploadedDocs, { name: file.name, analysis: `${analysis.summary}\nФайл: ${uploaded.bucket}/${uploaded.path}` }];
      const nextMessages = [...messages, { speaker: 'system' as const, text: `Добавлен документ: ${file.name}`, createdAt: new Date().toISOString() }];

      setMessages(nextMessages);
      setUploadedDocs(nextDocs);
      await syncPatientDraft(nextMessages, nextDocs);
      setLocalStatus('Документ добавлен в комнату');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Не удалось загрузить документ');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleCreateReport = async () => {
    if (!caseItem || !isDoctor) return;
    setIsGeneratingReport(true);
    setError(null);
    setLocalStatus(null);
    try {
      const summary = await analyzeHealthData(
        'consultation-report',
        [
          doctorNotes.complaints,
          messages.map((item) => `${speakerLabel[item.speaker]}: ${item.text}`).join('\n'),
          uploadedDocs.map((item) => `${item.name}: ${item.analysis}`).join('\n')
        ]
          .filter(Boolean)
          .join('\n\n')
      );
      setDoctorNotes((prev) => ({ ...prev, complaints: summary.summary }));
      setLocalStatus('Черновик ИИ-отчёта обновлён');
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'Не удалось сгенерировать отчёт');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleConfirmReport = async () => {
    if (!caseItem || !isDoctor || !doctorNotes.recommendations.trim()) return;
    setBusy(true);
    setError(null);
    setLocalStatus(null);
    try {
      const confirmed = await roleApi.doctorConfirmCaseReport(caseItem.id, doctorNotes.recommendations.trim());
      setReportItem(confirmed);
      setMessages(confirmed?.transcript || []);
      setUploadedDocs(confirmed?.uploadedDocs || []);
      setDoctorNotes((prev) => ({
        ...prev,
        complaints: confirmed?.finalReport || prev.complaints,
        recommendations: confirmed?.doctorRecommendations || prev.recommendations
      }));
      setLocalStatus('Итоговый PDF подтверждён и отправлен пациенту');
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Не удалось подтвердить отчёт');
    } finally {
      setBusy(false);
    }
  };

  const ensureMediaThen = (action: () => void) => {
    if (!streamRef.current) {
      void setupLocalMedia().then(action).catch(() => setError('Камера или микрофон недоступны'));
      return;
    }
    action();
  };

  const hasLiveTrack = (kind: 'audio' | 'video') => {
    const tracks = kind === 'audio' ? streamRef.current?.getAudioTracks() : streamRef.current?.getVideoTracks();
    return Boolean(tracks?.some((track) => track.readyState === 'live'));
  };

  const reacquireVideoTrack = async () => {
    const nextVideoStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      audio: false
    });
    const nextVideoTrack = nextVideoStream.getVideoTracks()[0];
    if (!nextVideoTrack) throw new Error('Camera track unavailable');

    let localStream = streamRef.current;
    if (!localStream) {
      localStream = new MediaStream();
      streamRef.current = localStream;
    }

    localStream.getVideoTracks().forEach((track) => {
      localStream?.removeTrack(track);
      track.stop();
    });
    localStream.addTrack(nextVideoTrack);
    nextVideoTrack.enabled = true;
    rtcRef.current?.replaceLocalTrack(nextVideoTrack, localStream);

    attachVideoStream(primaryVideoRef.current, isLocalPrimary ? localStream : remoteStream, isLocalPrimary);
    attachVideoStream(tileVideoRef.current, isLocalPrimary ? remoteStream : localStream, !isLocalPrimary);
  };

  const toggleLocalAudio = async () => {
    if (!hasLiveTrack('audio')) {
      try {
        await setupLocalMedia();
      } catch {
        setError('Микрофон недоступен');
        return;
      }
    }

    setIsMuted((prev) => {
      const next = !prev;
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  };

  const toggleLocalVideo = async () => {
    if (!hasLiveTrack('video')) {
      try {
        await reacquireVideoTrack();
      } catch {
        setError('Камера недоступна');
        return;
      }
    }

    setIsVideoOff((prev) => {
      const next = !prev;
      streamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  };

  const handleEndCall = async () => {
    if (caseItem) {
      void roleApi.consultationSignal(caseItem.id, { type: 'leave', payload: { sessionId: localSignalSessionRef.current } }).catch(() => undefined);
    }
    setBusy(true);
    try {
      if (caseItem && isDoctor) {
        await roleApi.doctorSaveConsultationReportDraft(caseItem.id, {
          aiSummary: doctorNotes.complaints || aiSummary || undefined,
          doctorRecommendations: doctorNotes.recommendations || undefined
        }).catch(() => undefined);
        const finalRecommendations = (doctorNotes.recommendations || 'Консультация завершена врачом.').trim();
        await roleApi.doctorConfirmCaseReport(caseItem.id, finalRecommendations).catch(() => undefined);
        await roleApi.doctorUpdateCaseStatus(caseItem.id, 'closed');
      } else if (caseItem) {
        await roleApi.patientSaveConsultationDraft(caseItem.id, {
          transcript: messages,
          uploadedDocs,
          aiSummary: aiSummary || undefined
        }).catch(() => undefined);
      }
    } finally {
      stopLocalMedia();
      setBusy(false);
      setIsCallEnded(true);
      if (!isDoctor) {
        window.setTimeout(() => {
          navigate('/archive', { replace: true });
        }, 250);
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-black uppercase tracking-[0.3em]">Загрузка комнаты</div>;
  }

  if (!caseItem) {
    return <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center font-black uppercase tracking-[0.2em]">{error || 'Кейс не найден'}</div>;
  }

  if (!isDoctor) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-white lg:h-[100svh] lg:min-h-0 lg:overflow-hidden">
        <div className="flex min-h-screen flex-col lg:h-full lg:min-h-0 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col bg-[#0A0F1A]">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Назад
              </button>
              <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">
                WebRTC Room
              </div>
            </div>

            <div className="flex flex-1 items-stretch justify-stretch px-0 pb-0">
              <div className="relative flex min-h-[100svh] w-full max-w-none flex-1 items-center justify-center overflow-hidden bg-black shadow-[0_40px_120px_rgba(0,0,0,0.45)] lg:min-h-0">
                {isLocalPrimary ? (
                  <video ref={primaryVideoRef} autoPlay playsInline muted={isLocalPrimary} className="h-full w-full scale-x-[-1] object-cover opacity-90" />
                ) : remoteStream ? (
                  <video ref={primaryVideoRef} autoPlay playsInline muted={isLocalPrimary} className="h-full w-full scale-x-[-1] object-cover opacity-90" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black">
                    <p className="text-center text-sm font-black uppercase tracking-[0.35em] text-slate-500">Ожидание врача...</p>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/30" />
                <button
                  type="button"
                  onClick={() => remoteStream && setIsLocalPrimary((prev) => !prev)}
                  className="absolute right-4 top-4 z-10 h-24 w-36 overflow-hidden rounded-[1.25rem] bg-black shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition hover:scale-[1.02] disabled:cursor-default sm:right-6 sm:top-6 sm:h-28 sm:w-44"
                  disabled={!remoteStream}
                  aria-label="Поменять видео местами"
                >
                  {isLocalPrimary ? (
                    remoteStream ? (
                      <video ref={tileVideoRef} autoPlay playsInline muted={!isLocalPrimary} className="h-full w-full scale-x-[-1] object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-950">
                        <VideoOff className="h-6 w-6 text-slate-600" />
                      </div>
                    )
                  ) : (
                    <video ref={tileVideoRef} autoPlay playsInline muted={!isLocalPrimary} className="h-full w-full scale-x-[-1] object-cover" />
                  )}
                </button>
                {isCallEnded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85">
                    <div className="text-center">
                      <p className="text-xl font-black uppercase tracking-[0.3em] text-white">Консультация завершена</p>
                      <p className="mt-4 text-sm text-slate-300">Итоговый отчёт и документы доступны справа.</p>
                    </div>
                  </div>
                )}
                {!isCallEnded && (
                  <div className="fixed bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 sm:bottom-6 sm:gap-4">
                    <button
                      onClick={() => void toggleLocalAudio()}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                    >
                      {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </button>
                    <button
                      onClick={handleEndCall}
                      className="rounded-2xl bg-red-500 px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-white shadow-[0_20px_40px_rgba(239,68,68,0.35)]"
                    >
                      Завершить
                    </button>
                    <button
                      onClick={() => void toggleLocalVideo()}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                    >
                      {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="w-full border-t border-white/10 bg-white text-slate-900 lg:max-w-[22%] lg:basis-[22%] lg:border-l lg:border-t-0 xl:max-w-[20%] xl:basis-[20%]">
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-100 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">Комната пациента</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Чат и документы</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-3">
                  {messages.map((item, index) => {
                    const isOwn = item.speaker === 'patient';
                    return (
                      <div key={`${item.createdAt}-${index}`} className={`rounded-2xl px-4 py-3 ${isOwn ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
                        <div className="mb-1 flex items-center justify-between gap-4">
                          <span className="text-[10px] font-black uppercase tracking-[0.24em] opacity-75">{speakerLabel[item.speaker]}</span>
                          <span className="text-[10px] opacity-70">{formatDateTime(item.createdAt)}</span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{item.text}</p>
                      </div>
                    );
                  })}
                  {busy && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Сохранение...</div>}
                  <div ref={chatEndRef} />
                </div>

                <div className="mt-6 space-y-3 rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Документы</p>
                  {uploadedDocs.length === 0 ? (
                    <p className="text-sm text-slate-500">Документы пока не добавлены.</p>
                  ) : (
                    uploadedDocs.map((doc) => (
                      <div key={doc.name} className="rounded-2xl bg-white p-3 shadow-sm">
                        <p className="text-sm font-black text-slate-900">{doc.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{doc.analysis}</p>
                      </div>
                    ))
                  )}
                  {reportItem?.pdfBase64 ? (
                    <button
                      onClick={() => downloadBase64Pdf(reportItem.pdfBase64!, `consultation-${caseItem.id}.pdf`)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white"
                    >
                      <Download className="h-4 w-4" />
                      Скачать PDF
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-slate-100 px-4 py-4">
                {localStatus ? <p className="mb-3 text-xs font-bold text-blue-600">{localStatus}</p> : null}
                {relayWarning ? <p className="mb-3 text-xs font-semibold text-amber-700">{relayWarning}</p> : null}
                {error ? <p className="mb-3 text-xs font-bold text-red-500">{error}</p> : null}
                <div className="mb-3 flex items-center gap-2">
                  <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                    <Paperclip className="h-5 w-5" />
                    <input type="file" className="hidden" onChange={handleUpload} />
                  </label>
                  <input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handlePatientSend();
                      }
                    }}
                    placeholder="Сообщение врачу..."
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none"
                  />
                  <button
                    onClick={() => void handlePatientSend()}
                    disabled={!messageText.trim() || busy || uploading}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Итоговый PDF после подтверждения врача появится здесь и в медицинском архиве.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121B32] text-white lg:h-[100svh] lg:overflow-hidden">
      <div className="flex min-h-screen flex-col lg:h-full lg:min-h-0 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex min-h-[100svh] flex-1 items-center justify-center lg:min-h-0">
            <div className="absolute inset-0 bg-[#121B32]" />
            <div className="absolute inset-0 overflow-hidden bg-black">
              {isLocalPrimary ? (
                <video ref={primaryVideoRef} autoPlay playsInline muted={isLocalPrimary} className="h-full w-full scale-x-[-1] object-cover opacity-90" />
              ) : remoteStream ? (
                <video ref={primaryVideoRef} autoPlay playsInline muted={isLocalPrimary} className="h-full w-full scale-x-[-1] object-cover opacity-90" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#121B32]">
                  <p className="text-center text-xl font-black uppercase tracking-[0.5em] text-slate-500">Ожидание собеседника...</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => remoteStream && setIsLocalPrimary((prev) => !prev)}
              className="absolute right-4 top-4 z-10 h-24 w-40 overflow-hidden rounded-[1.5rem] bg-black shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition hover:scale-[1.02] disabled:cursor-default sm:right-6 sm:top-6"
              disabled={!remoteStream}
              aria-label="Поменять видео местами"
            >
              {isLocalPrimary ? (
                remoteStream ? (
                  <video ref={tileVideoRef} autoPlay playsInline muted={!isLocalPrimary} className="h-full w-full scale-x-[-1] object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black">
                    <VideoOff className="h-7 w-7 text-slate-700" />
                  </div>
                )
              ) : (
                <video ref={tileVideoRef} autoPlay playsInline muted={!isLocalPrimary} className="h-full w-full scale-x-[-1] object-cover" />
              )}
            </button>
            {!isCallEnded && !isLocalPrimary && !remoteStream ? (
              <p className="pointer-events-none relative z-10 text-center text-xl font-black uppercase tracking-[0.5em] text-slate-500">
                Ожидание собеседника...
              </p>
            ) : null}
            {isCallEnded ? (
              <p className="relative z-10 text-center text-xl font-black uppercase tracking-[0.5em] text-slate-500">
                Сеанс завершён
              </p>
            ) : null}

            <div className="fixed bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 sm:bottom-6 sm:gap-4">
              <button
                onClick={() => void toggleLocalAudio()}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <button
                onClick={handleEndCall}
                className="rounded-2xl bg-red-500 px-6 py-4 text-sm font-black uppercase tracking-[0.24em] text-white shadow-[0_20px_40px_rgba(239,68,68,0.35)]"
              >
                <PhoneOff className="mr-2 inline h-5 w-5" />
                Завершить
              </button>
              <button
                onClick={() => void toggleLocalVideo()}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg backdrop-blur-md transition hover:bg-white/20"
              >
                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        <aside className="w-full border-t border-slate-800 bg-white text-slate-900 lg:max-w-[22%] lg:basis-[22%] lg:border-l lg:border-t-0 xl:max-w-[20%] xl:basis-[20%]">
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setDoctorTab('scribe')}
                className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] ${doctorTab === 'scribe' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
              >
                AI Scribe
              </button>
              <button
                onClick={() => setDoctorTab('analytics')}
                className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] ${doctorTab === 'analytics' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
              >
                Аналитика
              </button>
            </div>
          </div>

          <div className="overflow-y-auto px-4 py-4 lg:h-[calc(100%-81px)]">
            {doctorTab === 'scribe' ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Live Transcription</p>
                <button
                  onClick={() => setAiAssistantEnabled((current) => !current)}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] ${aiAssistantEnabled ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {aiAssistantBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                  {aiAssistantEnabled ? 'ИИ помощник включён' : 'ИИ помощник выключен'}
                </button>
                <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-sm text-slate-400">Слушаем аудиопоток...</p>
                    ) : (
                      messages.map((item, index) => (
                        <div key={`${item.createdAt}-${index}`} className="rounded-2xl bg-white p-3 shadow-sm">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{speakerLabel[item.speaker]}</span>
                            <span className="text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-700">{item.text}</p>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Ответ пациенту</p>
                  <textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Введите ответ пациенту..."
                    className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  />
                  <button
                    onClick={() => void handleDoctorSend()}
                    disabled={!messageText.trim() || busy}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Отправить
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Fingerprint className="h-5 w-5 text-blue-600" />
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Черновик ИИ-отчёта</p>
                  </div>
                  <textarea
                    value={doctorNotes.complaints}
                    onChange={(event) => setDoctorNotes((prev) => ({ ...prev, complaints: event.target.value }))}
                    className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    placeholder="Черновик ИИ-отчёта..."
                  />
                  <button
                    onClick={() => void handleCreateReport()}
                    disabled={isGeneratingReport}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white disabled:opacity-50"
                  >
                    {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                    Обновить черновик
                  </button>
                </div>

                <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Рекомендации врача</p>
                  </div>
                  <textarea
                    value={doctorNotes.recommendations}
                    onChange={(event) => {
                      doctorRecommendationsEditedRef.current = true;
                      setDoctorNotes((prev) => ({ ...prev, recommendations: event.target.value }));
                    }}
                    className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    placeholder="Финальные рекомендации для пациента..."
                  />
                  <button
                    onClick={() => void handleConfirmReport()}
                    disabled={!doctorNotes.recommendations.trim() || busy}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-white disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Подтвердить PDF
                  </button>
                  {reportItem?.pdfBase64 ? (
                    <button
                      onClick={() => downloadBase64Pdf(reportItem.pdfBase64!, `consultation-${caseItem.id}.pdf`)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.22em] text-slate-700"
                    >
                      <Download className="h-4 w-4" />
                      Скачать PDF
                    </button>
                  ) : null}
                </div>

                {localStatus ? <p className="text-xs font-bold text-blue-600">{localStatus}</p> : null}
                {relayWarning ? <p className="text-xs font-semibold text-amber-700">{relayWarning}</p> : null}
                {error ? <p className="text-xs font-bold text-red-500">{error}</p> : null}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ConsultationRoom;
