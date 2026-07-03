import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

type JourneyStage = {
  number: string;
  title: string;
  lead: string;
  description: string;
  items: string[];
  mediaKind: 'image' | 'video';
  mediaSrc: string;
};

const JOURNEY_STAGES: JourneyStage[] = [
  {
    number: '01',
    title: 'Начните с вопроса',
    lead: 'Не обязательно знать, к какому врачу идти.',
    description:
      'Опишите симптомы, задайте вопрос или загрузите медицинские документы. Takhet+ становится отправной точкой вашего обращения.',
    items: ['Описание жалоб', 'Голосовой ввод', 'Загрузка документов', 'Фото анализов'],
    mediaKind: 'image',
    mediaSrc: '/media/journey/stage-01-tablet.webp'
  },
  {
    number: '02',
    title: 'Соберите свою медицинскую историю',
    lead: 'Вся информация находится в одном месте.',
    description:
      'Добавьте анализы, снимки, заключения, назначения и другие документы. История больше не теряется между клиниками.',
    items: ['Анализы', 'Заключения', 'Рецепты', 'Медицинские изображения'],
    mediaKind: 'image',
    mediaSrc: '/media/journey/stage-02-ai-mobile.webp'
  },
  {
    number: '03',
    title: 'Takhet AI подготовит маршрут',
    lead: 'AI помогает понять следующий шаг.',
    description:
      'Takhet AI анализирует предоставленную информацию, объясняет результаты исследований и помогает подготовиться к консультации.',
    items: ['Разбор анализов', 'Объяснение документов', 'Подготовка вопросов врачу', 'Подбор специалиста'],
    mediaKind: 'image',
    mediaSrc: '/media/journey/stage-03-doctor-search.webp'
  },
  {
    number: '04',
    title: 'Получите медицинскую помощь',
    lead: 'Консультация проходит быстрее и эффективнее.',
    description:
      'Выберите онлайн-консультацию или очный прием. Врач получает уже подготовленный контекст и медицинскую историю.',
    items: ['Онлайн-консультация', 'Запись в клинику', 'Второе мнение', 'Медицинский чат'],
    mediaKind: 'image',
    mediaSrc: '/media/journey/stage-04-mobile-menu.webp'
  },
  {
    number: '05',
    title: 'История продолжает работать на вас',
    lead: 'Каждое обращение делает систему полезнее.',
    description:
      'Все документы, консультации, анализы и рекомендации автоматически сохраняются. При следующем обращении не нужно начинать заново.',
    items: ['Медицинский архив', 'История обращений', 'Динамика анализов', 'Единый профиль здоровья'],
    mediaKind: 'video',
    mediaSrc: '/media/journey/stage-05-continuity.mp4'
  }
];

