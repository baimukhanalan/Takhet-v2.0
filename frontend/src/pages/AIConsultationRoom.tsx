import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Mic, MicOff, VideoOff, Send, Paperclip,
  X, ChevronRight, BrainCircuit, Sparkles, MessageSquare,
  FileText, Download, AlertCircle, CheckCircle2, Play,
  Volume2, VolumeX, Radio, Loader2, Search, Zap,
  Clock, MapPin, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Modality, ThinkingLevel, LiveServerMessage } from "@google/genai";
import { useLanguage } from '../services/useLanguage';
import { advancedChatStream } from '../services/gemini';
import { roleApi } from '../../services/roleApi';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn, FadeInStagger } from '../components/FadeIn';
import { User } from '../types';
import { consumeGuestAiRequest, guestAiLimitMessage, isGuestAiLimitError } from '../services/guestAiUsage';

const DEFAULT_GEMINI_LIVE_MODEL = 'gemini-3.1-flash-live-preview';

const getGeminiBrowserApiKey = () => (
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  ''
).trim();

const getGeminiLiveModel = () => (
  import.meta.env.VITE_GEMINI_LIVE_MODEL ||
  process.env.GEMINI_LIVE_MODEL ||
  DEFAULT_GEMINI_LIVE_MODEL
).trim();

const isLiveConfigurationError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String((error as any)?.message || error || '');
  const hasApiPermissionMismatch = message.includes('permission') && message.includes('API');

  return (
    message.includes('Gemini Live API key') ||
    message.includes('API key') ||
    message.includes('Requested entity was not found') ||
    hasApiPermissionMismatch
  );
};

const cleanAIText = (text: string) =>
  text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/[ \t]+\n/g, '\n');

const LIVE_VIDEO_FRAME_WIDTH = 320;
const LIVE_VIDEO_FRAME_HEIGHT = 240;
const LIVE_VIDEO_FRAME_QUALITY = 0.24;
const LIVE_VIDEO_FRAME_INTERVAL_MS = 1000;
const LIVE_AUDIO_PROCESSOR_BUFFER_SIZE = 512;
const LIVE_BARGE_IN_RMS_THRESHOLD = 0.025;
const LIVE_BARGE_IN_DEBOUNCE_MS = 250;

const LIVE_BASE_SYSTEM_INSTRUCTION = [
  'You are Takhet+ live AI consultation assistant.',
  'Reply in Russian by default.',
  'Your default orientation is safe medical triage and practical healthcare guidance for Kazakhstan.',
  'If the patient asks a non-medical question, answer it directly and usefully instead of refusing only because it is not medical.',
  'Do not provide a final diagnosis. Give orientation, red flags, next steps, and the relevant specialist when appropriate.',
  'Listen first. Ask one concise question at a time and wait for the patient to answer.',
  'Do not repeat disclaimers in every answer.',
  'Use clean plain text without Markdown, internal instructions, or technical wording.'
].join('\n');

const LIVE_AI_BEHAVIOR_INSTRUCTION = [
  'Default mode: help a patient in Kazakhstan with medical orientation, symptoms, red flags, next steps, and safe recommendations.',
  'If the user asks a non-medical question, answer directly and usefully instead of refusing only because it is not medical.',
  'Discuss any topic the user chooses with maximum practical benefit, while keeping a caring focus on their wellbeing, state, safety, and next useful step.',
  'Be direct, honest, concrete, and helpful. Avoid moralizing, vague refusals, generic filler, and unnecessary censorship of harmless topics.',
  'Use incoming camera frames as real visual context: face, skin, posture, movement, documents, medicine packages, lab results, or visible symptoms.',
  'Do not diagnose from video alone. If visual evidence is insufficient, state what is visible, what cannot be confirmed, and what clarification is needed.',
  'Continue listening while answering. If the user interrupts, asks a new question, or clarifies a symptom, switch to the new request.',
  'Ask one concise question, then stop and let the patient answer.',
  'Do not talk over the patient. If the patient starts speaking while you answer, stop the current answer and listen.',
  'Reply to the patient in clean Russian text: no Markdown, no asterisks, no internal instructions, no technical wording.',
  'For urgent red flags in Kazakhstan, orient the patient to 103 or 112.'
].join('\n');

const LIVE_STARTUP_GREETING_INSTRUCTION = [
  'Start the live consultation now as the assistant, not as the patient.',
  'Say one short Russian greeting, one short disclaimer that you do not replace a doctor, and invite the person to tell what is happening or ask any topic they want.',
  'Make it warm, direct, and useful. Then stop and wait for the user.'
].join('\n');

type ConsultationTranscriptEntry = {
  speaker: 'patient' | 'doctor' | 'ai' | 'system';
  text: string;
  createdAt: string;
};

