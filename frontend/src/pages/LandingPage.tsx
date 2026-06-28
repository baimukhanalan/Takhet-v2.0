import React, { useRef, useState } from 'react';
import { UserRole, User } from '../types';
import {
  ChevronRight,
  Video, Truck, Archive, Stethoscope,
  ChevronDown, Send, MessageSquare, Info, Activity, Dog, ArrowUpRight, Plus, Users, HeartPulse, Clock, ShieldAlert, AlertTriangle, Check,
  Search, FileText, Camera, Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import ComplianceFooter from '../components/ComplianceFooter';
import { useLanguage } from '../services/useLanguage';
import { FadeIn, FadeInStagger } from '../components/FadeIn';
import { startVoiceInput } from '../services/voiceInput';
import { roleApi } from '../../services/roleApi';
import HeroFlowCanvas from '../components/HeroFlowCanvas';
import TakhetJourneyScroll from '../components/TakhetJourneyScroll';

type LandingParallaxValues = {
  x: number;
  y: number;
};

const createLandingParallaxValues = (): LandingParallaxValues => ({
  x: 0,
  y: 0,
});

type HeroActionPreview = {
  interfaceKind: 'guest-booking' | 'ai-video-room' | 'takhet-ai-chat' | 'ai-analysis-lab' | 'medical-archive';
  eyebrow: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  windowTitle: string;
  screenPreview: string;
  previewRows: Array<{
    title: string;
    meta: string;
    value: string;
  }>;
  chips: string[];
  footerLeft: string;
  footerRight: string;
  portalFrame?: boolean;
};

const LandingPage: React.FC<{ user?: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { t, tArray } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [heroQuery, setHeroQuery] = useState('');
  const [typedHeroPlaceholder, setTypedHeroPlaceholder] = useState('');
  const [heroPlaceholderIndex, setHeroPlaceholderIndex] = useState(0);
  const [isHeroVoiceListening, setIsHeroVoiceListening] = useState(false);
  const [activeHeroActionPreview, setActiveHeroActionPreview] = useState<string | null>(null);
  const heroSearchRef = useRef<HTMLDivElement | null>(null);
  const landingParallaxRef = useRef<{
    element: HTMLElement | null;
    frame: number;
    current: LandingParallaxValues;
    target: LandingParallaxValues;
  }>({
    element: null,
    frame: 0,
    current: createLandingParallaxValues(),
    target: createLandingParallaxValues(),
  });
  const activeTiltElementRef = useRef<HTMLElement | null>(null);
  const activeMagneticButtonRef = useRef<HTMLElement | null>(null);

  const faqItems = tArray<{ q: string; a: string }>('landing.faqItems');
  const heroPlaceholders = tArray<string>('landing.heroPlaceholders');
  const heroPlaceholdersKey = heroPlaceholders.join('\u0001');
  const guestPreviewDays = React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
    const slots = [['10:30', '12:00'], ['14:15', '16:45'], ['09:40', '18:10']];

    return Array.from({ length: 3 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index + 1);
      return {
        label: formatter.format(date).replace('.', ''),
        slots: slots[index]
      };
    });
  }, []);

  const actionPreviewByPath = React.useMemo<Record<string, HeroActionPreview>>(() => ({
    '/guest-consultation': {
      interfaceKind: 'guest-booking',
      eyebrow: 'Guest booking',
      title: 'Врач онлайн без аккаунта',
      icon: Stethoscope,
      windowTitle: 'Консультация без регистрации',
      screenPreview: 'guest doctor catalog',
      previewRows: [
        { title: 'Арман Сулейменов', meta: 'Терапевт • 12 лет', value: '14 000 ₸' },
        { title: 'Айдана Касымова', meta: 'Психолог • 8 лет', value: '12 000 ₸' },
      ],
      chips: guestPreviewDays.map((day) => `${day.label} ${day.slots[0]}`),
      footerLeft: 'SMS перед оплатой',
      footerRight: 'PDF один раз',
    },
    '/ai-consultation': {
      interfaceKind: 'ai-video-room',
      eyebrow: 'AI consultation',
      title: 'Видео-консультация',
      icon: Video,
      windowTitle: 'AI видео-комната',
      screenPreview: 'live camera consultation room',
      previewRows: [
        { title: 'Камера', meta: 'лицо, документы, упаковки', value: 'vision' },
        { title: 'Микрофон', meta: 'речь без перебивания', value: 'live' },
      ],
      chips: ['первые слова сразу', 'без ожидания формы', 'контекст врачу'],
      footerLeft: 'Streaming',
      footerRight: 'Передача врачу',
    },
    '/takhet-ai': {
      interfaceKind: 'takhet-ai-chat',
      eyebrow: 'Takhet AI',
      title: 'Медицинский навигатор',
      icon: Activity,
      windowTitle: 'Takhet AI',
      screenPreview: 'chat assistant interface',
      previewRows: [
        { title: 'Мед режим', meta: 'симптомы и маршрут', value: 'active' },
        { title: 'Mental режим', meta: 'стресс и поддержка', value: '24/7' },
      ],
      chips: ['мед режим', 'mental режим', 'гостевой доступ'],
      footerLeft: 'Без диагноза AI',
      footerRight: 'С маршрутом',
    },
    '/ai-lab': {
      interfaceKind: 'ai-analysis-lab',
      eyebrow: 'AI analysis',
      title: 'Лаборатория ИИ',
      icon: FileText,
      windowTitle: 'Лаборатория ИИ',
      screenPreview: 'analysis upload workspace',
      previewRows: [
        { title: 'ОАК.pdf', meta: 'Hb, WBC, PLT распознаны', value: '92%' },
        { title: 'Биохимия', meta: 'ALT, AST, глюкоза, ферритин', value: 'готово' },
      ],
      chips: ['PDF upload', 'OCR', 'AI summary'],
      footerLeft: 'Портал пациента',
      footerRight: 'После входа',
      portalFrame: true,
    },
    '/archive': {
      interfaceKind: 'medical-archive',
      eyebrow: 'Medical archive',
      title: 'Медицинский архив',
      icon: Archive,
      windowTitle: 'Медицинский архив',
      screenPreview: 'patient archive workspace',
      previewRows: [
        { title: 'Заключение врача', meta: 'PDF и рекомендации', value: 'новое' },
        { title: 'История консультаций', meta: 'Кейсы, анализы, файлы', value: '12' },
      ],
      chips: ['кейсы', 'PDF', 'контекст врачу'],
      footerLeft: 'Портал пациента',
      footerRight: 'После входа',
      portalFrame: true,
    },
  }), [guestPreviewDays]);

  React.useEffect(() => {
    return () => {
      if (landingParallaxRef.current.frame) {
        cancelAnimationFrame(landingParallaxRef.current.frame);
      }
    };
  }, []);

  React.useEffect(() => {
    const phrases = heroPlaceholdersKey.split('\u0001').filter(Boolean);
    if (!phrases.length) return;

    const phrase = phrases[heroPlaceholderIndex % phrases.length];
    let character = 0;
    let eraseTimer = 0;
    setTypedHeroPlaceholder('');

    const typeTimer = window.setInterval(() => {
      character += 1;
      setTypedHeroPlaceholder(phrase.slice(0, character));
      if (character >= phrase.length) {
        window.clearInterval(typeTimer);
        eraseTimer = window.setTimeout(() => {
          setHeroPlaceholderIndex((current) => (current + 1) % phrases.length);
        }, 1700);
      }
    }, 58);

    return () => {
      window.clearInterval(typeTimer);
      window.clearTimeout(eraseTimer);
    };
  }, [heroPlaceholderIndex, heroPlaceholdersKey]);

  const handleCommonLogin = (pathname: string, role: UserRole = UserRole.PATIENT) => {
    navigate('/auth', { state: { role, from: { pathname }, forcePublicAuth: true } });
  };

  const handleTakhetAiLogin = () => {
    navigate('/takhet-ai/try');
  };

  const handleCTA = () => {
    handleCommonLogin('/dashboard');
  };

  const openHealthBrowser = (value?: string) => {
    const normalized = (value ?? heroQuery).trim();
    if (!normalized) return;
    navigate(`/health-browser?q=${encodeURIComponent(normalized)}`);
  };

  const handleHeroVoiceInput = () => {
    startVoiceInput({
      onStart: () => setIsHeroVoiceListening(true),
      onEnd: () => setIsHeroVoiceListening(false),
      onResult: (text) => {
        setHeroQuery(text);
        openHealthBrowser(text);
      }
    });
  };

  const writeLandingParallax = (element: HTMLElement, values: LandingParallaxValues) => {
    const { style } = element;
    style.setProperty('--takhet-parallax-soft-x', `${(values.x * 8).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-soft-y', `${(values.y * 6).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-medium-x', `${(values.x * 14).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-medium-y', `${(values.y * 10).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-deep-x', `${(values.x * 22).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-deep-y', `${(values.y * 16).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-tilt-x', `${(-values.y * 1.1).toFixed(2)}deg`);
    style.setProperty('--takhet-parallax-tilt-y', `${(values.x * 1.35).toFixed(2)}deg`);
    style.setProperty('--takhet-parallax-medium-rotate', `${(values.x * 0.47).toFixed(2)}deg`);
    style.setProperty('--takhet-parallax-deep-rotate', `${(values.x * 0.74).toFixed(2)}deg`);
  };

  const resetTiltElement = (element: HTMLElement | null) => {
    if (!element) return;
    element.style.setProperty('--takhet-tilt-x', '0deg');
    element.style.setProperty('--takhet-tilt-y', '0deg');
    element.style.setProperty('--takhet-tilt-lift', '0px');
    element.style.setProperty('--takhet-tilt-glare-x', '50%');
    element.style.setProperty('--takhet-tilt-glare-y', '50%');
  };

  const resetMagneticButton = (element: HTMLElement | null) => {
    if (!element) return;
    element.style.setProperty('--takhet-magnetic-x', '0px');
    element.style.setProperty('--takhet-magnetic-y', '0px');
  };

  const updateTiltElement = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    const candidate = target?.closest('[data-takhet-tilt]');
    const element = candidate instanceof HTMLElement && event.currentTarget.contains(candidate)
      ? candidate
      : null;

    if (activeTiltElementRef.current && activeTiltElementRef.current !== element) {
      resetTiltElement(activeTiltElementRef.current);
    }

    activeTiltElementRef.current = element;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    const x = Math.max(-1, Math.min(1, normalizedX));
    const y = Math.max(-1, Math.min(1, normalizedY));

    element.style.setProperty('--takhet-tilt-x', `${(-y * 3.25).toFixed(2)}deg`);
    element.style.setProperty('--takhet-tilt-y', `${(x * 3.75).toFixed(2)}deg`);
    element.style.setProperty('--takhet-tilt-lift', '6px');
    element.style.setProperty('--takhet-tilt-glare-x', `${(50 + x * 16).toFixed(2)}%`);
    element.style.setProperty('--takhet-tilt-glare-y', `${(50 + y * 14).toFixed(2)}%`);
  };

  const updateMagneticButton = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    const candidate = target?.closest('[data-takhet-magnetic-button]');
    const element = candidate instanceof HTMLElement && event.currentTarget.contains(candidate)
      ? candidate
      : null;

    if (activeMagneticButtonRef.current && activeMagneticButtonRef.current !== element) {
      resetMagneticButton(activeMagneticButtonRef.current);
    }

    activeMagneticButtonRef.current = element;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    const x = Math.max(-1, Math.min(1, normalizedX));
    const y = Math.max(-1, Math.min(1, normalizedY));

    element.style.setProperty('--takhet-magnetic-x', `${(x * 8).toFixed(2)}px`);
    element.style.setProperty('--takhet-magnetic-y', `${(y * 6).toFixed(2)}px`);
  };

  const animateLandingParallax = () => {
    const parallax = landingParallaxRef.current;
    const { element, current, target } = parallax;

    if (!element) {
      parallax.frame = 0;
      return;
    }

    const ease = 0.1;
    const deltaX = target.x - current.x;
    const deltaY = target.y - current.y;
    current.x += deltaX * ease;
    current.y += deltaY * ease;

    writeLandingParallax(element, current);

    parallax.frame = Math.abs(deltaX) > 0.003 || Math.abs(deltaY) > 0.003
      ? requestAnimationFrame(animateLandingParallax)
      : 0;
  };

  const setLandingParallaxTarget = (element: HTMLElement, target: LandingParallaxValues) => {
    const parallax = landingParallaxRef.current;
    parallax.element = element;
    parallax.target = target;

    if (!parallax.frame) {
      parallax.frame = requestAnimationFrame(animateLandingParallax);
    }
  };

  const handleLandingParallaxPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;

    const { currentTarget, clientX, clientY } = event;
    const rect = currentTarget.getBoundingClientRect();
    const normalizedX = ((clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((clientY - rect.top) / rect.height - 0.5) * 2;

    setLandingParallaxTarget(currentTarget, {
      x: Math.max(-1, Math.min(1, normalizedX)),
      y: Math.max(-1, Math.min(1, normalizedY)),
    });
    updateTiltElement(event);
    updateMagneticButton(event);
  };

  const handleLandingParallaxPointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    setLandingParallaxTarget(event.currentTarget, createLandingParallaxValues());
    resetTiltElement(activeTiltElementRef.current);
    resetMagneticButton(activeMagneticButtonRef.current);
    activeTiltElementRef.current = null;
    activeMagneticButtonRef.current = null;
  };

  const handleQuickAction = (path: string) => {
    if (path === '/ai-consultation') {
      navigate('/ai-consultation');
      return;
    }

    if (path === '/takhet-ai') {
      handleTakhetAiLogin();
      return;
    }

    if (path.startsWith('/health-browser')) {
      navigate(path);
      return;
    }

    if (path === '/guest-consultation') {
      navigate('/guest-consultation');
      return;
    }

    if (path === '/doctors-search') {
      if (user?.role === UserRole.PATIENT) {
        navigate('/doctors-search');
      } else {
        handleCommonLogin(path);
      }
      return;
    }

    handleCommonLogin(path);
  };

  const renderHeroActionInterfacePreview = (preview: HeroActionPreview) => {
    const PreviewIcon = preview.icon;
    const isDark = preview.interfaceKind === 'ai-video-room' || preview.interfaceKind === 'takhet-ai-chat';
    const chromeClass = isDark
      ? 'border-white/10 bg-slate-950 text-white'
      : 'border-slate-100 bg-white text-slate-950';

    return (
      <div
        data-hero-action-interface-preview={preview.interfaceKind}
        data-screen-preview={preview.screenPreview}
        data-portal-frame={preview.portalFrame ? 'true' : undefined}
        className={`overflow-hidden rounded-[1.75rem] border shadow-inner ${chromeClass}`}
      >
        <div className={`flex items-center justify-between border-b px-3 py-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-300" />
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="h-2 w-2 rounded-full bg-primary/70" />
          </div>
          <p className={`text-[8px] font-black uppercase tracking-[0.22em] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{preview.windowTitle}</p>
          <PreviewIcon className={`h-3 w-3 ${isDark ? 'text-primary' : 'text-primary'}`} />
        </div>

        {preview.interfaceKind === 'guest-booking' ? (
          <div className="grid gap-3 bg-slate-50 p-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 shadow-sm">
              <Search className="h-3.5 w-3.5 text-primary" />
              Найти врача, цену и ближайшее время
            </div>
            <div className="grid grid-cols-[1.08fr_0.92fr] gap-2">
              <div className="space-y-2">
                {preview.previewRows.map((row, index) => (
                  <div key={row.title} className={`rounded-2xl bg-white p-3 shadow-sm ${index === 0 ? 'ring-2 ring-primary/20' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-[10px] font-black text-primary">
                        {row.title.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-black text-slate-950">{row.title}</p>
                        <p className="text-[8px] font-bold text-slate-400">{row.meta}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[9px] font-black text-primary">{row.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <p className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-400">Дата и время</p>
                <div className="mt-2 space-y-1.5">
                  {preview.chips.map((chip) => (
                    <div key={chip} className="rounded-xl bg-white/10 px-2.5 py-2 text-[9px] font-black text-white">
                      {chip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {preview.interfaceKind === 'ai-video-room' ? (
          <div className="grid grid-cols-[1.15fr_0.85fr] gap-3 bg-slate-950 p-3">
            <div className="relative min-h-36 overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10">
              <div className="absolute inset-3 rounded-2xl bg-gradient-to-br from-primary/25 via-slate-800 to-slate-950" />
              <div className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white">live</div>
              <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-black/30 p-2 text-[9px] font-bold text-white backdrop-blur">
                AI врач видит и слышит пациента
              </div>
            </div>
            <div className="space-y-2">
              {preview.previewRows.map((row) => (
                <div key={row.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white">{row.title}</p>
                  <p className="mt-1 text-[8px] font-bold text-slate-400">{row.meta}</p>
                  <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-primary">{row.value}</p>
                </div>
              ))}
              <div className="rounded-2xl bg-primary/15 p-3 text-[9px] font-black uppercase tracking-widest text-primary">Видео-консультация</div>
            </div>
          </div>
        ) : null}

        {preview.interfaceKind === 'takhet-ai-chat' ? (
          <div className="space-y-3 bg-slate-950 p-3">
            <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
              {preview.previewRows.map((row, index) => (
                <div key={row.title} className={`flex-1 rounded-xl px-2 py-2 text-center text-[8px] font-black uppercase tracking-widest ${index === 0 ? 'bg-white text-slate-950' : 'text-slate-400'}`}>
                  {row.title}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="max-w-[82%] rounded-2xl bg-white/10 p-3 text-[10px] font-bold text-slate-200">Что значит высокий ферритин?</div>
              <div className="ml-auto max-w-[88%] rounded-2xl bg-primary p-3 text-[10px] font-bold text-white">Сначала объясню простыми словами, затем дам план следующих шагов.</div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <span className="flex-1 text-[9px] font-bold text-slate-500">Сообщение Takhet AI...</span>
              <Send className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
        ) : null}

        {preview.interfaceKind === 'ai-analysis-lab' ? (
          <div className="grid grid-cols-[1fr_0.9fr] gap-3 bg-white p-3">
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                <FileText className="h-4 w-4" />
              </div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-900">Лаборатория ИИ</p>
              <p className="mt-1 text-[8px] font-bold text-slate-400">Загрузите анализы</p>
            </div>
            <div className="space-y-2">
              {preview.previewRows.map((row) => (
                <div key={row.title} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-2.5">
                  <p className="text-[9px] font-black text-slate-950">{row.title}</p>
                  <p className="mt-1 text-[8px] font-bold text-slate-500">{row.meta}</p>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-widest text-primary">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {preview.interfaceKind === 'medical-archive' ? (
          <div className="bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-950">Медицинский архив</p>
              <span className="rounded-xl bg-slate-900 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-white">PDF</span>
            </div>
            <div className="space-y-2">
              {preview.previewRows.map((row, index) => (
                <div key={row.title} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${index === 0 ? 'bg-blue-50 text-primary' : 'bg-white text-slate-400'}`}>
                    <Archive className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-black text-slate-950">{row.title}</p>
                    <p className="mt-1 text-[8px] font-bold text-slate-500">{row.meta}</p>
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-primary">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className={`flex items-center justify-between gap-3 border-t px-3 py-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-primary/5'}`}>
          <span className="text-[8px] font-black uppercase tracking-widest text-primary">{preview.footerLeft}</span>
          <span className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{preview.footerRight}</span>
        </div>
      </div>
    );
  };

  const handleFeedbackSubmit = async () => {
    const name = feedbackName.trim();
    const review = feedbackText.trim();
    if (!name || !review) {
      setFeedbackStatus('Заполните имя и текст отзыва.');
      return;
    }

    setFeedbackSending(true);
    setFeedbackStatus(null);
    try {
      await roleApi.publicFeedback({ name, review });
      setFeedbackName('');
      setFeedbackText('');
      setFeedbackStatus('Отзыв отправлен.');
    } catch {
      setFeedbackStatus('Не удалось отправить отзыв. Попробуйте ещё раз.');
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <div
      className="takhet-landing-shell min-h-screen bg-white selection:bg-primary selection:text-white overflow-x-clip"
      onPointerMove={handleLandingParallaxPointerMove}
      onPointerLeave={handleLandingParallaxPointerLeave}
    >
      <PublicHeader activePath="/" />

      <section className="takhet-flow-hero" data-takhet-flow-hero data-om-exportable-video-with-duration-secs="16">
        <HeroFlowCanvas searchRef={heroSearchRef} />
        <div className="takhet-flow-hero__veil" aria-hidden="true" />
        <div className="takhet-flow-hero__glow" aria-hidden="true" />

        <div className="takhet-flow-hero__content">
          <main className="takhet-flow-hero__main">
            <h1 className="takhet-flow-hero__title">
              <span>ТАКНЕТ<span className="takhet-flow-hero__plus">+</span></span>
            </h1>
            <p className="takhet-flow-hero__description">
              Takhet+ собирает жалобу, анализы, запись и консультацию в один медицинский маршрут. Пациент быстрее понимает следующий шаг, а врач получает подготовленный контекст до встречи.
            </p>

            <div ref={heroSearchRef} className="takhet-flow-search">
              <Search aria-hidden="true" />
              <input
                type="text"
                placeholder={typedHeroPlaceholder || heroPlaceholders[0] || 'найти терапевта в Алматы'}
                aria-label="Поиск по медицинским вопросам"
                value={heroQuery}
                onChange={(event) => setHeroQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') openHealthBrowser(event.currentTarget.value);
                }}
              />
              <button
                type="button"
                onClick={handleHeroVoiceInput}
                className={`takhet-flow-search__voice ${isHeroVoiceListening ? 'is-listening' : ''}`}
                aria-label="Голосовой ввод"
                title="Голосовой ввод"
              >
                <Mic aria-hidden="true" />
              </button>
              <button type="button" onClick={() => openHealthBrowser()} className="takhet-flow-search__submit" aria-label="Выполнить поиск">
                <ArrowUpRight aria-hidden="true" />
              </button>
            </div>

            <div className="takhet-flow-actions">
                {[
                  { label: 'Записаться на консультацию', icon: Stethoscope, path: '/guest-consultation' },
                  { label: 'ИИ консультация', icon: Video, path: '/ai-consultation' },
                  { label: 'Takhet AI', icon: Activity, path: '/takhet-ai' },
                  { label: 'Разобрать анализы', icon: FileText, path: '/ai-lab' },
                  { label: 'Мед архив', icon: Archive, path: '/archive' },
                ].map((action, i) => {
                  const preview = actionPreviewByPath[action.path];
                  const isPreviewOpen = activeHeroActionPreview === action.path;

                  return (
                    <div
                      key={i}
                      className={preview ? 'relative inline-flex group' : 'inline-flex'}
                      onPointerEnter={preview ? () => setActiveHeroActionPreview(action.path) : undefined}
                      onPointerLeave={preview ? () => setActiveHeroActionPreview(null) : undefined}
                      onFocusCapture={preview ? () => setActiveHeroActionPreview(action.path) : undefined}
                      onBlurCapture={preview ? (event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                          setActiveHeroActionPreview(null);
                        }
                      } : undefined}
                    >
                      <button
                        onClick={() => handleQuickAction(action.path)}
                        data-takhet-magnetic-button
                        data-hero-action-hover-trigger={preview ? action.path : undefined}
                        className="takhet-flow-action"
                      >
                        <action.icon aria-hidden="true" />
                        {action.label}
                      </button>

                      {preview ? (
                        <div
                          data-hero-action-hover-preview={action.path}
                          data-hero-action-preview-state={isPreviewOpen ? 'open' : 'closed'}
                          data-hero-action-preview-mode={preview.portalFrame ? 'portal-frame' : preview.interfaceKind}
                          className={`pointer-events-none absolute bottom-full left-1/2 z-40 mb-4 hidden w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[2rem] border border-white/80 bg-white/95 p-2 text-left shadow-2xl shadow-slate-900/12 ring-1 ring-slate-900/5 backdrop-blur-xl transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 md:block ${
                            isPreviewOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.98] opacity-0'
                          }`}
                        >
                          {renderHeroActionInterfacePreview(preview)}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
          </main>
        </div>
      </section>

      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" data-takhet-parallax="soft"></div>
        <div className="max-w-7xl mx-auto space-y-20">
          <FadeIn direction="up">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-foreground">
                {t.landing.whyTitle}
              </h2>
              <div className="w-24 h-1.5 bg-primary mx-auto rounded-full"></div>
            </div>
          </FadeIn>

          <FadeInStagger>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {t.landing.whyCards.map((card: any, i: number) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="bg-white p-6 sm:p-8 md:p-12 h-full rounded-[2.5rem] md:rounded-[4rem] shadow-sm border border-slate-100 space-y-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] group relative overflow-hidden" data-takhet-parallax={i % 2 === 0 ? 'soft' : 'medium'} data-takhet-tilt>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" data-takhet-parallax="deep"></div>
                    <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors relative z-10">{card.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed relative z-10">{card.desc}</p>

                    {card.items && (
                      <ul className="space-y-4 font-bold text-slate-700 relative z-10">
                        {card.items.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs shrink-0 mt-1">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {card.grid && (
                      <div className="grid grid-cols-1 gap-4 font-bold text-slate-800 relative z-10">
                        {card.grid.map((item: string, idx: number) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-primary/20 hover:scale-[1.05] hover:translate-x-1 transition-all duration-300 cursor-default">
                            {item}
                          </div>
                        ))}
                      </div>
                    )}

                    {card.footer && (
                      <p className="text-primary font-black text-sm uppercase tracking-widest pt-4 relative z-10">{card.footer}</p>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeInStagger>
        </div>
      </section>

      <TakhetJourneyScroll />

      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-white relative">
        <div className="max-w-7xl mx-auto space-y-24">
          <FadeIn direction="up">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-foreground">{t.landing.capabilitiesTitle}</h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <FadeIn direction="left">
              <div className="bg-slate-900 p-6 sm:p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white flex flex-col justify-between min-h-[360px] md:min-h-[400px] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl" data-takhet-parallax="medium" data-takhet-tilt>
                 <div className="space-y-8 relative z-10">
                    <div className="w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center transition-transform duration-500 hover:rotate-12">
                      <Video className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black mb-4 tracking-tight">{t.landing.capConsultation.title}</h3>
                      <p className="text-slate-400 font-medium leading-relaxed">{t.landing.capConsultation.desc}</p>
                    </div>
                 </div>
                 <button
                   onClick={handleCTA}
                   data-takhet-magnetic-button
                   className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest mt-10 hover:bg-primary hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                 >
                   {t.landing.capConsultation.btn}
                 </button>
                 <Video className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 group-hover:scale-125 group-hover:text-primary/10 transition-all duration-1000" data-takhet-parallax="deep" />
              </div>
            </FadeIn>

            <FadeIn direction="right">
              <div className="bg-slate-900 p-6 sm:p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white flex flex-col justify-between min-h-[360px] md:min-h-[400px] relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl border border-white/10" data-takhet-parallax="medium" data-takhet-tilt>
                 <div className="space-y-6 relative z-10">
                    <div className="w-20 h-20 bg-primary text-white rounded-[2.5rem] flex items-center justify-center transition-transform duration-500 shadow-lg shadow-primary/20 hover:scale-110 hover:rotate-[5deg]">
                      <Activity className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                        <Activity className="w-3 h-3" /> Маршрут
                      </div>
                      <h3 className="text-4xl font-black tracking-tight">Takhet AI</h3>
                    </div>
                    <p className="text-slate-400 font-medium leading-relaxed">Переводит жалобу в структурированный маршрут: что уточнить, какие данные приложить и к какому специалисту идти дальше.</p>
                    <div className="flex flex-wrap gap-2">
                      {['Симптомы', 'Анализы', 'Маршрут', 'Врачи'].map(tag => (
                        <span key={tag} className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold text-slate-300 border border-white/5">{tag}</span>
                      ))}
                    </div>
                 </div>
                 <button
                   onClick={handleTakhetAiLogin}
                   data-takhet-magnetic-button
                   className="w-full py-6 bg-primary text-white rounded-[2rem] font-black uppercase text-xs tracking-widest mt-10 hover:bg-white hover:text-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-primary/20"
                 >
                   Запустить Takhet AI
                 </button>
                 <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-1000" data-takhet-parallax="deep"></div>
              </div>
            </FadeIn>
          </div>

          <FadeInStagger>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {t.landing.capSecondary.map((f: any, i: number) => {
                const Icon = i === 0 ? Stethoscope : HeartPulse;
                return (
                  <FadeIn key={i} delay={i * 0.1}>
                    <div className="bg-slate-50 p-10 h-full rounded-[3.5rem] space-y-6 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-primary/10 transition-all duration-500 group" data-takhet-parallax={i % 2 === 0 ? 'soft' : 'medium'} data-takhet-tilt>
                      <Icon className="w-12 h-12 text-primary group-hover:scale-110 transition-transform duration-500" />
                      <h4 className="text-2xl font-black tracking-tight">{f.title}</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </FadeInStagger>
        </div>
      </section>

      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-slate-950 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <FadeIn direction="left">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-tight">{t.landing.archiveTitle}</h2>
                <p className="text-slate-400 text-xl font-medium leading-relaxed">{t.landing.archiveDesc}</p>
              </div>
              <button
                onClick={handleCTA}
                data-takhet-magnetic-button
                className="px-12 py-6 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all duration-300"
              >
                {t.landing.archiveBtn}
              </button>
            </div>
          </FadeIn>

          <FadeInStagger>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {t.landing.logistics.map((item: any, i: number) => {
                const Icon = i === 0 ? Truck : i === 1 ? HeartPulse : i === 2 ? Activity : Dog;
                return (
                  <FadeIn key={i} delay={i * 0.1}>
                    <div className="bg-white/5 backdrop-blur-xl p-10 h-full rounded-[3rem] border border-white/10 space-y-6 hover:bg-white/10 transition-all duration-500 group" data-takhet-parallax={i % 2 === 0 ? 'soft' : 'medium'} data-takhet-tilt>
                      <Icon className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                      <h4 className="text-xl font-black">{item.title}</h4>
                      <p className="text-slate-400 text-sm font-medium">{item.desc}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </FadeInStagger>
        </div>
      </section>

      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-white relative">
        <FadeIn direction="up">
          <div className="max-w-4xl mx-auto bg-slate-50 p-14 md:p-24 rounded-[5rem] border border-slate-100 space-y-12 shadow-sm hover:shadow-2xl hover:scale-[1.01] transition-all duration-700" data-takhet-parallax="soft" data-takhet-tilt>
             <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase text-center text-foreground leading-[1.1]">{t.landing.controlTitle}</h2>
             <p className="text-xl text-slate-500 font-medium text-center">{t.landing.controlSubtitle}</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {t.landing.controlItems.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 font-bold hover:border-primary/20 hover:translate-x-2 transition-all duration-300 cursor-default">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    {item}
                  </div>
                ))}
             </div>
          </div>
        </FadeIn>
      </section>

      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-primary/5">
        <div className="max-w-5xl mx-auto text-center space-y-12">
           <FadeIn direction="up">
             <div className="inline-block p-4 bg-white rounded-full shadow-xl mb-4">
                <Activity className="w-10 h-10 text-primary" />
             </div>
           </FadeIn>
           <FadeIn direction="up" delay={0.2}>
             <div className="bg-white p-12 md:p-20 rounded-[5rem] shadow-2xl border border-primary/10 relative overflow-hidden group" data-takhet-parallax="soft" data-takhet-tilt>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" data-takhet-parallax="medium"></div>
                <p className="text-3xl md:text-4xl lg:text-5xl text-slate-800 font-black leading-tight tracking-tighter relative z-10">
                  {t.landing.philosophy}
                </p>
             </div>
           </FadeIn>
        </div>
      </section>

      <section className="py-20 md:py-32 px-4 sm:px-6 md:px-10 xl:px-20 bg-white">
        <div className="max-w-4xl mx-auto space-y-20">
          <FadeIn direction="up">
            <div className="text-center">
               <h2 className="text-5xl font-black tracking-tighter uppercase">{t.landing.faqTitle}</h2>
            </div>
          </FadeIn>
          <div className="space-y-6">
             {faqItems.map((item, i) => (
               <FadeIn key={i} delay={i * 0.1}>
                 <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-500">
                   <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className={`w-full flex items-center justify-between p-10 text-left transition-all duration-500 ${activeFaq === i ? 'bg-primary text-white' : 'bg-white hover:bg-slate-50'}`}
                   >
                     <span className={`text-xl font-black ${activeFaq === i ? 'text-white' : 'text-slate-800'}`}>{item.q}</span>
                     <ChevronDown className={`w-7 h-7 transition-transform duration-500 ${activeFaq === i ? 'rotate-180 text-white' : 'text-primary'}`} />
                   </button>
                   {activeFaq === i && (
                     <div className="overflow-hidden">
                       <div className="p-10 pt-8 bg-slate-50 text-slate-600 text-lg font-medium leading-relaxed whitespace-pre-line">
                         {item.a}
                       </div>
                     </div>
                   )}
                 </div>
               </FadeIn>
             ))}
          </div>

          <FadeIn direction="up" delay={0.2}>
            <div className="rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 bg-slate-50 p-6 md:p-8 space-y-5">
              <div className="space-y-2 text-center">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Поделитесь опытом</h3>
                <p className="text-slate-500 font-medium text-sm md:text-base">Если вы уже пользовались платформой, оставьте короткий отзыв о консультации или сервисе.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[0.32fr_1fr] gap-3">
                <input
                  value={feedbackName}
                  onChange={(event) => setFeedbackName(event.target.value)}
                  placeholder="Ваше имя"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 outline-none font-bold text-slate-700"
                />
                <textarea
                  value={feedbackText}
                  onChange={(event) => setFeedbackText(event.target.value)}
                  placeholder="Напишите отзыв"
                  className="min-h-32 rounded-2xl border border-slate-200 bg-white px-5 py-4 outline-none font-medium text-slate-700 resize-y"
                />
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-sm font-bold text-slate-500">{feedbackStatus || 'Отзыв появится в рабочем контуре платформы после обработки.'}</div>
                <button
                  onClick={() => void handleFeedbackSubmit()}
                  disabled={feedbackSending}
                  data-takhet-magnetic-button
                  className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-60"
                >
                  {feedbackSending ? 'Отправка...' : 'Отправить отзыв'}
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-40 px-6 bg-slate-50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 opacity-30" data-takhet-parallax="soft"></div>
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <FadeIn direction="up">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground uppercase">Takhet<span className="text-primary">+</span></h2>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <p className="text-3xl md:text-4xl font-bold text-slate-400 italic">{t.landing.finalCtaTitle}</p>
          </FadeIn>
          <FadeIn direction="up" delay={0.4}>
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-10">
              <button
                onClick={handleCTA}
                data-takhet-magnetic-button
                className="px-16 py-8 bg-primary text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300"
              >
                {t.landing.finalCtaReg}
              </button>
              <button
                onClick={() => navigate('/ai-consultation')}
                data-takhet-magnetic-button
                className="px-16 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300"
              >
                {t.landing.finalCtaConsult}
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-slate-50 px-6 pb-8 text-center" aria-label={t.common.adminPortal}>
        <button
          type="button"
          data-admin-portal-entry
          onClick={() => navigate('/admin-auth')}
          className="inline-flex items-center justify-center rounded-full border border-slate-200/70 bg-white/70 px-5 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400 opacity-10 shadow-sm transition-opacity duration-500 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {t.common.adminPortal}
        </button>
      </section>

      <ComplianceFooter />
    </div>
  );
};

export default LandingPage;
