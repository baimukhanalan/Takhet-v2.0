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

type HeroWaveCameraValues = {
  shiftX: number;
  shiftY: number;
  tiltX: number;
  tiltY: number;
  roll: number;
  depth: number;
  focusX: number;
  focusY: number;
};

const createHeroWaveCameraValues = (): HeroWaveCameraValues => ({
  shiftX: 0,
  shiftY: 0,
  tiltX: 0,
  tiltY: 0,
  roll: 0,
  depth: 0,
  focusX: 50,
  focusY: 50,
});

type LandingParallaxValues = {
  x: number;
  y: number;
};

const createLandingParallaxValues = (): LandingParallaxValues => ({
  x: 0,
  y: 0,
});

const LandingPage: React.FC<{ user?: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { t, tArray } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [heroQuery, setHeroQuery] = useState('');
  const [isHeroVoiceListening, setIsHeroVoiceListening] = useState(false);
  const heroWaveCameraRef = useRef<{
    element: HTMLElement | null;
    frame: number;
    current: HeroWaveCameraValues;
    target: HeroWaveCameraValues;
  }>({
    element: null,
    frame: 0,
    current: createHeroWaveCameraValues(),
    target: createHeroWaveCameraValues(),
  });
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
  const customCursorRef = useRef<HTMLDivElement | null>(null);
  const activeTiltElementRef = useRef<HTMLElement | null>(null);
  const activeMagneticButtonRef = useRef<HTMLElement | null>(null);

  const faqItems = tArray<{ q: string; a: string }>('landing.faqItems');
  const placeholders = tArray<string>('landing.heroPlaceholders');

  React.useEffect(() => {
    const currentText = placeholders[placeholderIndex % Math.max(placeholders.length, 1)];
    if (!currentText) return;
    const typingSpeed = isDeleting ? 50 : 100;

    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentText.length) {
        setPlaceholder(currentText.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        setPlaceholder(currentText.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      } else if (!isDeleting && charIndex === currentText.length) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, placeholderIndex]);

  React.useEffect(() => {
    return () => {
      if (heroWaveCameraRef.current.frame) {
        cancelAnimationFrame(heroWaveCameraRef.current.frame);
      }
      if (landingParallaxRef.current.frame) {
        cancelAnimationFrame(landingParallaxRef.current.frame);
      }
    };
  }, []);

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

  const writeCustomCursorPosition = (clientX: number, clientY: number, opacity: number) => {
    const cursor = customCursorRef.current;
    if (!cursor) return;
    cursor.style.transform = `translate3d(${clientX.toFixed(2)}px, ${clientY.toFixed(2)}px, 0)`;
    cursor.style.opacity = opacity.toFixed(3);
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
    writeCustomCursorPosition(clientX, clientY, 1);
    updateTiltElement(event);
    updateMagneticButton(event);
  };

  const handleLandingParallaxPointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    setLandingParallaxTarget(event.currentTarget, createLandingParallaxValues());
    writeCustomCursorPosition(event.clientX, event.clientY, 0);
    resetTiltElement(activeTiltElementRef.current);
    resetMagneticButton(activeMagneticButtonRef.current);
    activeTiltElementRef.current = null;
    activeMagneticButtonRef.current = null;
  };

  const writeHeroWaveCamera = (element: HTMLElement, values: HeroWaveCameraValues) => {
    const { style } = element;
    style.setProperty('--takhet-wave-camera-shift-x', `${values.shiftX.toFixed(2)}px`);
    style.setProperty('--takhet-wave-camera-shift-y', `${values.shiftY.toFixed(2)}px`);
    style.setProperty('--takhet-wave-camera-tilt-x', `${values.tiltX.toFixed(2)}deg`);
    style.setProperty('--takhet-wave-camera-tilt-y', `${values.tiltY.toFixed(2)}deg`);
    style.setProperty('--takhet-wave-camera-roll', `${values.roll.toFixed(2)}deg`);
    style.setProperty('--takhet-wave-camera-depth', `${values.depth.toFixed(2)}px`);
    style.setProperty('--takhet-wave-camera-focus-x', `${values.focusX.toFixed(2)}%`);
    style.setProperty('--takhet-wave-camera-focus-y', `${values.focusY.toFixed(2)}%`);
  };

  const animateHeroWaveCamera = () => {
    const camera = heroWaveCameraRef.current;
    const { element, current, target } = camera;

    if (!element) {
      camera.frame = 0;
      return;
    }

    let shouldContinue = false;
    const ease = 0.12;

    (Object.keys(current) as Array<keyof HeroWaveCameraValues>).forEach((key) => {
      const delta = target[key] - current[key];
      current[key] += delta * ease;
      if (Math.abs(delta) > 0.02) {
        shouldContinue = true;
      }
    });

    writeHeroWaveCamera(element, current);
    camera.frame = shouldContinue ? requestAnimationFrame(animateHeroWaveCamera) : 0;
  };

  const setHeroWaveCameraTarget = (element: HTMLElement, target: HeroWaveCameraValues) => {
    const camera = heroWaveCameraRef.current;
    camera.element = element;
    camera.target = target;

    if (!camera.frame) {
      camera.frame = requestAnimationFrame(animateHeroWaveCamera);
    }
  };

  const handleHeroWavePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;

    const { currentTarget, clientX, clientY } = event;
    const rect = currentTarget.getBoundingClientRect();
    const normalizedX = ((clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((clientY - rect.top) / rect.height - 0.5) * 2;
    const x = Math.max(-1, Math.min(1, normalizedX));
    const y = Math.max(-1, Math.min(1, normalizedY));
    const distance = Math.min(1, Math.hypot(x, y));

    setHeroWaveCameraTarget(currentTarget, {
      shiftX: x * 46,
      shiftY: y * 28,
      tiltX: -y * 7,
      tiltY: x * 10,
      roll: x * 2.2,
      depth: distance * 38,
      focusX: 50 + x * 24,
      focusY: 50 + y * 20,
    });
  };

  const handleHeroWavePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    setHeroWaveCameraTarget(event.currentTarget, createHeroWaveCameraValues());
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
      className="takhet-landing-shell min-h-screen bg-white selection:bg-primary selection:text-white overflow-x-hidden"
      onPointerMove={handleLandingParallaxPointerMove}
      onPointerLeave={handleLandingParallaxPointerLeave}
    >
      <div ref={customCursorRef} className="takhet-custom-cursor" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <text
            x="50"
            y="69"
            textAnchor="middle"
            fill="#64B5F6"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: '72px'
            }}
          >
            +
          </text>
        </svg>
      </div>
      <PublicHeader activePath="/" />

      <section
        className="takhet-patient-hero relative min-h-[100svh] pt-24 md:pt-40 xl:pt-48 pb-16 md:pb-24 px-4 md:px-10 xl:px-20 overflow-hidden bg-white flex flex-col justify-center md:block"
        onPointerMove={handleHeroWavePointerMove}
        onPointerLeave={handleHeroWavePointerLeave}
      >
        <div className="takhet-hero-wave" aria-hidden="true">
          <div className="takhet-hero-wave__viewport">
            <div className="takhet-hero-wave__track">
              <svg
                className="takhet-hero-wave__svg"
                viewBox="0 0 1440 260"
                preserveAspectRatio="none"
                focusable="false"
              >
                <path
                  className="takhet-hero-wave__path takhet-hero-wave__path--one"
                  d="M -80 150 C 160 52 400 52 640 150 S 1120 248 1360 150 S 1840 52 2080 150"
                />
                <path
                  className="takhet-hero-wave__path takhet-hero-wave__path--two"
                  d="M -80 178 C 160 96 400 96 640 178 S 1120 260 1360 178 S 1840 96 2080 178"
                />
                <path
                  className="takhet-hero-wave__path takhet-hero-wave__path--three"
                  d="M -80 122 C 160 64 400 64 640 122 S 1120 180 1360 122 S 1840 64 2080 122"
                />
              </svg>
              <svg
                className="takhet-hero-wave__svg"
                viewBox="0 0 1440 260"
                preserveAspectRatio="none"
                focusable="false"
              >
                <path
                  className="takhet-hero-wave__path takhet-hero-wave__path--one"
                  d="M -80 150 C 160 52 400 52 640 150 S 1120 248 1360 150 S 1840 52 2080 150"
                />
                <path
                  className="takhet-hero-wave__path takhet-hero-wave__path--two"
                  d="M -80 178 C 160 96 400 96 640 178 S 1120 260 1360 178 S 1840 96 2080 178"
                />
                <path
                  className="takhet-hero-wave__path takhet-hero-wave__path--three"
                  d="M -80 122 C 160 64 400 64 640 122 S 1120 180 1360 122 S 1840 64 2080 122"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto text-center space-y-8 md:space-y-12 relative z-10 w-full">
          <FadeIn direction="up" delay={0.2}>
            <div className="space-y-4 md:space-y-6">
              <h1 className="takhet-patient-hero-title text-[40px] xs:text-[50px] sm:text-[80px] md:text-[110px] lg:text-[135px] font-black text-slate-900 tracking-tighter leading-[0.85] uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Takhet<span className="text-primary">+</span>
              </h1>
              <p className="takhet-patient-hero-text text-[13px] md:text-[18px] text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed px-4">
                Takhet+ собирает жалобу, анализы, запись и консультацию в один медицинский маршрут.
                <span className="hidden md:inline"> Пациент быстрее понимает следующий шаг, а врач получает подготовленный контекст до встречи.</span>
              </p>
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.4}>
            <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
              <div className="relative group px-2 md:px-0">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000"></div>
                <div className="takhet-patient-hero-search relative flex items-center bg-white border-2 border-slate-200 rounded-[1.5rem] md:rounded-[2.5rem] p-1 md:p-2 shadow-2xl shadow-slate-200/50 group-focus-within:border-primary transition-all duration-500">
                  <div className="pl-4 md:pl-6 pr-2 md:pr-4">
                    <Search className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                     type="text"
                     placeholder={placeholder}
                     value={heroQuery}
                     onChange={(event) => setHeroQuery(event.target.value)}
                     className="flex-1 py-4 md:py-6 bg-transparent border-none outline-none focus:ring-0 text-sm md:text-xl font-bold text-slate-900 placeholder:text-slate-300 min-w-0 pr-2"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         openHealthBrowser((e.target as HTMLInputElement).value);
                       }
                     }}
                   />
                   <button
                     type="button"
                     onClick={handleHeroVoiceInput}
                     data-takhet-magnetic-button
                     className={`p-3 md:p-4 rounded-[1.2rem] md:rounded-[2rem] transition-colors shrink-0 ${
                       isHeroVoiceListening ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 hover:text-primary'
                     }`}
                     title="Голосовой ввод"
                   >
                     <Mic className="w-5 h-5 md:w-6 md:h-6" />
                   </button>
                   <button
                     onClick={() => openHealthBrowser()}
                     data-takhet-magnetic-button
                     className="p-3 md:p-4 bg-primary text-white rounded-[1.2rem] md:rounded-[2rem] hover:scale-105 transition-transform shadow-lg shadow-primary/20 shrink-0"
                   >
                     <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-2 max-w-4xl mx-auto">
                {[
                  { label: 'Записаться на консультацию', icon: Stethoscope, path: '/guest-consultation' },
                  { label: 'ИИ консультация', icon: Video, path: '/ai-consultation' },
                  { label: 'Takhet AI', icon: Activity, path: '/takhet-ai' },
                  { label: 'Разобрать анализы', icon: FileText, path: '/ai-lab' },
                  { label: 'Мед архив', icon: Archive, path: '/archive' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.path)}
                    data-takhet-magnetic-button
                    className="takhet-patient-hero-action px-4 md:px-6 py-2 md:py-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-primary/20 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 whitespace-nowrap"
                  >
                    <action.icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-hidden" data-takhet-parallax="deep">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-soft"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-soft delay-1000"></div>
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
