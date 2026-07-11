import React, { useRef, useState } from 'react';
import { UserRole, User } from '../types';
import {
  Activity,
  Archive,
  ArrowUpRight,
  Check,
  ChevronDown,
  FileText,
  LockKeyhole,
  MapPin,
  Mic,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Video,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import ComplianceFooter from '../components/ComplianceFooter';
import { useLanguage } from '../services/useLanguage';
import { startVoiceInput } from '../services/voiceInput';
import { roleApi } from '../../services/roleApi';
import HeroFlowCanvas from '../components/HeroFlowCanvas';
import TakhetJourneyScroll from '../components/TakhetJourneyScroll';
import { FadeIn } from '../components/FadeIn';

type LandingParallaxValues = {
  x: number;
  y: number;
};

type HeroActionPreview = {
  interfaceKind: 'guest-booking' | 'ai-video-room' | 'takhet-ai-chat' | 'ai-analysis-lab' | 'medical-archive';
  title: string;
  screenPreview: string;
  rows: string[];
  portalFrame?: boolean;
};

const createLandingParallaxValues = (): LandingParallaxValues => ({
  x: 0,
  y: 0,
});

const defaultHeroPlaceholders = [
  'болит горло и температура',
  'найти терапевта в Алматы',
  'разобрать анализ крови',
  'подготовиться к консультации',
];

const quickActions = [
  { label: 'Записаться на консультацию', icon: Stethoscope, path: '/guest-consultation' },
  { label: 'ИИ консультация', icon: Video, path: '/ai-consultation' },
  { label: 'Takhet AI', icon: Activity, path: '/takhet-ai' },
  { label: 'Разобрать анализы', icon: FileText, path: '/ai-lab' },
  { label: 'Мед архив', icon: Archive, path: '/archive' },
];

const manifestoCards = [
  {
    label: 'ЗАЧЕМ ЭТО ВСЕ',
    title: 'Симптомы легко найти, сложно понять.',
    text: 'Takhet+ связывает поиск, консультации, архив и AI-разбор в одну медицинскую экосистему.',
  },
  {
    label: 'РОЛЬ AI',
    title: 'AI готовит маршрут, врач принимает решение.',
    text: 'Система помогает собрать факты, подготовить вопросы и передать врачу понятный контекст.',
  },
  {
    label: 'РЕЗУЛЬТАТ',
    title: 'Один экран вместо десяти вкладок.',
    text: 'Жалобы, анализы, записи, рекомендации и история больше не распадаются между чатами и клиниками.',
  },
];

const beforeItems = [
  'Клиника на Достык, вт 9:40',
  'IMG_2481.jpg — анализ крови',
  'Заметка: спросить про дозировку',
  'Вкладка: «болит спина причины»',
  'Бумажная выписка, 2023',
  'Чат с подругой-врачом',
];

const afterItems = ['Жалоба', 'Анализы', 'Консультация', 'Архив', 'Takhet AI', 'Врач'];

const services = [
  {
    icon: Video,
    title: 'Онлайн-консультации врачей',
    text: 'Видео, аудио или чат с врачом. Пациент выбирает формат, специалист получает подготовленный кейс еще до начала встречи.',
    cta: 'Записаться',
    path: '/guest-consultation',
    tags: ['Видеоконсультация', 'Аудиозвонок', 'Медицинский чат'],
  },
  {
    icon: Activity,
    title: 'Takhet AI',
    text: 'Переводит жалобу в структурированный маршрут: что уточнить, какие данные приложить и к какому специалисту идти дальше.',
    cta: 'Запустить AI',
    path: '/takhet-ai/try',
    tags: ['Симптомы', 'Анализы', 'Маршрут'],
  },
  {
    icon: FileText,
    title: 'Разбор анализов',
    text: 'Загрузите PDF или фото, чтобы получить понятное объяснение показателей и список вопросов к врачу.',
    cta: 'Разобрать',
    path: '/ai-lab',
    tags: ['PDF', 'OCR', 'Объяснение'],
  },
  {
    icon: Archive,
    title: 'Медицинский архив',
    text: 'Анализы, заключения, назначения и консультации хранятся в одном месте и доступны перед новой встречей.',
    cta: 'Открыть архив',
    path: '/archive',
    tags: ['Документы', 'История', 'Контекст'],
  },
];

const testimonials = [
  {
    name: 'Emily Chen',
    age: '28 лет',
    image: '/media/testimonials/emily-david.webp',
    quote: 'Takhet помог мне легко получить помощь профильного специалиста без поездок и отгулов.',
    note: 'Я наконец чувствую, что контролирую здоровье и спокойнее планирую следующие шаги.',
  },
  {
    name: 'David Kim',
    age: '32 года',
    image: '/media/testimonials/david-kim.webp',
    quote: 'Я получил ответы быстрее и избежал лишних визитов в клинику.',
    note: 'Это помогло сфокусироваться на работе и семье, а не на поиске правильного кабинета.',
  },
  {
    name: 'Sophia Williams',
    age: '35 лет',
    image: '/media/testimonials/sophia-williams.webp',
    quote: 'Takhet связал меня с нужными врачами именно тогда, когда они были нужны.',
    note: 'Поддержка и follow-up дали спокойствие и реальные результаты.',
  },
  {
    name: 'Isabella Martinez',
    age: '31 год',
    image: '/media/testimonials/isabella-martinez.webp',
    quote: 'Раньше я тонула в медицинских документах семьи. Теперь все собрано в одном месте.',
    note: 'Маршрут стал проще, а подготовка к врачу занимает минуты.',
  },
  {
    name: 'James Patel',
    age: '29 лет',
    image: '/media/testimonials/james-patel.webp',
    quote: 'Takhet помог заметить проблему раньше, и это изменило мой подход к здоровью.',
    note: 'Я активнее, спокойнее и понимаю, что делать дальше.',
  },
];

const cities = ['Актау', 'Атырау', 'Актобе', 'Костанай', 'Астана', 'Павлодар', 'Усть-Каменогорск', 'Караганда', 'Кызылорда', 'Шымкент', 'Тараз', 'Алматы'];

const stats = [
  ['0+', 'обращений через Takhet+'],
  ['0+', 'врачей на платформе'],
  ['0 мин', 'среднее время ответа врача'],
  ['24/7', 'доступ к Takhet AI'],
];

const daySteps = [
  ['09:00', 'Появился вопрос', 'Описали симптомы в строке поиска с телефона, за пару минут.'],
  ['09:05', 'Takhet AI разобрал', 'Готов маршрут: что уточнить, какие анализы приложить, к какому врачу идти.'],
  ['12:30', 'Консультация онлайн', 'Врач видит подготовленный кейс и быстрее переходит к сути.'],
  ['18:00', 'История сохранена', 'Документы, рекомендации и следующий шаг остаются в архиве.'],
];

const archiveDocs = [
  ['Анализ_крови.pdf', 'март 2022'],
  ['Флюорография.jpg', 'август 2022'],
  ['МРТ_позвоночника.dcm', 'май 2023'],
  ['Рецепт_терапевта.pdf', 'январь 2024'],
  ['Кардиограмма.pdf', 'сентябрь 2025'],
  ['Заключение_ЛОР.pdf', 'июнь 2026'],
];

const manifestoWords = 'Takhet+ не заменяет врача. Он убирает хаос до встречи: собирает жалобу, документы, анализы и вопросы в один маршрут, чтобы пациент быстрее понял следующий шаг, а врач увидел подготовленный контекст.'.split(' ');

const principleRoadCards = [
  {
    title: 'Собрать факты',
    text: 'Симптомы, фото, анализы и прежние назначения больше не распадаются между чатами и файлами.',
    x: -32,
    z: -240,
    rot: -10,
  },
  {
    title: 'Понять следующий шаг',
    text: 'AI помогает сформулировать вопрос, объяснить документы и подготовить маршрут к врачу.',
    x: 28,
    z: -760,
    rot: 8,
  },
  {
    title: 'Сохранить историю',
    text: 'Каждая консультация и каждый документ остаются в профиле и помогают при следующем обращении.',
    x: -18,
    z: -1280,
    rot: -6,
  },
];

const corridorDocs = archiveDocs.map(([name, date], index) => ({
  name,
  date,
  cx: [-34, 24, -18, 32, -28, 18][index],
  cy: [-14, -8, 10, 16, -2, 22][index],
  cz: [-520, -900, -1260, -1660, -2040, -2420][index],
  rot: [-10, 8, -6, 9, -7, 5][index],
}));

const aiGravityWords = [
  ['температура', -34, -16],
  ['кашель', -15, 11],
  ['озноб', 8, -7],
  ['горло', 28, 14],
  ['слабость', -24, 7],
  ['третий день', 18, -12],
  ['38.2', 38, 4],
  ['что делать?', -4, 18],
];

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
  const landingShellRef = useRef<HTMLDivElement | null>(null);
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
  const translatedHeroPlaceholders = tArray<string>('landing.heroPlaceholders');
  const currentHeroPlaceholders = translatedHeroPlaceholders.length ? translatedHeroPlaceholders : defaultHeroPlaceholders;
  const heroPlaceholdersKey = currentHeroPlaceholders.join('\u0001');
  const guestPreviewDays = React.useMemo(() => {
    const formatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
    return Array.from({ length: 3 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index + 1);
      return `${formatter.format(date).replace('.', '')} 10:30`;
    });
  }, []);

  const actionPreviewByPath = React.useMemo<Record<string, HeroActionPreview>>(() => ({
    '/guest-consultation': {
      interfaceKind: 'guest-booking',
      title: 'Дата и время',
      screenPreview: 'guest doctor catalog',
      rows: ['SMS подтверждение', 'PDF один раз', ...guestPreviewDays],
    },
    '/ai-consultation': {
      interfaceKind: 'ai-video-room',
      title: 'Видео-консультация',
      screenPreview: 'live camera consultation room',
      rows: ['Камера', 'Микрофон', 'AI врач видит и слышит пациента'],
    },
    '/takhet-ai': {
      interfaceKind: 'takhet-ai-chat',
      title: 'Takhet AI',
      screenPreview: 'chat assistant interface',
      rows: ['Медицинский режим', 'Mental режим', 'Маршрут'],
    },
    '/ai-lab': {
      interfaceKind: 'ai-analysis-lab',
      title: 'Лаборатория ИИ',
      screenPreview: 'analysis upload workspace',
      rows: ['PDF upload', 'OCR', 'AI summary'],
      portalFrame: true,
    },
    '/archive': {
      interfaceKind: 'medical-archive',
      title: 'Медицинский архив',
      screenPreview: 'patient archive workspace',
      rows: ['Кейсы', 'PDF', 'Контекст врачу'],
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
    let frame = 0;
    const updateScrollProgress = () => {
      frame = 0;
      const shell = landingShellRef.current;
      if (!shell) return;
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      shell.style.setProperty('--takhet-landing-progress', `${Math.min(1, Math.max(0, window.scrollY / scrollable))}`);
    };
    const scheduleScrollProgress = () => {
      if (!frame) frame = requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener('scroll', scheduleScrollProgress, { passive: true });
    window.addEventListener('resize', scheduleScrollProgress, { passive: true });
    updateScrollProgress();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleScrollProgress);
      window.removeEventListener('resize', scheduleScrollProgress);
    };
  }, []);

  React.useEffect(() => {
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const ease = (value: number) => value * value * (3 - 2 * value);
    const bounce = (value: number) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (value < 1 / d1) return n1 * value * value;
      if (value < 2 / d1) return n1 * (value -= 1.5 / d1) * value + 0.75;
      if (value < 2.5 / d1) return n1 * (value -= 2.25 / d1) * value + 0.9375;
      return n1 * (value -= 2.625 / d1) * value + 0.984375;
    };
    const progressOf = (section: HTMLElement | null, vh: number) => {
      if (!section) return 0;
      const distance = Math.max(1, section.offsetHeight - vh);
      return clamp(-section.getBoundingClientRect().top / distance);
    };

    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const hero = document.querySelector<HTMLElement>('[data-story-hero-wrap]');
      const heroContent = document.querySelector<HTMLElement>('[data-story-hero-content]');
      const manifest = document.querySelector<HTMLElement>('[data-story-manifest-wrap]');
      const principlesWrap = document.querySelector<HTMLElement>('[data-story-principles-wrap]');
      const principlesScene = document.querySelector<HTMLElement>('[data-story-principles-scene]');
      const testimonialsWrap = document.querySelector<HTMLElement>('[data-story-testimonials-wrap]');
      const testimonialsRing = document.querySelector<HTMLElement>('[data-story-testimonials-ring]');
      const corridorWrap = document.querySelector<HTMLElement>('[data-story-corridor-wrap]');
      const corridorScene = document.querySelector<HTMLElement>('[data-story-corridor-scene]');
      const corridorFill = document.querySelector<HTMLElement>('[data-story-corridor-fill]');
      const corridorCaption = document.querySelector<HTMLElement>('[data-story-corridor-caption]');
      const aiWrap = document.querySelector<HTMLElement>('[data-story-ai-wrap]');
      const aiInput = document.querySelector<HTMLElement>('[data-story-ai-input]');
      const aiText = document.querySelector<HTMLElement>('[data-story-ai-text]');
      const aiPlaceholder = document.querySelector<HTMLElement>('[data-story-ai-placeholder]');
      const aiBubble = document.querySelector<HTMLElement>('[data-story-ai-bubble]');
      const aiAnswer = document.querySelector<HTMLElement>('[data-story-ai-answer]');

      const heroProgress = progressOf(hero, vh);
      if (hero && heroContent) {
        hero.style.setProperty('--story-hero-progress', heroProgress.toFixed(3));
        heroContent.style.transform = `translate3d(0, ${(-heroProgress * 16).toFixed(1)}vh, 0) scale(${(1 - heroProgress * 0.08).toFixed(3)})`;
        heroContent.style.opacity = String(clamp(1 - heroProgress * 1.45));
      }

      const manifestProgress = progressOf(manifest, vh);
      document.querySelectorAll<HTMLElement>('[data-story-word]').forEach((word) => {
        const index = Number(word.dataset.storyWord || 0);
        const reveal = clamp((manifestProgress - 0.1 - index * 0.012) / 0.12);
        word.style.opacity = (0.14 + reveal * 0.86).toFixed(2);
        word.style.transform = `translateY(${((1 - reveal) * 18).toFixed(1)}px)`;
        word.style.filter = reveal < 0.98 ? `blur(${((1 - reveal) * 5).toFixed(1)}px)` : 'none';
      });

      const roadProgress = progressOf(principlesWrap, vh);
      if (principlesScene) {
        principlesScene.style.transform = `translate3d(0,0,${(roadProgress * 980).toFixed(1)}px) rotateX(${(62 - roadProgress * 18).toFixed(1)}deg)`;
      }
      document.querySelectorAll<HTMLElement>('[data-story-principle-card]').forEach((card) => {
        const index = Number(card.dataset.index || 0);
        const focus = clamp((roadProgress - index * 0.27) / 0.24);
        card.style.opacity = (0.24 + Math.sin(focus * Math.PI) * 0.76).toFixed(2);
        card.style.filter = focus > 0.08 && focus < 0.92 ? 'none' : 'blur(2px)';
      });

      const testimonialProgress = progressOf(testimonialsWrap, vh);
      const testimonialCards = Array.from(document.querySelectorAll<HTMLElement>('[data-story-testimonial-card]'));
      if (testimonialsRing && testimonialCards.length) {
        const radius = vw < 820 ? Math.max(340, vw * 0.64) : 660;
        const theta = testimonialProgress * 90 * (testimonialCards.length - 1);
        testimonialsRing.style.transform = `translateZ(-${radius}px) rotateX(-4deg) rotateY(${(-theta).toFixed(2)}deg)`;
        testimonialCards.forEach((card, index) => {
          const angle = index * 90;
          const relative = ((angle - theta + 540) % 360) - 180;
          const active = Math.abs(relative) < 48;
          card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
          card.style.opacity = active ? '1' : '0.28';
          card.style.filter = active ? 'none' : 'grayscale(.18) blur(.6px)';
        });
      }

      const corridorProgress = progressOf(corridorWrap, vh);
      if (corridorScene) {
        corridorScene.style.transform = `translateZ(${(corridorProgress * 2450).toFixed(1)}px)`;
      }
      document.querySelectorAll<HTMLElement>('[data-story-cordoc]').forEach((doc, index) => {
        const cx = Number(doc.dataset.cx || 0);
        const cy = Number(doc.dataset.cy || 0);
        const cz = Number(doc.dataset.cz || 0);
        const rot = Number(doc.dataset.rot || 0);
        const merge = ease(clamp((corridorProgress - 0.58) / 0.28));
        const slot = (index - 2.5) * 84;
        const x = (cx * (1 - merge)) + (slot / vw) * 100 * merge;
        const y = (cy * (1 - merge)) + (-2 * merge);
        const z = cz * (1 - merge);
        doc.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}vh, ${z.toFixed(1)}px) rotate(${(rot * (1 - merge)).toFixed(1)}deg)`;
        doc.style.opacity = String(clamp(0.2 + corridorProgress * 1.35));
      });
      if (corridorFill) corridorFill.style.transform = `scaleX(${clamp((corridorProgress - 0.66) / 0.28).toFixed(3)})`;
      if (corridorCaption) corridorCaption.style.opacity = corridorProgress > 0.91 ? '1' : '0';

      const aiProgress = progressOf(aiWrap, vh);
      let absorbed = 0;
      const inputRect = aiInput?.getBoundingClientRect();
      const targetX = inputRect ? inputRect.left + inputRect.width / 2 - vw / 2 : 0;
      const targetY = inputRect ? inputRect.top + inputRect.height / 2 - vh / 2 : vh * 0.18;
      document.querySelectorAll<HTMLElement>('[data-story-ai-word]').forEach((word, index) => {
        const bx = Number(word.dataset.bx || 0);
        const rot = Number(word.dataset.rot || 0);
        const fall = clamp((aiProgress - 0.04 - index * 0.045) / 0.34);
        const collect = ease(clamp((fall - 0.6) / 0.4));
        absorbed += collect;
        const bounced = bounce(clamp(fall / 0.6));
        const startX = bx * vw / 100;
        const startY = (-62 + (28 + index % 3 * 4) * bounced) * vh / 100;
        const x = startX + (targetX - startX) * collect;
        const y = startY + (targetY - startY) * collect - Math.sin(collect * Math.PI) * vh * 0.06;
        word.style.opacity = fall <= 0 ? '0' : collect > 0.84 ? String(clamp((1 - collect) / 0.16)) : '1';
        word.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(rot * (1 - collect)).toFixed(1)}deg) scale(${(1 - collect * 0.75).toFixed(3)})`;
      });
      const query = 'болит горло, температура 38.2, кашель третий день, слабость, озноб';
      const fraction = clamp(absorbed / Math.max(1, aiGravityWords.length));
      if (aiText) aiText.textContent = aiProgress > 0.61 ? '' : query.slice(0, Math.round(fraction * query.length));
      if (aiPlaceholder) aiPlaceholder.style.display = fraction > 0.02 ? 'none' : 'inline';
      if (aiBubble) aiBubble.style.opacity = clamp((aiProgress - 0.6) / 0.06).toFixed(2);
      if (aiAnswer) aiAnswer.style.opacity = clamp((aiProgress - 0.68) / 0.08).toFixed(2);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
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

  const writeLandingParallax = (element: HTMLElement, values: LandingParallaxValues) => {
    const { style } = element;
    style.setProperty('--takhet-parallax-soft-x', `${(values.x * 8).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-soft-y', `${(values.y * 6).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-medium-x', `${(values.x * 14).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-medium-y', `${(values.y * 10).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-deep-x', `${(values.x * 22).toFixed(2)}px`);
    style.setProperty('--takhet-parallax-deep-y', `${(values.y * 16).toFixed(2)}px`);
  };

  const animateLandingParallax = () => {
    const parallax = landingParallaxRef.current;
    const { element, current, target } = parallax;

    if (!element) {
      parallax.frame = 0;
      return;
    }

    const deltaX = target.x - current.x;
    const deltaY = target.y - current.y;
    current.x += deltaX * 0.1;
    current.y += deltaY * 0.1;
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
    const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
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
    const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
    element.style.setProperty('--takhet-magnetic-x', `${(x * 8).toFixed(2)}px`);
    element.style.setProperty('--takhet-magnetic-y', `${(y * 6).toFixed(2)}px`);
  };

  const handleLandingParallaxPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    setLandingParallaxTarget(event.currentTarget, {
      x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)),
      y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)),
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

  const handleCommonLogin = (pathname: string, role: UserRole = UserRole.PATIENT) => {
    navigate('/auth', { state: { role, from: { pathname }, forcePublicAuth: true } });
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
      },
    });
  };

  const handleQuickAction = (path: string) => {
    if (path === '/takhet-ai') {
      navigate('/takhet-ai/try');
      return;
    }

    if (path === '/doctors-search' && user?.role !== UserRole.PATIENT) {
      handleCommonLogin(path);
      return;
    }

    navigate(path);
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
      setFeedbackStatus('Не удалось отправить отзыв. Попробуйте еще раз.');
    } finally {
      setFeedbackSending(false);
    }
  };

  const renderHeroActionInterfacePreview = (preview: HeroActionPreview) => (
    <div
      className="takhet-story-hero-preview"
      data-hero-action-interface-preview={preview.interfaceKind}
      data-screen-preview={preview.screenPreview}
      data-portal-frame={preview.portalFrame ? 'true' : undefined}
    >
      <div className="takhet-story-hero-preview__chrome">
        <span />
        <span />
        <span />
      </div>
      <strong>{preview.title}</strong>
      <div>
        {preview.rows.map((row) => (
          <span key={row}>{row}</span>
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={landingShellRef}
      className="takhet-landing-shell takhet-story-page min-h-screen bg-[#f4f6fc] selection:bg-primary selection:text-white overflow-x-clip"
      onPointerMove={handleLandingParallaxPointerMove}
      onPointerLeave={handleLandingParallaxPointerLeave}
    >
      <div className="takhet-landing-progress" aria-hidden="true" />
      <PublicHeader activePath="/" />

      <section className="takhet-story-hero-wrap" data-story-hero-wrap data-takhet-flow-hero data-om-exportable-video-with-duration-secs="16">
        <div className="takhet-flow-hero takhet-story-hero">
          <HeroFlowCanvas searchRef={heroSearchRef} />
          <div className="takhet-flow-hero__veil" aria-hidden="true" />
          <div className="takhet-flow-hero__glow" aria-hidden="true" />
          <div className="takhet-story-hero__plus takhet-story-hero__plus--one" aria-hidden="true">+</div>
          <div className="takhet-story-hero__plus takhet-story-hero__plus--two" aria-hidden="true">+</div>

          <div className="takhet-flow-hero__content" data-story-hero-content>
          <main className="takhet-flow-hero__main">
            <div className="takhet-story-kicker">Цифровая медицинская платформа</div>
            <h1 className="takhet-flow-hero__title">
              <span className="takhet-flow-hero__word" aria-label="ТАКНЕТ+">
                {'ТАКНЕТ'.split('').map((letter, index) => (
                  <span
                    key={`${letter}-${index}`}
                    className="takhet-flow-hero__letter"
                    style={{ '--takhet-letter-index': index } as React.CSSProperties}
                    aria-hidden="true"
                  >
                    {letter}
                  </span>
                ))}
                <span className="takhet-flow-hero__letter takhet-flow-hero__letter--plus" style={{ '--takhet-letter-index': 6 } as React.CSSProperties} aria-hidden="true">+</span>
              </span>
            </h1>
            <p className="takhet-flow-hero__description">
              Takhet+ собирает жалобу, анализы, запись и консультацию в один медицинский маршрут. Пациент быстрее понимает следующий шаг, а врач получает подготовленный контекст до встречи.
            </p>

            <div ref={heroSearchRef} className="takhet-flow-search">
              <Search aria-hidden="true" />
              <input
                type="text"
                placeholder={typedHeroPlaceholder || currentHeroPlaceholders[0] || 'найти терапевта в Алматы'}
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
              {quickActions.map((action) => {
                const preview = actionPreviewByPath[action.path];
                const isOpen = activeHeroActionPreview === action.path;

                return (
                  <div
                    key={action.label}
                    className="takhet-story-hero-action"
                    onPointerEnter={() => setActiveHeroActionPreview(action.path)}
                    onPointerLeave={() => setActiveHeroActionPreview(null)}
                    onFocusCapture={() => setActiveHeroActionPreview(action.path)}
                    onBlurCapture={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setActiveHeroActionPreview(null);
                      }
                    }}
                  >
                    <button
                      onClick={() => handleQuickAction(action.path)}
                      data-takhet-magnetic-button
                      data-hero-action-hover-trigger={action.path}
                      className="takhet-flow-action"
                    >
                      <action.icon aria-hidden="true" />
                      {action.label}
                    </button>
                    {preview ? (
                      <div
                        className="takhet-story-hero-action__preview"
                        data-hero-action-hover-preview={action.path}
                        data-state={isOpen ? 'open' : 'closed'}
                      >
                        {renderHeroActionInterfacePreview(preview)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="takhet-flow-hero__scroll-hint" aria-hidden="true">
              <span />
              <small>scroll</small>
            </div>
          </main>
          </div>
        </div>
      </section>

      <section className="takhet-story-manifest-wrap" data-story-manifest-wrap data-screen-label="Манифест">
        <div className="takhet-story-manifest">
          <div className="takhet-story-manifest__label">Зачем это все</div>
          <h2>
            {manifestoWords.map((word, index) => (
              <span key={`${word}-${index}`} data-story-word={index}>
                {word}
              </span>
            ))}
          </h2>
          <div className="takhet-story-manifest__cards">
            {manifestoCards.map((card, index) => (
              <FadeIn key={card.title} delay={index * 0.08}>
                <article className="takhet-story-panel" data-takhet-tilt data-takhet-parallax="soft">
                  <span>{card.label}</span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="takhet-story-before-after" data-screen-label="До и после">
        <div className="takhet-story-section-head">
          <span>До и после</span>
          <h2>Один экран вместо десяти вкладок</h2>
        </div>
        <div className="takhet-story-compare">
          <article>
            <span>До</span>
            {beforeItems.map((item) => <p key={item}>{item}</p>)}
          </article>
          <article>
            <span>После</span>
            <div className="takhet-story-after-card">
              <strong>Takhet<span>+</span></strong>
              <div>
                {afterItems.map((item) => <em key={item}>{item}</em>)}
              </div>
            </div>
          </article>
        </div>
      </section>

      <TakhetJourneyScroll />

      <section className="takhet-story-principles-wrap" data-story-principles-wrap data-screen-label="Как помогает пациенту">
        <div className="takhet-story-principles">
          <div className="takhet-story-section-head">
            <span>Три принципа</span>
            <h2>Как Takhet+ помогает пациенту</h2>
          </div>
          <div className="takhet-story-principles__viewport">
            <div className="takhet-story-principles__scene" data-story-principles-scene>
              <svg className="takhet-story-principles__road" viewBox="0 0 640 1200" aria-hidden="true">
                <path d="M320 40 C 210 230 470 350 320 540 C 150 760 515 865 320 1160" />
              </svg>
              {principleRoadCards.map((principle, index) => (
                <article
                  key={principle.title}
                  className="takhet-story-principle"
                  data-story-principle-card
                  data-index={index}
                  style={{
                    '--story-card-x': `${principle.x}vw`,
                    '--story-card-z': `${principle.z}px`,
                    '--story-card-rot': `${principle.rot}deg`,
                  } as React.CSSProperties}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3>{principle.title}</h3>
                  <p>{principle.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="takhet-story-services" id="services" data-screen-label="Сервисы">
        <div className="takhet-story-section-head takhet-story-section-head--light">
          <span>Сервисы</span>
          <h2>Что уже можно сделать в Takhet+</h2>
        </div>
        <div className="takhet-story-services__grid">
          {services.map((service, index) => (
            <article key={service.title} className="takhet-story-service" data-takhet-tilt data-takhet-parallax="medium">
              <div className="takhet-story-service__top">
                <service.icon aria-hidden="true" />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <div className="takhet-story-tags">
                {service.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <button type="button" onClick={() => handleQuickAction(service.path)} data-takhet-magnetic-button>
                {service.cta}
                <ArrowUpRight aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="takhet-story-testimonials-wrap" id="stories" data-story-testimonials-wrap data-screen-label="Истории пользователей">
        <div className="takhet-story-testimonials">
          <div className="takhet-story-section-head">
            <span>Истории пользователей</span>
            <h2>Как единый медицинский маршрут помогает быстрее получать ответы</h2>
          </div>
          <div className="takhet-story-testimonials__viewport" aria-label="Отзывы пользователей">
            <div className="takhet-story-testimonials__ring" data-story-testimonials-ring>
              {testimonials.map((item, index) => (
                <article className="takhet-story-testimonial" key={item.name} data-story-testimonial-card data-index={index}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <h3>{item.name}</h3>
                    <span>{item.age}</span>
                    <p>{item.quote}</p>
                    <small>{item.note}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="takhet-story-map" data-screen-label="География покрытия">
        <div className="takhet-story-section-head">
          <span>Вся страна онлайн</span>
          <h2>Доступно из любого города</h2>
          <p>Онлайн-формат не зависит от расстояния: врачи и AI-разбор доступны везде, где есть интернет.</p>
        </div>
        <div className="takhet-story-map__cities">
          {cities.map((city) => (
            <span key={city}><MapPin aria-hidden="true" />{city}</span>
          ))}
        </div>
      </section>

      <section className="takhet-story-stats" data-screen-label="Цифры платформы">
        {stats.map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="takhet-story-day" data-screen-label="Один день с Takhet+">
        <div className="takhet-story-section-head">
          <span>Один день с Takhet+</span>
          <h2>Весь маршрут — за один день</h2>
        </div>
        <div className="takhet-story-day__timeline">
          {daySteps.map(([time, title, text]) => (
            <article key={time}>
              <span>{time}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="takhet-story-faq" id="questions" data-screen-label="Частые вопросы">
        <div className="takhet-story-section-head">
          <span>FAQ</span>
          <h2>Частые вопросы</h2>
        </div>
        <div className="takhet-story-faq__list">
          {faqItems.map((item, index) => (
            <article key={item.q} className={activeFaq === index ? 'is-open' : ''}>
              <button type="button" onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                <span>{item.q}</span>
                <ChevronDown aria-hidden="true" />
              </button>
              {activeFaq === index ? <p>{item.a}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="takhet-story-feedback" data-screen-label="Поделитесь опытом">
        <div>
          <span>Поделитесь опытом</span>
          <h2>Если вы уже пользовались платформой, оставьте короткий отзыв</h2>
          <p>{feedbackStatus || 'Отзыв появится в рабочем контуре платформы после обработки.'}</p>
        </div>
        <div className="takhet-story-feedback__form">
          <input value={feedbackName} onChange={(event) => setFeedbackName(event.target.value)} placeholder="Ваше имя" />
          <textarea value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} placeholder="Напишите отзыв" />
          <button type="button" onClick={() => void handleFeedbackSubmit()} disabled={feedbackSending} data-takhet-magnetic-button>
            {feedbackSending ? 'Отправка...' : 'Отправить отзыв'}
            <Send aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="takhet-story-corridor-wrap" data-story-corridor-wrap data-screen-label="Коридор документов">
        <div className="takhet-story-archive">
          <div className="takhet-story-section-head takhet-story-section-head--light">
            <span>Медархив</span>
            <h2>Хаос документов структурируется в одном месте</h2>
          </div>
          <div className="takhet-story-archive__viewport">
            <div className="takhet-story-archive__scene" data-story-corridor-scene>
              {corridorDocs.map((doc) => (
                <article
                  key={doc.name}
                  data-story-cordoc
                  data-cx={doc.cx}
                  data-cy={doc.cy}
                  data-cz={doc.cz}
                  data-rot={doc.rot}
                >
                  <FileText aria-hidden="true" />
                  <strong>{doc.name}</strong>
                  <span>{doc.date}</span>
                </article>
              ))}
            </div>
            <div className="takhet-story-archive__timeline" aria-hidden="true">
              <span data-story-corridor-fill />
            </div>
            <p className="takhet-story-archive__caption" data-story-corridor-caption>
              Документы, назначения и консультации сходятся в единую медицинскую историю.
            </p>
          </div>
        </div>
      </section>

      <section className="takhet-story-security" data-screen-label="Безопасность данных">
        <div className="takhet-story-section-head">
          <span>Сохранность данных</span>
          <h2>Ваши данные — под замком</h2>
          <p>Медицинская история — самое личное, что есть. Поэтому архив закрыт от всех, кроме вас.</p>
        </div>
        <div className="takhet-story-security__grid">
          {[
            ['Доступ к архиву — только у вас', LockKeyhole],
            ['Передача врачу — по вашему разрешению', ShieldCheck],
            ['Оплата — через 3D Secure', Check],
          ].map(([text, Icon]) => {
            const SecurityIcon = Icon as typeof Check;
            return (
              <article key={text as string}>
                <SecurityIcon aria-hidden="true" />
                <span>{text as string}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="takhet-story-marquee" data-screen-label="Лента функций">
        <div>
          <span>Поиск симптомов · Онлайн-консультации · Медархив · Takhet AI · Разбор анализов · Психологическая поддержка · Ветконсультации ·</span>
          <span>Поиск симптомов · Онлайн-консультации · Медархив · Takhet AI · Разбор анализов · Психологическая поддержка · Ветконсультации ·</span>
        </div>
      </section>

      <section className="takhet-story-ai-wrap" data-story-ai-wrap data-screen-label="Takhet AI отвечает">
        <div className="takhet-story-ai">
          <div className="takhet-story-section-head takhet-story-section-head--light">
            <span>Из слов — в маршрут</span>
            <h2>Просто скажите, что чувствуете</h2>
          </div>
          <div className="takhet-story-ai__gravity">
            {aiGravityWords.map(([label, bx, rot]) => (
              <span key={label} data-story-ai-word data-bx={bx} data-rot={rot}>
                {label}
              </span>
            ))}
          </div>
          <div className="takhet-story-ai__phone">
            <div className="takhet-story-ai__phone-top">
              <Sparkles aria-hidden="true" />
              <strong>Takhet AI</strong>
              <span>Медицинский режим</span>
            </div>
            <div className="takhet-story-ai__input" data-story-ai-input>
              <span data-story-ai-text />
              <em data-story-ai-placeholder>Опишите симптомы</em>
              <button type="button" data-takhet-magnetic-button aria-label="Отправить">
                <Send aria-hidden="true" />
              </button>
            </div>
            <div className="takhet-story-ai__bubble" data-story-ai-bubble>
              Запрос принят. Я соберу жалобу и подготовлю маршрут.
            </div>
            <div className="takhet-story-ai__answer" data-story-ai-answer>
              <p>Похоже, нужно уточнить длительность температуры, сопутствующие симптомы и подготовить вопросы терапевту.</p>
              <button type="button" onClick={() => navigate('/takhet-ai/try')} data-takhet-magnetic-button>Начать маршрут</button>
            </div>
          </div>
        </div>
      </section>

      <section className="takhet-story-final" data-screen-label="Финальный CTA">
        <h2>
          {'ТАКНЕТ'.split('').map((letter, index) => <span key={`${letter}-${index}`}>{letter}</span>)}
          <em>+</em>
        </h2>
        <p>Начните с вопроса или консультации.</p>
        <div>
          <button type="button" onClick={handleCTA} data-takhet-magnetic-button>Зарегистрироваться</button>
          <button type="button" onClick={() => navigate('/ai-consultation')} data-takhet-magnetic-button>Получить консультацию</button>
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
