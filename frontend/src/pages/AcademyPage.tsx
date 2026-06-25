import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BrainCircuit, ChevronRight, FileText, GraduationCap, Search, ShieldCheck, Stethoscope } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import { academyApi, AcademyArticle, AcademyArticleDetail, AcademyOverview } from '../services/academyApi';
import { User, UserRole } from '../types';

const fallbackOverview: AcademyOverview = {
  categories: [
    {
      slug: 'symptoms',
      title: 'Симптомы',
      description: 'Частые симптомы и безопасная навигация к врачу.',
      articleCount: 1
    },
    {
      slug: 'blood-tests',
      title: 'Анализы крови',
      description: 'Показатели, динамика и подготовка к консультации.',
      articleCount: 2
    },
    {
      slug: 'diagnostics',
      title: 'Диагностика',
      description: 'ЭКГ, ЭЭГ, УЗИ, МРТ и другие исследования.',
      articleCount: 2
    },
    {
      slug: 'prevention',
      title: 'Профилактика',
      description: 'Ранние сигналы риска и здоровые привычки.',
      articleCount: 1
    }
  ],
  featured: [
    {
      slug: 'headache-when-to-see-doctor',
      title: 'Головная боль: причины, симптомы и когда обращаться к врачу',
      summary: 'Краткая навигация по частым типам головной боли и тревожным признакам.',
      readMinutes: 4,
      views: 0,
      reviewStatus: 'medically_reviewed',
      publishedAt: new Date().toISOString(),
      categorySlug: 'symptoms',
      categoryTitle: 'Симптомы'
    }
  ],
  popular: [],
  latest: [],
  alphabet: ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Э'],
  stats: {
    articles: 6,
    categories: 4,
    reviewed: 1
  }
};