const TakhetJourneyScroll: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scrollFrameRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const [activeStage, setActiveStage] = useState(0);
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);
  const [videoPlaybackBlocked, setVideoPlaybackBlocked] = useState(false);

  const playJourneyVideo = useCallback((restart = false) => {
    const video = videoRef.current;
    if (!video) return;

    if (restart || video.ended) video.currentTime = 0;
    const playAttempt = video.play();
    void playAttempt
      .then(() => setVideoPlaybackBlocked(false))
      .catch(() => setVideoPlaybackBlocked(true));
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = reducedMotion.matches;
    setReducedMotionEnabled(reducedMotion.matches);

    const updateFromScroll = () => {
      scrollFrameRef.current = 0;
      const section = sectionRef.current;
      if (!section || reducedMotionRef.current) return;

      const rect = section.getBoundingClientRect();
      const scrollDistance = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / scrollDistance));
      const nextStage = Math.min(JOURNEY_STAGES.length - 1, Math.floor(progress * JOURNEY_STAGES.length));
      setActiveStage((current) => (current === nextStage ? current : nextStage));
      section.style.setProperty('--takhet-journey-progress', progress.toFixed(4));
    };

    const scheduleScrollUpdate = () => {
      if (!scrollFrameRef.current) {
        scrollFrameRef.current = requestAnimationFrame(updateFromScroll);
      }
    };

    const syncReducedMotion = () => {
      reducedMotionRef.current = reducedMotion.matches;
      setReducedMotionEnabled(reducedMotion.matches);
      scheduleScrollUpdate();
    };

    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
    reducedMotion.addEventListener('change', syncReducedMotion);
    updateFromScroll();

    return () => {
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
      window.removeEventListener('scroll', scheduleScrollUpdate);
      window.removeEventListener('resize', scheduleScrollUpdate);
      reducedMotion.removeEventListener('change', syncReducedMotion);
    };
  }, []);

  useEffect(() => {
    if (activeStage === JOURNEY_STAGES.length - 1) {
      playJourneyVideo(true);
      return;
    }

    videoRef.current?.pause();
    setVideoPlaybackBlocked(false);
  }, [activeStage, playJourneyVideo]);

  const scrollToStage = (stageIndex: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const sectionTop = window.scrollY + rect.top;
    const scrollDistance = Math.max(0, section.offsetHeight - window.innerHeight);
    const stageProgress = stageIndex / Math.max(1, JOURNEY_STAGES.length - 1);
    window.scrollTo({
      top: sectionTop + scrollDistance * stageProgress,
      behavior: reducedMotionRef.current ? 'auto' : 'smooth'
    });
  };

  return (
    <section ref={sectionRef} className="takhet-journey" aria-labelledby="takhet-journey-title">
      <div className="takhet-journey__sticky">
        <div className="takhet-journey__media-stack" aria-hidden="true">
          {JOURNEY_STAGES.map((stage, index) => (
            <div
              key={stage.number}
              className={`takhet-journey__media ${activeStage === index ? 'is-active' : ''}`}
              data-media-kind={stage.mediaKind}
              data-media-slot={`journey-${stage.number}`}
            >
              {stage.mediaKind === 'image' ? (
                <img
                  src={stage.mediaSrc}
                  alt=""
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={stage.mediaSrc}
                  muted
                  playsInline
                  preload="auto"
                  onCanPlay={() => {
                    if (activeStage === JOURNEY_STAGES.length - 1 && videoRef.current?.paused) {
                      playJourneyVideo();
                    }
                  }}
                  onError={() => setVideoPlaybackBlocked(true)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="takhet-journey__frame">
          <h2 id="takhet-journey-title" className="takhet-journey__heading">
            Как Takhet+ сопровождает вас на каждом этапе
          </h2>

          <div className="takhet-journey__stage-stack" aria-live="polite">
            {JOURNEY_STAGES.map((stage, index) => (
              <article
                key={stage.number}
                className={`takhet-journey__stage ${activeStage === index ? 'is-active' : ''}`}
                aria-hidden={reducedMotionEnabled ? undefined : activeStage !== index}
              >
                <p className="takhet-journey__number">{stage.number}</p>
                <h3 className="takhet-journey__title">{stage.title}</h3>
                <p className="takhet-journey__lead">{stage.lead}</p>
                <p className="takhet-journey__description">{stage.description}</p>
                <ul className="takhet-journey__items">
                  {stage.items.map((item, itemIndex) => (
                    <li key={item} style={{ '--takhet-item-index': itemIndex } as React.CSSProperties}>
                      {item}
                    </li>
                  ))}
                </ul>
                {stage.mediaKind === 'video' && (
                  <video
                    className="takhet-journey__reduced-video"
                    src={stage.mediaSrc}
                    muted
                    playsInline
                    controls
                    preload="metadata"
                    aria-label="Видео о непрерывной истории здоровья"
                  />
                )}
              </article>
            ))}
          </div>

          <nav className="takhet-journey__rail" aria-label="Этапы медицинского маршрута">
            {JOURNEY_STAGES.map((stage, index) => (
              <button
                key={stage.number}
                type="button"
                className={`takhet-journey__nav-button ${activeStage === index ? 'is-active' : ''}`}
                aria-current={activeStage === index ? 'step' : undefined}
                onClick={() => scrollToStage(index)}
              >
                <span>{stage.title}</span>
                <strong>{stage.number}</strong>
              </button>
            ))}
          </nav>

          <p className="takhet-journey__progress" aria-hidden="true">
            <span>{String(activeStage + 1).padStart(2, '0')}</span>
            <span>/</span>
            <span>{String(JOURNEY_STAGES.length).padStart(2, '0')}</span>
          </p>

          {activeStage === JOURNEY_STAGES.length - 1 && videoPlaybackBlocked && (
            <button
              type="button"
              className="takhet-journey__video-play"
              onClick={() => playJourneyVideo(videoRef.current?.ended ?? false)}
              aria-label="Запустить видео"
              title="Запустить видео"
            >
              <Play aria-hidden="true" fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default TakhetJourneyScroll;