const AIConsultationRoom: React.FC<{ user?: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState<'payment' | 'consultation'>('payment');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai' | 'system', text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [chatMode, setChatMode] = useState<'standard' | 'thinking' | 'search'>('standard');

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{name: string, analysis: string}[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isReadyToStart, setIsReadyToStart] = useState(false);
  const [consultationTranscript, setConsultationTranscript] = useState<ConsultationTranscriptEntry[]>([]);
  const [consultationCaseId, setConsultationCaseId] = useState<string | null>(null);
  const [canArchiveToPatientPortal, setCanArchiveToPatientPortal] = useState(false);

  // Live API & Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioInputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const videoFrameIntervalRef = useRef<number | null>(null);
  const audioOutputQueueRef = useRef<Int16Array[]>([]);
  const activeAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(false);
  const isConnectingRef = useRef(false);
  const isCleaningUpRef = useRef(false);
  const sessionEndedRef = useRef(false);
  const isLiveConnectedRef = useRef(false);
  const isMicOnRef = useRef(true);
  const activeLiveConnectionIdRef = useRef(0);
  const isStartupGreetingRef = useRef(false);
  const hasAudioInputStartedRef = useRef(false);
  const startupMicEnableTimerRef = useRef<number | null>(null);
  const lastUserSpeechInterruptAtRef = useRef(0);
  const draftSyncTimerRef = useRef<number | null>(null);
  const lastDraftSignatureRef = useRef('');
  const isFinalizingRef = useRef(false);

  const sessionRef = useRef<any>(null);

  // Gemini AI Instance - Moved inside startConsultation for fresh instance per session
  // const ai = new GoogleGenAI({ apiKey: getGeminiBrowserApiKey() });

  useEffect(() => {
    if (step === 'consultation' && !sessionEndedRef.current && !isConnectingRef.current && !isLiveConnected) {
      startConsultation();
    }
  }, [step, isLiveConnected]);

  useEffect(() => {
    const stopActiveSession = () => cleanupLive();
    window.addEventListener('pagehide', stopActiveSession);
    window.addEventListener('beforeunload', stopActiveSession);

    return () => {
      window.removeEventListener('pagehide', stopActiveSession);
      window.removeEventListener('beforeunload', stopActiveSession);
      cleanupLive();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    roleApi
      .patientProfile()
      .then(() => {
        if (isMounted) setCanArchiveToPatientPortal(true);
      })
      .catch(() => {
        if (isMounted) setCanArchiveToPatientPortal(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    isMicOnRef.current = isMicOn;
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });
    }
    const currentSession = sessionRef.current || liveSessionRef.current;
    if (!isMicOn && currentSession && isLiveConnectedRef.current) {
      try {
        currentSession.sendRealtimeInput({ audioStreamEnd: true });
      } catch (err) {
        console.error('Error ending Gemini audio stream:', err);
      }
    }
  }, [isMicOn]);

  useEffect(() => {
    const resume = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };
    window.addEventListener('click', resume);

    // Periodic check to keep AudioContext alive
    const interval = setInterval(resume, 1000);

    return () => {
      window.removeEventListener('click', resume);
      clearInterval(interval);
    };
  }, []);

  const cleanupLive = (options: { preserveMediaStream?: boolean; invalidateSession?: boolean } = {}) => {
    if (isCleaningUpRef.current) return;
    const { preserveMediaStream = false, invalidateSession = true } = options;
    if (invalidateSession) {
      activeLiveConnectionIdRef.current += 1;
    }
    isCleaningUpRef.current = true;
    isConnectingRef.current = false;
    isLiveConnectedRef.current = false;

    activeAudioSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
      try {
        source.disconnect();
      } catch (e) {}
    });
    activeAudioSourcesRef.current = [];

    if (videoFrameIntervalRef.current) {
      window.clearInterval(videoFrameIntervalRef.current);
      videoFrameIntervalRef.current = null;
    }

    if (startupMicEnableTimerRef.current) {
      window.clearTimeout(startupMicEnableTimerRef.current);
      startupMicEnableTimerRef.current = null;
    }

    if (audioInputProcessorRef.current) {
      try {
        audioInputProcessorRef.current.disconnect();
      } catch (e) {}
      audioInputProcessorRef.current = null;
    }

    const activeSessions = [liveSessionRef.current, sessionRef.current].filter(Boolean);
    for (const activeSession of [...new Set(activeSessions)]) {
      try {
        activeSession.sendRealtimeInput?.({ audioStreamEnd: true });
      } catch (e) {}
      try {
        activeSession.close?.();
      } catch (e) {}
    }
    liveSessionRef.current = null;
    sessionRef.current = null;

    if (streamRef.current && !preserveMediaStream) {
      streamRef.current.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current && !preserveMediaStream) {
      videoRef.current.srcObject = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    nextStartTimeRef.current = 0;
    audioOutputQueueRef.current = [];
    isPlayingRef.current = false;
    isStartupGreetingRef.current = false;
    hasAudioInputStartedRef.current = false;
    setIsLiveConnected(false);
    setMicLevel(0);
    setIsAISpeaking(false);
    isCleaningUpRef.current = false;
  };

  const upsertTranscriptEntry = (
    speaker: ConsultationTranscriptEntry['speaker'],
    text: string,
    mode: 'append' | 'replace-last' = 'append'
  ) => {
    const cleaned = cleanAIText(text).trim();
    if (!cleaned) return;

    setConsultationTranscript((prev) => {
      if (mode === 'replace-last') {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i].speaker === speaker) {
            next[i] = { ...next[i], text: cleaned, createdAt: new Date().toISOString() };
            return next;
          }
        }
      }

      return [...prev, { speaker, text: cleaned, createdAt: new Date().toISOString() }];
    });
  };

  const buildArchiveSummary = () => {
    if (report?.trim()) return report.trim();
    const latestAiText = [...consultationTranscript].reverse().find((item) => item.speaker === 'ai' && item.text.trim());
    return latestAiText?.text?.trim() || undefined;
  };

  const ensureArchiveCase = async () => {
    if (consultationCaseId) return consultationCaseId;

    const firstPatientMessage =
      consultationTranscript.find((item) => item.speaker === 'patient' && item.text.trim())?.text ||
      messages.find((item) => item.role === 'user' && item.text.trim())?.text ||
      'AI consultation request';

    const created = await roleApi.patientCreateCase(`AI consultation request: ${firstPatientMessage.slice(0, 180)}`);
    setConsultationCaseId(created.id);
    return created.id as string;
  };

  const syncDraftToArchive = async () => {
    if (!canArchiveToPatientPortal) return null;

    const hasUsefulData =
      consultationTranscript.some((item) => item.speaker === 'patient' && item.text.trim()) ||
      consultationTranscript.some((item) => item.speaker === 'ai' && item.text.trim()) ||
      uploadedDocs.length > 0;

    if (!hasUsefulData) return null;

    const caseId = await ensureArchiveCase();
    const saved = await roleApi.patientSaveConsultationDraft(caseId, {
      transcript: consultationTranscript,
      uploadedDocs,
      aiSummary: buildArchiveSummary()
    });

    if (saved?.aiSummary) {
      setReport(saved.aiSummary);
    }

    return { caseId, saved };
  };

  const sendLiveTextTurn = (session: any, text: string) => {
    const cleaned = cleanAIText(text).trim();
    if (!cleaned || sessionEndedRef.current) return;

    if (typeof session?.sendRealtimeInput === 'function') {
      session.sendRealtimeInput({ text: cleaned });
      return;
    }

    if (typeof session?.sendClientContent === 'function') {
      session.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: cleaned }] }],
        turnComplete: true
      });
      return;
    }

    session?.sendRealtimeInput?.({ text: cleaned });
  };

  const sendLiveStartupGreeting = (session: any) => {
    if (sessionEndedRef.current) return;
    isStartupGreetingRef.current = true;
    sendLiveTextTurn(session, LIVE_STARTUP_GREETING_INSTRUCTION);
  };

  const enablePatientAudioInput = (session: any) => {
    if (sessionEndedRef.current || hasAudioInputStartedRef.current) return;
    hasAudioInputStartedRef.current = true;
    isStartupGreetingRef.current = false;
    setupAudioInput(session);
  };

  const startConsultation = async () => {
    if (isConnectingRef.current) return;

    // Stop old Live/audio nodes without throwing away an already granted camera/mic stream.
    if (liveSessionRef.current || sessionRef.current || audioInputProcessorRef.current || videoFrameIntervalRef.current || audioContextRef.current) {
      cleanupLive({ preserveMediaStream: true });
    }

    const connectionId = activeLiveConnectionIdRef.current + 1;
    activeLiveConnectionIdRef.current = connectionId;
    sessionEndedRef.current = false;
    isConnectingRef.current = true;
    setConnectionError(null);

    try {
      // 1. Create fresh Gemini instance
      const apiKey = getGeminiBrowserApiKey();
      if (!apiKey) {
        throw new Error('Gemini Live API key is not configured for the browser build.');
      }
      const ai = new GoogleGenAI({ apiKey });

      // 2. Use existing stream or request new one if missing
      let stream = streamRef.current;
      const hasLiveAudio = stream?.getAudioTracks().some((track) => track.readyState === 'live');
      const hasLiveVideo = stream?.getVideoTracks().some((track) => track.readyState === 'live');
      if (!stream || !hasLiveAudio || !hasLiveVideo) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        streamRef.current = stream;
      }

      // Validate audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error("No audio tracks found. Please check your microphone.");
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => undefined);
      }

      // 3. Setup Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      nextStartTimeRef.current = ctx.currentTime;

      const liveSystemInstruction = [
        LIVE_BASE_SYSTEM_INSTRUCTION,
        LIVE_AI_BEHAVIOR_INSTRUCTION
      ].join('\n');

      // 4. Connect Live API
      const sessionPromise = ai.live.connect({
        model: getGeminiLiveModel(),
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: liveSystemInstruction,
        },
        callbacks: {
          onopen: () => {
            if (activeLiveConnectionIdRef.current !== connectionId || sessionEndedRef.current) {
              sessionPromise.then((session) => session.close?.()).catch(() => undefined);
              return;
            }
            isLiveConnectedRef.current = true;
            setIsLiveConnected(true);
            isConnectingRef.current = false;
            sessionPromise.then(session => {
              if (activeLiveConnectionIdRef.current !== connectionId || sessionEndedRef.current) {
                session.close?.();
                return;
              }
              sessionRef.current = session;
              startVideoFrameStreaming(session);
              sendLiveStartupGreeting(session);
              startupMicEnableTimerRef.current = window.setTimeout(() => {
                if (activeLiveConnectionIdRef.current === connectionId && !sessionEndedRef.current) {
                  enablePatientAudioInput(session);
                }
              }, 7000);
            });
          },
          onmessage: (message: LiveServerMessage) => {
            if (activeLiveConnectionIdRef.current !== connectionId || sessionEndedRef.current) return;
            handleLiveMessage(message);
          },
          onclose: () => {
            if (activeLiveConnectionIdRef.current !== connectionId) return;
            isLiveConnectedRef.current = false;
            setIsLiveConnected(false);
            isConnectingRef.current = false;
            cleanupLive({ invalidateSession: false });
          },
          onerror: (err) => {
            if (activeLiveConnectionIdRef.current !== connectionId) return;
            console.error("Live API Error:", err);
            setConnectionError(isLiveConfigurationError(err) ? t('ai_consultation.room.liveConfigError') : t.ai_consultation.room.connectionError);
            isConnectingRef.current = false;
          }
        }
      });
      liveSessionRef.current = await sessionPromise;

    } catch (err) {
      console.error("Consultation start error:", err);
      setConnectionError(isLiveConfigurationError(err) ? t('ai_consultation.room.liveConfigError') : t.ai_consultation.room.accessDenied);
      isConnectingRef.current = false;
    }
  };

  const startVideoFrameStreaming = (session: any) => {
    if (videoFrameIntervalRef.current) {
      window.clearInterval(videoFrameIntervalRef.current);
    }

    const canvas = document.createElement('canvas');
    canvas.width = LIVE_VIDEO_FRAME_WIDTH;
    canvas.height = LIVE_VIDEO_FRAME_HEIGHT;

    const sendVideoFrame = () => {
      const video = videoRef.current;
      const currentSession = sessionRef.current || liveSessionRef.current || session;
      if (sessionEndedRef.current) return;
      if (!video || !currentSession || !isLiveConnectedRef.current) return;
      if (video.readyState < 2) return;

      const hasEnabledVideo = streamRef.current?.getVideoTracks().some((track) => track.enabled && track.readyState === 'live');
      if (!hasEnabledVideo) return;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = canvas.toDataURL('image/jpeg', LIVE_VIDEO_FRAME_QUALITY).split(',')[1];
      if (!frame) return;

      try {
        currentSession.sendRealtimeInput({
          video: { data: frame, mimeType: 'image/jpeg' }
        });
      } catch (err) {
        console.error('Error sending video frame to Gemini:', err);
      }
    };

    const video = videoRef.current;
    if (video && video.readyState < 2) {
      video.addEventListener('loadeddata', sendVideoFrame, { once: true });
    }

    sendVideoFrame();
    videoFrameIntervalRef.current = window.setInterval(sendVideoFrame, LIVE_VIDEO_FRAME_INTERVAL_MS);
  };

  const setupAudioInput = (session: any) => {
    if (!audioContextRef.current || !streamRef.current) {
      console.error("Audio setup failed: context or stream missing", { ctx: !!audioContextRef.current, stream: !!streamRef.current });
      return;
    }

    const ctx = audioContextRef.current;

    // Ensure context is running
    const ensureRunning = async () => {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    };
    ensureRunning();

    const source = ctx.createMediaStreamSource(streamRef.current);

    // 1. Analyser for UI Visuals
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    source.connect(analyser);

    // Create a silent sink to keep the context alive
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0;
    analyser.connect(silentGain);
    silentGain.connect(ctx.destination);

    const updateMicLevel = () => {
      if (sessionEndedRef.current) {
        setMicLevel(0);
        return;
      }
      if (ctx.state === 'suspended') ctx.resume();

      if (!isMicOnRef.current) {
        setMicLevel(0);
        requestAnimationFrame(updateMicLevel);
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      setMicLevel(Math.min(1, (average / 128) * 2));
      requestAnimationFrame(updateMicLevel);
    };
    updateMicLevel();

    // 2. ScriptProcessor for Gemini Audio Streaming
    const processor = ctx.createScriptProcessor(LIVE_AUDIO_PROCESSOR_BUFFER_SIZE, 1, 1);
    audioInputProcessorRef.current = processor;
    // Prevent garbage collection
    (window as any)._geminiProcessor = processor;

    const sampleRate = ctx.sampleRate;
    processor.onaudioprocess = (e) => {
      const outputData = e.outputBuffer.getChannelData(0);
      outputData.fill(0);

      const currentSession = sessionRef.current || liveSessionRef.current;
      if (sessionEndedRef.current) return;
      if (!isMicOnRef.current || !isLiveConnectedRef.current || !currentSession) return;

      let inputData = e.inputBuffer.getChannelData(0);

      if (sampleRate !== 16000) {
        const ratio = sampleRate / 16000;
        const newLength = Math.round(inputData.length / ratio);
        const resampledData = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
          const pos = i * ratio;
          const index = Math.floor(pos);
          const frac = pos - index;
          if (index + 1 < inputData.length) {
            resampledData[i] = inputData[index] * (1 - frac) + inputData[index + 1] * frac;
          } else {
            resampledData[i] = inputData[index];
          }
        }
        inputData = resampledData;
      }

      let rmsTotal = 0;
      for (let i = 0; i < inputData.length; i++) {
        rmsTotal += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(rmsTotal / Math.max(inputData.length, 1));
      if (rms > LIVE_BARGE_IN_RMS_THRESHOLD) {
        stopAssistantAudioForUserSpeech();
      }

      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      const bytes = new Uint8Array(pcmData.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

      try {
        currentSession.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      } catch (err) {
        console.error("Error sending audio to Gemini:", err);
      }
    };

    source.connect(processor);
    processor.connect(ctx.destination);
  };

  const stopAssistantAudioForUserSpeech = () => {
    const now = Date.now();
    if (!isPlayingRef.current && audioOutputQueueRef.current.length === 0) return;
    if (now - lastUserSpeechInterruptAtRef.current < LIVE_BARGE_IN_DEBOUNCE_MS) return;
    lastUserSpeechInterruptAtRef.current = now;

    audioOutputQueueRef.current = [];
    activeAudioSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (error) {}
    });
    activeAudioSourcesRef.current = [];
    isPlayingRef.current = false;
    setIsAISpeaking(false);
    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    }
  };

  const handleLiveMessage = (message: LiveServerMessage) => {
    if (sessionEndedRef.current) return;
    // Audio Output - Process ALL audio parts in the message
    const audioParts = message.serverContent?.modelTurn?.parts?.filter(p => p.inlineData);
    if (audioParts && audioParts.length > 0) {
      audioParts.forEach(part => {
        if (part.inlineData?.data) {
          const binaryString = atob(part.inlineData.data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          // Ensure we only take full 16-bit samples
          const pcmData = new Int16Array(bytes.buffer, 0, Math.floor(len / 2));
          audioOutputQueueRef.current.push(new Int16Array(pcmData));
        }
      });
      if (!isPlayingRef.current) processAudioQueue();
    }

    // Gemini streams interim input transcription. Do not render it in chat:
    // partial hypotheses make the patient's spoken words look incorrect.
    const serverContent = message.serverContent as any;
    const inputTranscription =
      serverContent?.inputTranscription?.text ||
      serverContent?.inputAudioTranscription?.text ||
      serverContent?.inputTranscription?.transcript;
    if (inputTranscription) {
      upsertTranscriptEntry('patient', inputTranscription, 'replace-last');
    }

    // Model Output Transcription
    const modelTranscription =
      serverContent?.outputTranscription?.text ||
      serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
    if (modelTranscription) {
      updateAIChat(modelTranscription);
    }

    if (
      isStartupGreetingRef.current &&
      (serverContent?.generationComplete || serverContent?.turnComplete)
    ) {
      const currentSession = sessionRef.current || liveSessionRef.current;
      if (currentSession) {
        if (startupMicEnableTimerRef.current) {
          window.clearTimeout(startupMicEnableTimerRef.current);
          startupMicEnableTimerRef.current = null;
        }
        enablePatientAudioInput(currentSession);
      }
    }

    // Interruption
    if (message.serverContent?.interrupted) {
      stopAssistantAudioForUserSpeech();
    }
  };

  const updateAIChat = (text: string) => {
    const cleanedText = cleanAIText(text);
    if (!cleanedText.trim()) return;
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'ai') {
        return [...prev.slice(0, -1), { ...last, text: cleanAIText(last.text + cleanedText) }];
      }
      return [...prev, { role: 'ai', text: cleanedText }];
    });
    upsertTranscriptEntry('ai', cleanedText, 'replace-last');
  };

  const processAudioQueue = async () => {
    if (sessionEndedRef.current) {
      audioOutputQueueRef.current = [];
      isPlayingRef.current = false;
      setIsAISpeaking(false);
      return;
    }
    if (audioOutputQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      setIsAISpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsAISpeaking(true);

    const pcmData = audioOutputQueueRef.current.shift()!;
    // Gemini Live API outputs at 24000Hz. Playing at 16000Hz makes it sound "slowed down".
    const buffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 0x7FFF;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    activeAudioSourcesRef.current.push(source);

    const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);

    // Track duration and schedule next
    nextStartTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      activeAudioSourcesRef.current = activeAudioSourcesRef.current.filter((item) => item !== source);
      if (!sessionEndedRef.current) processAudioQueue();
    };
  };

  // Complex Query with Thinking Mode (gemini-3.1-pro-preview)
  const handleComplexQuery = async (query: string) => {
    if (!query.trim()) return;
    setIsAIThinking(true);
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    upsertTranscriptEntry('patient', query, 'append');
    setInputText('');
    try {
      const responsePrefix = `${t.ai_consultation.room.deepAnalysis}: `;
      setMessages(prev => [...prev, { role: 'ai', text: responsePrefix }]);
      const conversation = messages.slice(-10).map((m) => `${m.role}: ${m.text}`).join('\n');
      const result = cleanAIText(await advancedChatStream(
        `Consultation context:\n${conversation}\n\nPatient question: ${query}`,
        {
          systemInstruction: `${LIVE_BASE_SYSTEM_INSTRUCTION}\nReturn a deep medical-oriented review in clean Russian text without Markdown or asterisks.`,
          useSearch: false,
          onDelta: (_delta, fullText) => {
            setMessages(prev => {
              const next = [...prev];
              const target = (() => {
                for (let i = next.length - 1; i >= 0; i -= 1) {
                  if (next[i].role === 'ai') return i;
                }
                return -1;
              })();
              if (next[target]?.role === 'ai') {
                next[target] = { ...next[target], text: `${responsePrefix}${cleanAIText(fullText)}` };
              }
              return next;
            });
          }
        }
      ));
      setMessages(prev => {
        const next = [...prev];
        const target = (() => {
          for (let i = next.length - 1; i >= 0; i -= 1) {
            if (next[i].role === 'ai') return i;
          }
          return -1;
        })();
        if (next[target]?.role === 'ai') {
          next[target] = { ...next[target], text: `${responsePrefix}${result}` };
        }
        return next;
      });
      const currentSession = sessionRef.current || liveSessionRef.current;
      if (currentSession) {
        sendLiveTextTurn(currentSession, t.ai_consultation.room.deepAnalysisResult.replace('{result}', result));
      }
    } catch (err) {
      console.error("Thinking mode error:", err);
      setMessages(prev => [...prev, { role: 'system', text: t.ai_consultation.room.deepAnalysisError }]);
    } finally {
      setIsAIThinking(false);
    }
  };

  // Search Grounding (gemini-3-flash-preview)
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsAIThinking(true);
    setMessages(prev => [...prev, { role: 'user', text: `${t.common.search.replace('...', '')}: ${query}` }]);
    upsertTranscriptEntry('patient', query, 'append');
    setInputText('');
    try {
      const responsePrefix = `${t.ai_consultation.room.fastSearch}: `;
      setMessages(prev => [...prev, { role: 'ai', text: responsePrefix }]);
      const conversation = messages.slice(-10).map((m) => `${m.role}: ${m.text}`).join('\n');
      const result = cleanAIText(await advancedChatStream(
        `Consultation context:\n${conversation}\n\n${t.ai_consultation.room.searchPrompt.replace('{query}', query)}`,
        {
          systemInstruction: `${LIVE_BASE_SYSTEM_INSTRUCTION}\nReturn clean Russian text without Markdown or asterisks.`,
          useSearch: true,
          onDelta: (_delta, fullText) => {
            setMessages(prev => {
              const next = [...prev];
              const target = (() => {
                for (let i = next.length - 1; i >= 0; i -= 1) {
                  if (next[i].role === 'ai') return i;
                }
                return -1;
              })();
              if (next[target]?.role === 'ai') {
                next[target] = { ...next[target], text: `${responsePrefix}${cleanAIText(fullText)}` };
              }
              return next;
            });
          }
        }
      ));
      setMessages(prev => {
        const next = [...prev];
        const target = (() => {
          for (let i = next.length - 1; i >= 0; i -= 1) {
            if (next[i].role === 'ai') return i;
          }
          return -1;
        })();
        if (next[target]?.role === 'ai') {
          next[target] = { ...next[target], text: `${responsePrefix}${result}` };
        }
        return next;
      });
      const currentSession = sessionRef.current || liveSessionRef.current;
      if (currentSession) {
        sendLiveTextTurn(currentSession, t.ai_consultation.room.searchResult.replace('{result}', result));
      }
    } catch (err) {
      console.error("Search error:", err);
      setMessages(prev => [...prev, { role: 'system', text: t.ai_consultation.room.searchError }]);
    } finally {
      setIsAIThinking(false);
    }
  };

  // Image Analysis (gemini-3.1-pro-preview)
  const handleImageAnalysis = async (file: File) => {
    setIsAIThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiBrowserApiKey() });
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [{
          parts: [
            { inlineData: { data: base64, mimeType: file.type } },
            { text: t.ai_consultation.room.imageAnalysisPrompt }
          ]
        }]
      });

      const analysis = cleanAIText(response.text || t.ai_consultation.room.docAnalysisFail);
      setUploadedDocs(prev => [...prev, { name: file.name, analysis }]);

      const currentSession = sessionRef.current || liveSessionRef.current;
      if (currentSession) {
        sendLiveTextTurn(currentSession, t.ai_consultation.room.docAnalysisResult.replace('{name}', file.name).replace('{analysis}', analysis));
      }

      setMessages(prev => [...prev, { role: 'ai', text: `${t.ai_consultation.room.docAnalysis} ${file.name}: ${analysis}` }]);
      upsertTranscriptEntry('system', `Document: ${file.name}`, 'append');
      upsertTranscriptEntry('ai', `${t.ai_consultation.room.docAnalysis} ${file.name}: ${analysis}`, 'append');
    } catch (err) {
      console.error("Image analysis error:", err);
      setMessages(prev => [...prev, { role: 'system', text: t.ai_consultation.room.docAnalysisError }]);
      upsertTranscriptEntry('system', t.ai_consultation.room.docAnalysisError, 'append');
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleSendText = () => {
    const text = inputText.trim();
    if (!text) return;

    if (chatMode === 'thinking' || text.toLowerCase().includes(t.ai_consultation.room.deepAnalysisKeyword) || text.length > 200) {
      handleComplexQuery(text);
    } else if (chatMode === 'search' || text.toLowerCase().includes(t.ai_consultation.room.searchKeyword) || text.toLowerCase().includes(t.ai_consultation.room.searchKeyword2)) {
      handleSearch(text);
    } else {
      setMessages(prev => [...prev, { role: 'user', text }]);
      upsertTranscriptEntry('patient', text, 'append');
      setInputText('');
      const currentSession = sessionRef.current || liveSessionRef.current;
      if (currentSession) {
        sendLiveTextTurn(currentSession, text);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageAnalysis(file);
  };

  useEffect(() => {
    if (draftSyncTimerRef.current) {
      window.clearTimeout(draftSyncTimerRef.current);
      draftSyncTimerRef.current = null;
    }

    if (!canArchiveToPatientPortal || step !== 'consultation' || isFinalizingRef.current) {
      return;
    }

    const hasPatientData =
      consultationTranscript.some((item) => item.speaker === 'patient' && item.text.trim()) ||
      uploadedDocs.length > 0;
    if (!hasPatientData) {
      return;
    }

    const signature = JSON.stringify({
      transcript: consultationTranscript.map((item) => [item.speaker, item.text]),
      docs: uploadedDocs,
      summary: buildArchiveSummary()
    });

    if (signature === lastDraftSignatureRef.current) {
      return;
    }

    draftSyncTimerRef.current = window.setTimeout(() => {
      void syncDraftToArchive()
        .then(() => {
          lastDraftSignatureRef.current = signature;
        })
        .catch((error) => {
          console.error('AI consultation draft sync failed:', error);
        });
    }, 1200);

    return () => {
      if (draftSyncTimerRef.current) {
        window.clearTimeout(draftSyncTimerRef.current);
        draftSyncTimerRef.current = null;
      }
    };
  }, [canArchiveToPatientPortal, step, consultationTranscript, uploadedDocs, report]);

  const finishConsultation = async () => {
    if (isFinalizingRef.current) return;
    isFinalizingRef.current = true;
    sessionEndedRef.current = true;
    cleanupLive();

    try {
      if (canArchiveToPatientPortal) {
        const synced = await syncDraftToArchive();
        if (synced?.caseId) {
          const finalized = await roleApi.patientFinalizeAiConsultationReport(synced.caseId, {
            aiSummary: buildArchiveSummary()
          });
          setReport(finalized?.finalReport || finalized?.aiSummary || null);
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('AI consultation report is ready', {
              body: 'The final report has been saved to the medical archive.',
              icon: '/pwa-192.png'
            });
          }
          navigate('/archive', { replace: true });
          return;
        }
      }

      setStep('payment');
      navigate('/dashboard');
    } catch (error) {
      console.error('AI consultation finalize error:', error);
      setMessages(prev => [...prev, { role: 'system', text: 'Could not save the final report to the archive.' }]);
      setStep('payment');
      navigate('/dashboard');
    } finally {
      isFinalizingRef.current = false;
    }
  };

  const generateFinalReport = async () => {
    if ((messages.length < 3 && consultationTranscript.length < 3) || isGeneratingReport) return;
    setIsGeneratingReport(true);
    try {
      if (canArchiveToPatientPortal) {
        await syncDraftToArchive();
        return;
      }

      const ai = new GoogleGenAI({ apiKey: getGeminiBrowserApiKey() });
      const conversation = consultationTranscript.length
        ? consultationTranscript.map((m) => `${m.speaker}: ${m.text}`).join('\n')
        : messages.map(m => `${m.role}: ${m.text}`).join('\n');
      const docs = uploadedDocs.map(d => `Document ${d.name}: ${d.analysis}`).join('\n');

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [{
          role: "user",
          parts: [{ text: t.ai_consultation.room.reportPrompt.replace('{conversation}', conversation).replace('{docs}', docs) }]
        }],
        config: {
          systemInstruction: t.ai_consultation.room.reportSystemInstruction
        }
      });

      const result = cleanAIText(response.text || t.ai_consultation.room.reportFail);
      setReport(result);
      setMessages(prev => [...prev, { role: 'ai', text: `${t.ai_consultation.room.reportFormed}: ${result}` }]);
      upsertTranscriptEntry('ai', `${t.ai_consultation.room.reportFormed}: ${result}`, 'append');
    } catch (err) {
      console.error("Report generation error:", err);
      setMessages(prev => [...prev, { role: 'system', text: t.ai_consultation.room.reportError }]);
      upsertTranscriptEntry('system', t.ai_consultation.room.reportError, 'append');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handlePayment = () => {
    setIsAIThinking(true);

    // Initialize AudioContext on user gesture to avoid "suspended" state issues
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {
      console.error("Initial AudioContext setup failed:", e);
    }

    setTimeout(() => {
      setIsAIThinking(false);
      setIsReadyToStart(true);
    }, 1500);
  };

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {!isReadyToStart ? (
            <motion.div
              key="payment-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              {/* Benefits Section */}
              <div className="space-y-10 order-2 lg:order-1">
                <FadeIn direction="left">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t('ai_consultation.heroTag')}</span>
                    </div>
                    <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-white uppercase leading-none">
                      {t('ai_consultation.heroTitle').split('?')[0]} <span className="text-primary">{t('ai_consultation.heroTitle').split('?')[1] || '?'}</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-lg max-w-md">
                      {t('ai_consultation.heroDesc')}
                    </p>
                  </div>
                </FadeIn>

                <FadeInStagger>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        icon: <Zap className="w-6 h-6 text-amber-400" />,
                        title: t('ai_consultation.benefits.instant.title'),
                        desc: t('ai_consultation.benefits.instant.desc')
                      },
                      {
                        icon: <BrainCircuit className="w-6 h-6 text-primary" />,
                        title: t('ai_consultation.benefits.analysis.title'),
                        desc: t('ai_consultation.benefits.analysis.desc')
                      },
                      {
                        icon: <CheckCircle2 className="w-6 h-6 text-blue-400" />,
                        title: t('ai_consultation.benefits.confidential.title'),
                        desc: t('ai_consultation.benefits.confidential.desc')
                      },
                      {
                        icon: <FileText className="w-6 h-6 text-blue-400" />,
                        title: t('ai_consultation.benefits.report.title'),
                        desc: t('ai_consultation.benefits.report.desc')
                      }
                    ].map((benefit, i) => (
                      <FadeIn key={i}>
                        <motion.div
                          whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                          className="p-6 bg-white/5 rounded-[2rem] border border-white/10 transition-all group"
                        >
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {benefit.icon}
                          </div>
                          <h3 className="font-black text-sm uppercase tracking-tight text-white mb-2">{benefit.title}</h3>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed">{benefit.desc}</p>
                        </motion.div>
                      </FadeIn>
                    ))}
                  </div>
                </FadeInStagger>

                <FadeIn direction="up">
                  <div className="space-y-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{t('ai_consultation.whyChoose.title')}</h3>
                    <div className="space-y-4">
                      {[
                        { icon: <Clock className="w-5 h-5 text-primary" />, ...t('ai_consultation.whyChoose.p1') },
                        { icon: <MapPin className="w-5 h-5 text-blue-400" />, ...t('ai_consultation.whyChoose.p2') },
                        { icon: <Shield className="w-5 h-5 text-blue-400" />, ...t('ai_consultation.whyChoose.p3') },
                        { icon: <Video className="w-5 h-5 text-amber-400" />, ...t('ai_consultation.whyChoose.p4') }
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5"
                        >
                          <div className="mt-1">{item.icon}</div>
                          <div>
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{item.title}</h4>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </FadeIn>

                <FadeIn direction="up" delay={0.4}>
                  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-3xl border border-primary/10">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight leading-tight">
                      {t('ai_consultation.disclaimer')}
                    </p>
                  </div>
                </FadeIn>
              </div>

              {/* Payment Card */}
              <FadeIn direction="right" className="order-1 lg:order-2">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white rounded-[3.5rem] p-10 lg:p-14 space-y-10 shadow-[0_0_100px_rgba(13,71,161,0.2)] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>

                  <div className="text-center space-y-4 relative">
                    <motion.div
                      animate={{ rotate: [3, -3, 3] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto"
                    >
                      <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                    </motion.div>
                    <div className="space-y-1">
                      <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900">{t('ai_consultation.payment.title')}</h2>
                      <p className="text-slate-500 font-bold text-sm uppercase tracking-widest opacity-60">{t('ai_consultation.payment.subtitle')}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('ai_consultation.payment.tariff')}</span>
                        <p className="font-black text-slate-900 uppercase tracking-tight">{t('ai_consultation.payment.oneTime')}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('ai_consultation.payment.price')}</span>
                        <p className="text-3xl font-black text-primary">300 {t('ai_consultation.payment.currency')}</p>
                      </div>
                    </div>
                    <div className="h-px bg-slate-200 w-full opacity-50"></div>
                    <div className="flex items-center gap-3 text-blue-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('ai_consultation.payment.allFeatures')}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePayment}
                      className="w-full py-7 bg-[#f14635] text-white rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-2xl shadow-red-500/20 transition-all flex items-center justify-center gap-4 group"
                    >
                      <img src="https://kaspi.kz/img/kaspi_logo.png" className="w-8 h-8 invert brightness-0 group-hover:scale-110 transition-transform" alt="" />
                      {t('ai_consultation.payment.payKaspi')}
                    </motion.button>
                    <button onClick={() => navigate(-1)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 transition-colors">
                      {t('ai_consultation.payment.back')}
                    </button>
                  </div>

                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">{t.ai_consultation.room.safePayments}</p>
                </motion.div>
              </FadeIn>
            </motion.div>
          ) : (
            <motion.div
              key="start-screen"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mx-auto border-4 border-primary/30">
                <BrainCircuit className="w-16 h-16 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{t('ai_consultation.payment.completedTitle')}</h2>
                <p className="text-slate-400 font-medium">{t('ai_consultation.payment.completedDesc')}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  try {
                    // Force cleanup of any old context to start fresh
                    if (audioContextRef.current) {
                      await audioContextRef.current.close().catch(() => {});
                      audioContextRef.current = null;
                    }

                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    audioContextRef.current = new AudioContextClass();
                    await audioContextRef.current.resume();

                    // Pre-request stream
                    const stream = await navigator.mediaDevices.getUserMedia({
                      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                      audio: true
                    });
                    streamRef.current = stream;

                    if (!user) {
                      try {
                        consumeGuestAiRequest('ai-video');
                      } catch (error) {
                        stream.getTracks().forEach((track) => track.stop());
                        streamRef.current = null;
                        if (isGuestAiLimitError(error)) {
                          setConnectionError(guestAiLimitMessage);
                          return;
                        }
                        throw error;
                      }
                    }

                    sessionEndedRef.current = false;
                    setStep('consultation');
                  } catch (err) {
                    console.error("Failed to initialize media on click:", err);
                    alert(t('ai_consultation.room.mediaAccessError'));
                  }
                }}
                className="px-12 py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-primary/30"
              >
                {t('ai_consultation.payment.enterRoom')}
              </motion.button>
              {connectionError ? <p className="mx-auto max-w-md text-sm font-semibold leading-relaxed text-red-300">{connectionError}</p> : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-[100svh] lg:h-screen bg-slate-950 flex flex-col overflow-y-auto lg:overflow-hidden text-white">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <BrainCircuit className="w-6 h-6 md:w-7 md:h-7" />
          </motion.div>
          <div>
            <h1 className="text-sm md:text-xl font-black tracking-tighter uppercase">{t('ai_consultation.room.title')}</h1>
            <p className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isLiveConnected ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="break-words max-w-[120px] md:max-w-none">
                {isLiveConnected ? t('ai_consultation.room.connected') : connectionError || t('ai_consultation.room.connecting')}
              </span>
              {!isLiveConnected && !isConnectingRef.current && (
                <button
                  onClick={() => startConsultation()}
                  className="ml-1 px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[7px] md:text-[8px] transition-all"
                >
                  {t('ai_consultation.room.reconnect')}
                </button>
              )}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={finishConsultation}
          className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-visible lg:overflow-hidden relative">
        {/* Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-[calc(100svh-5rem)] lg:min-h-0 shrink-0">
          <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-1000 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
          {!isCameraOn && <div className="absolute inset-0 flex items-center justify-center bg-slate-900"><VideoOff className="w-12 md:w-20 h-12 md:h-20 text-slate-700" /></div>}

          {/* AI Avatar */}
          <FadeIn direction="right" className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
            <div className="w-32 h-44 md:w-48 md:h-64 bg-slate-900/80 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-4 md:p-6 space-y-2 md:space-y-4">
               <div className="relative">
                  <motion.div
                    animate={isAISpeaking ? { scale: [1, 1.1, 1], boxShadow: "0 0 20px rgba(13,71,161,0.5)" } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className={`w-16 h-16 md:w-24 md:h-24 bg-primary/20 rounded-full flex items-center justify-center transition-all duration-300`}
                  >
                     <BrainCircuit className={`w-8 h-8 md:w-12 md:h-12 text-primary transition-all ${isAISpeaking ? 'animate-pulse' : ''}`} />
                  </motion.div>
                  <AnimatePresence>
                    {isAISpeaking && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 md:gap-1"
                      >
                        {[...Array(4)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [3, 12, 3] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            className="w-0.5 md:w-1 bg-primary rounded-full"
                          ></motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
               <div className="text-center">
                  <p className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest">{t.ai_consultation.room.aiAssistant}</p>
                  <p className="text-[10px] md:text-xs font-bold text-white/80 mt-1">{isAISpeaking ? t.ai_consultation.room.aiSpeaking : t.ai_consultation.room.aiListening}</p>
               </div>
            </div>
          </FadeIn>

          {/* Controls */}
          <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-6 p-3 md:p-4 bg-white/10 backdrop-blur-2xl rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl z-20">
             <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-3 md:p-5 rounded-full transition-all ${isMicOn ? 'bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                >
                   {isMicOn ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6" />}
                </motion.button>
                {isMicOn && (
                  <div className="absolute -bottom-1 md:-bottom-2 left-1/2 -translate-x-1/2 w-full h-0.5 md:h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${Math.min(100, micLevel * 100)}%` }}
                      className="h-full bg-blue-400"
                    ></motion.div>
                  </div>
                )}
             </div>
             <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`p-3 md:p-5 rounded-full transition-all ${isCameraOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 text-white'}`}
             >
                {isCameraOn ? <Video className="w-5 h-5 md:w-6 md:h-6" /> : <VideoOff className="w-5 h-5 md:w-6 md:h-6" />}
             </motion.button>
             <div className="w-px h-8 md:h-10 bg-white/10 mx-1 md:mx-2"></div>
             <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={finishConsultation}
              className="px-6 md:px-10 py-3 md:py-5 bg-red-500 text-white rounded-xl md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
             >
               {t('ai_consultation.room.finish')}
             </motion.button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[450px] bg-slate-900 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col overflow-hidden min-h-[70svh] lg:min-h-0 lg:h-auto">
           <div className="flex border-b border-white/10 shrink-0">
              <button className="flex-1 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-widest border-b-2 border-primary text-primary">{t('ai_consultation.room.chatTab')}</button>
              <button className="flex-1 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">{t('ai_consultation.room.docsTab')}</button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 no-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[90%] md:max-w-[85%] p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white/5 text-white border border-white/10 rounded-tl-none'}`}>
                      <p className="text-xs md:text-sm font-medium leading-relaxed">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isAIThinking && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-start"
                >
                   <div className="bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3">
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-primary animate-spin" />
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary">{t('ai_consultation.room.thinking')}</span>
                   </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
           </div>

           {/* Docs List */}
           <AnimatePresence>
             {uploadedDocs.length > 0 && (
               <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="px-4 md:px-6 py-3 md:py-4 bg-white/5 border-t border-white/10 space-y-2 md:space-y-3 shrink-0"
               >
                  <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('ai_consultation.room.docAnalysis')}</p>
                  <div className="space-y-2 max-h-32 md:max-h-40 overflow-y-auto no-scrollbar">
                     {uploadedDocs.map((doc, i) => (
                       <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="p-2 md:p-3 bg-white/10 rounded-lg md:rounded-xl space-y-1 md:space-y-2 border border-white/5"
                       >
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-bold text-primary">
                                <FileText className="w-3 h-3" /> {doc.name}
                             </div>
                          </div>
                          <p className="text-[8px] md:text-[10px] text-white/80 leading-relaxed">{doc.analysis}</p>
                       </motion.div>
                     ))}
                  </div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Input Area */}
           <div className="p-4 md:p-6 bg-slate-950/50 border-t border-white/10 space-y-3 md:space-y-4 shrink-0">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setChatMode('standard')}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[7px] md:text-[8px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 md:gap-2 whitespace-nowrap ${
                    chatMode === 'standard' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <MessageSquare className="w-2.5 h-2.5 md:w-3 md:h-3" /> {t('ai_consultation.room.chatTab')}
                </button>
                <button
                  onClick={() => setChatMode('thinking')}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[7px] md:text-[8px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 md:gap-2 whitespace-nowrap ${
                    chatMode === 'thinking' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <BrainCircuit className="w-2.5 h-2.5 md:w-3 md:h-3" /> {t('ai_consultation.room.deepAnalysis')}
                </button>
                <button
                  onClick={() => setChatMode('search')}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[7px] md:text-[8px] font-black uppercase tracking-widest border transition-all flex items-center gap-1.5 md:gap-2 whitespace-nowrap ${
                    chatMode === 'search' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <Search className="w-2.5 h-2.5 md:w-3 md:h-3" /> {t('ai_consultation.room.fastSearch')}
                </button>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                 <motion.button
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                   onClick={generateFinalReport}
                   disabled={isGeneratingReport || messages.length < 3}
                   className="p-3 md:p-4 bg-blue-500/10 text-blue-500 rounded-xl md:rounded-2xl hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                   title={t('ai_consultation.room.reportBtn')}
                 >
                    {isGeneratingReport ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <FileText className="w-4 h-4 md:w-5 md:h-5" />}
                 </motion.button>
                 <label className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-slate-400 cursor-pointer shrink-0">
                    <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                 </label>
                 <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                      placeholder={chatMode === 'thinking' ? t.ai_consultation.room.deepAnalysisPlaceholder : chatMode === 'search' ? t.ai_consultation.room.searchPlaceholder : t.ai_consultation.room.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none focus:border-primary transition-all font-medium text-xs md:text-sm"
                    />
                    <div className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 flex gap-1">
                       <button onClick={handleSendText} className="p-2 md:p-3 bg-primary text-white rounded-lg md:rounded-xl hover:bg-blue-800 transition-all">
                          <Send className="w-3 h-3 md:w-4 md:h-4" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIConsultationRoom;