const AcademyPage: React.FC<{ user?: User; portal?: boolean }> = ({ user, portal = false }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [overview, setOverview] = useState<AcademyOverview>(fallbackOverview);
  const [results, setResults] = useState<AcademyArticle[]>(fallbackOverview.featured);
  const [activeArticle, setActiveArticle] = useState<AcademyArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    academyApi.overview()
      .then((data) => {
        if (!alive) return;
        setOverview(data);
        setResults(data.featured.length ? data.featured : data.latest);
        setError('');
      })
      .catch(() => {
        if (!alive) return;
        setOverview(fallbackOverview);
        setResults(fallbackOverview.featured);
        setError('Academy временно показывает сохраненную подборку. Данные обновятся автоматически.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearching(true);
      academyApi.search({ q: query.trim(), category: selectedCategory, letter: selectedLetter })
        .then((data) => {
          setResults(data.items);
          setError('');
          if (query.trim()) {
            void academyApi.trackEvent({ event: 'search', query: query.trim() }).catch(() => undefined);
          }
        })
        .catch(() => {
          const normalized = query.trim().toLowerCase();
          const localItems = [...overview.featured, ...overview.popular, ...overview.latest].filter((item) => {
            const matchesQuery = !normalized || `${item.title} ${item.summary}`.toLowerCase().includes(normalized);
            const matchesCategory = !selectedCategory || item.categorySlug === selectedCategory;
            const matchesLetter = !selectedLetter || item.title.toLowerCase().startsWith(selectedLetter.toLowerCase());
            return matchesQuery && matchesCategory && matchesLetter;
          });
          setResults(localItems);
          setError('Поиск работает в локальном режиме до восстановления соединения с API.');
        })
        .finally(() => setSearching(false));
    }, 240);

    return () => window.clearTimeout(timer);
  }, [query, selectedCategory, selectedLetter, overview]);

  const highlightArticles = useMemo(() => {
    const merged = [...overview.featured, ...overview.popular, ...overview.latest];
    const unique = new Map<string, AcademyArticle>();
    merged.forEach((item) => unique.set(item.slug, item));
    return Array.from(unique.values()).slice(0, 6);
  }, [overview]);

  const maxCategoryCount = Math.max(1, ...overview.categories.map((category) => Number(category.articleCount || 0)));
  const academyArticleBasePath = portal ? '/portal/academy' : '/academy';

  const handleAiAccess = () => {
    void academyApi.trackEvent({ event: 'ai_cta' }).catch(() => undefined);

    if (!user) {
      navigate('/auth', { state: { mode: 'login', from: { pathname: '/academy' }, forcePublicAuth: true } });
      return;
    }

    navigate(user.role === UserRole.DOCTOR ? '/takhet-ai/doctor' : '/takhet-ai/patient');
  };

  const handleConsultation = () => {
    void academyApi.trackEvent({ event: 'consultation_cta' }).catch(() => undefined);
    navigate(user ? '/doctors-search' : '/guest-consultation');
  };

  const handleCategory = (slug: string) => {
    const next = selectedCategory === slug ? '' : slug;
    setSelectedCategory(next);
    setSelectedLetter('');
    void academyApi.trackEvent({ event: 'category_click', target: slug }).catch(() => undefined);
  };

  const handleArticle = (article: AcademyArticle) => {
    academyApi
      .articleBySlug(article.slug)
      .then((detail) => {
        setActiveArticle(detail);
        navigate(`${academyArticleBasePath}/${article.slug}`);
        void academyApi.trackEvent({ event: 'open_article', target: article.slug }).catch(() => undefined);
      })
      .catch(() => {
        setActiveArticle({
          ...article,
          id: article.slug,
          body: article.summary,
          tags: []
        });
      });
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 selection:bg-primary selection:text-white">
      {!portal && <PublicHeader activePath="/academy" />}

      <section className={`${portal ? 'pt-4' : 'pt-28 sm:pt-32 md:pt-40'} px-4 pb-12 sm:px-6 lg:px-10 xl:px-20`}>
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
              <GraduationCap className="h-4 w-4" />
              Academy
            </div>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[0.92] tracking-tighter text-slate-950 sm:text-5xl md:text-7xl">
              Академия здоровья Takhet+
            </h1>
            <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-500 md:text-xl">
              Проверенная медицинская информация, симптомы, заболевания, анализы и исследования в формате живого справочника Takhet+.
            </p>

            <div className="mt-8 rounded-[2rem] border border-slate-100 bg-white p-3 shadow-2xl shadow-slate-200/70">
              <div className="flex items-center gap-3 rounded-[1.5rem] bg-slate-50 px-5 py-4">
                <Search className="h-5 w-5 text-primary" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Поиск по симптомам, заболеваниям, анализам и исследованиям"
                  className="w-full bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 md:text-base"
                />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {(results.length ? results : highlightArticles).slice(0, 4).map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion.slug}
                    onClick={() => handleArticle(suggestion)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-xs font-bold text-slate-500 transition-colors hover:bg-primary/5 hover:text-primary"
                  >
                    {suggestion.title}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="mt-4 text-sm font-bold text-amber-600">{error}</p>}
          </div>

          <div className="rounded-[3rem] border border-slate-100 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
            <div className="rounded-[2rem] bg-white/10 p-5">
              <ShieldCheck className="h-10 w-10 text-blue-200" />
              <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-blue-200">Медицинская навигация</p>
              <h2 className="mt-3 text-3xl font-black tracking-tighter">Сначала справочник. Потом AI и врач.</h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
                Academy помогает разобраться в теме. AI-инструменты открываются только после входа в аккаунт пациента или врача.
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              <button onClick={handleAiAccess} className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-950 transition-transform hover:-translate-y-0.5">
                {user ? 'Задать вопрос ИИ' : 'Войти и задать вопрос ИИ'}
                <BrainCircuit className="h-5 w-5 text-primary" />
              </button>
              <button onClick={handleConsultation} className="flex items-center justify-between rounded-2xl border border-white/10 px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/10">
                Онлайн-консультация
                <Stethoscope className="h-5 w-5 text-blue-200" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-10 xl:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Категории</p>
              <h2 className="mt-3 text-3xl font-black tracking-tighter md:text-5xl">Живые разделы Academy</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-7 text-slate-500">
              Разделы, поиск и подборки загружаются из базы. Если API временно недоступен, интерфейс остается рабочим с безопасной локальной подборкой.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.categories.map((category) => {
              const progress = Math.max(8, Math.round((Number(category.articleCount || 0) / maxCategoryCount) * 100));
              const selected = selectedCategory === category.slug;
              return (
                <article
                  key={category.slug}
                  onClick={() => handleCategory(category.slug)}
                  className={`cursor-pointer rounded-[1.75rem] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 ${
                    selected ? 'border-primary bg-primary text-white' : 'border-slate-100 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <BookOpen className={`h-6 w-6 ${selected ? 'text-white' : 'text-primary'}`} />
                  <h3 className="mt-4 text-base font-black tracking-tight">{category.title}</h3>
                  <p className={`mt-2 text-xs font-semibold leading-6 ${selected ? 'text-white/75' : 'text-slate-500'}`}>{category.description}</p>
                  <div className={`mt-5 h-2 overflow-hidden rounded-full ${selected ? 'bg-white/20' : 'bg-white'}`}>
                    <div className={`h-full rounded-full ${selected ? 'bg-white' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                  </div>
                  <p className={`mt-3 text-xs font-black uppercase tracking-[0.18em] ${selected ? 'text-white/80' : 'text-slate-400'}`}>
                    {category.articleCount || 0} материалов
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 sm:px-6 lg:px-10 xl:px-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.72fr]">
          <div className="rounded-[3rem] bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Результаты</p>
                <h2 className="mt-3 text-3xl font-black tracking-tighter">Материалы по вашему запросу</h2>
              </div>
              {searching && <span className="rounded-full bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary">Поиск...</span>}
            </div>
            <div className="mt-6 grid gap-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)
              ) : results.length ? (
                results.map((item) => (
                  <button key={item.slug} onClick={() => handleArticle(item)} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <h3 className="text-sm font-black leading-6 text-slate-800">{item.title}</h3>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {item.categoryTitle} · {item.readMinutes} мин · {item.reviewStatus === 'medically_reviewed' ? 'проверено' : 'черновик'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6">
                  <h3 className="text-lg font-black text-slate-900">Ничего не найдено</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Попробуйте другой симптом, анализ или раздел Academy.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-[3rem] bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Карточка материала</p>
            {activeArticle ? (
              <div className="mt-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{activeArticle.categoryTitle}</p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{activeArticle.title}</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">{activeArticle.body}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {activeArticle.tags.map((tag) => (
                    <span key={tag.slug} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">
                      {tag.title}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <h3 className="text-xl font-black tracking-tight text-slate-950">Выберите материал</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">Карточка откроется здесь без ухода со страницы. Для AI потребуется вход в аккаунт.</p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-10 xl:px-20">
        <div className="mx-auto max-w-7xl rounded-[3rem] border border-slate-100 bg-white p-6 shadow-sm md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Алфавитный справочник</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {overview.alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => {
                  setSelectedLetter(selectedLetter === letter ? '' : letter);
                  setSelectedCategory('');
                }}
                className={`h-11 w-11 rounded-2xl text-sm font-black transition-colors ${
                  selectedLetter === letter ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-primary hover:text-white'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-10 xl:px-20">
        <div className="mx-auto max-w-7xl rounded-[3rem] bg-slate-950 p-8 text-white md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">Следующий шаг</p>
              <h2 className="mt-4 text-3xl font-black tracking-tighter md:text-5xl">Изучили материал — переходите к действию.</h2>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-300">
                AI доступен только в аккаунте. Консультация и разбор анализов остаются частью медицинского маршрута Takhet+.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[28rem]">
              <button onClick={handleAiAccess} className="rounded-2xl bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-slate-950">
                {user ? 'Открыть AI' : 'Войти для AI'}
              </button>
              <button onClick={handleConsultation} className="rounded-2xl border border-white/15 px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-white">
                Консультация
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AcademyPage;
