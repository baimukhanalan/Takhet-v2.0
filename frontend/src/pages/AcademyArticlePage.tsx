import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, CalendarDays, Clock, ShieldCheck, Stethoscope } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import { academyApi, AcademyArticleDetail } from '../services/academyApi';
import { User, UserRole } from '../types';

const fallbackArticle = (slug: string): AcademyArticleDetail => ({
  id: slug,
  slug,
  title: 'Материал Academy',
  summary: 'Материал временно загружается из локальной подборки.',
  body: 'Если соединение с Academy API временно недоступно, вернитесь к списку материалов или задайте вопрос врачу. Only a qualified doctor can make a diagnosis.',
  readMinutes: 4,
  views: 0,
  reviewStatus: 'medically_reviewed',
  publishedAt: new Date().toISOString(),
  categorySlug: 'academy',
  categoryTitle: 'Academy',
  tags: []
});

export const useAcademyArticleSeo = (article: AcademyArticleDetail | null) => {
  useEffect(() => {
    if (!article) return;

    const previousTitle = document.title;
    const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    let description = document.querySelector('meta[name="description"]');

    if (!description) {
      description = document.createElement('meta');
      description.setAttribute('name', 'description');
      document.head.appendChild(description);
    }

    document.title = `${article.title} | Takhet+ Academy`;
    description.setAttribute('content', article.summary);

    return () => {
      document.title = previousTitle;
      description?.setAttribute('content', previousDescription);
    };
  }, [article]);
};

const AcademyArticlePage: React.FC<{ user?: User; portal?: boolean }> = ({ user, portal = false }) => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<AcademyArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useAcademyArticleSeo(article);

  useEffect(() => {
    let alive = true;

    academyApi
      .articleBySlug(slug)
      .then((data) => {
        if (!alive) return;
        setArticle(data);
        setError('');
      })
      .catch(() => {
        if (!alive) return;
        setArticle(fallbackArticle(slug));
        setError('Материал временно открыт из резервного режима.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [slug]);

  const handleAiAccess = () => {
    void academyApi.trackEvent({ event: 'ai_cta', target: slug }).catch(() => undefined);

    if (!user) {
      navigate('/auth', { state: { mode: 'login', from: { pathname: `/academy/${slug}` }, forcePublicAuth: true } });
      return;
    }

    navigate(user.role === UserRole.DOCTOR ? '/takhet-ai/doctor' : '/takhet-ai/patient');
  };

  const handleConsultation = () => {
    void academyApi.trackEvent({ event: 'consultation_cta', target: slug }).catch(() => undefined);
    navigate(user ? '/doctors-search' : '/patient-auth', {
      state: user ? undefined : { from: { pathname: '/doctors-search' }, forcePublicAuth: true }
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      {!portal && <PublicHeader activePath="/academy" />}

      <main className={`${portal ? 'pt-4' : 'pt-28 sm:pt-32 md:pt-40'} px-4 pb-20 sm:px-6 lg:px-10 xl:px-20`}>
        <article className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.42fr]">
          <section className="rounded-[3rem] border border-slate-100 bg-white p-6 shadow-sm md:p-10">
            <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 transition-colors hover:bg-primary hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>

            {loading ? (
              <div className="mt-8 grid gap-4">
                <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
                <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
              </div>
            ) : article ? (
              <>
                <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-primary">{article.categoryTitle}</p>
                <h1 className="mt-4 text-4xl font-black leading-[0.95] tracking-tighter text-slate-950 md:text-6xl">{article.title}</h1>
                <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-500">{article.summary}</p>

                <div className="mt-6 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {article.readMinutes} мин
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Обновлено в Academy
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Медицинская проверка
                  </span>
                </div>

                {error && <p className="mt-5 text-sm font-bold text-amber-600">{error}</p>}

                <div className="mt-10 whitespace-pre-line text-base font-semibold leading-8 text-slate-600">{article.body}</div>

                <div className="mt-10 rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">Medical disclaimer</p>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                    Only a qualified doctor can make a diagnosis. Academy explains medical topics and helps prepare for a consultation, but it does not replace physician assessment.
                  </p>
                </div>
              </>
            ) : null}
          </section>

          <aside className="h-fit rounded-[3rem] bg-slate-950 p-6 text-white md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">Следующий шаг</p>
            <h2 className="mt-4 text-3xl font-black tracking-tighter">Нужен персональный разбор?</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
              AI доступен только после входа. Для медицинского решения используйте консультацию врача.
            </p>
            <div className="mt-6 grid gap-3">
              <button onClick={handleAiAccess} className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-slate-950">
                {user ? 'Открыть AI' : 'Войти для AI'}
                <BrainCircuit className="h-5 w-5 text-primary" />
              </button>
              <button onClick={handleConsultation} className="flex items-center justify-between rounded-2xl border border-white/15 px-5 py-4 text-left text-xs font-black uppercase tracking-[0.16em] text-white">
                Консультация
                <Stethoscope className="h-5 w-5 text-blue-200" />
              </button>
            </div>
          </aside>
        </article>
      </main>
    </div>
  );
};

export default AcademyArticlePage;
