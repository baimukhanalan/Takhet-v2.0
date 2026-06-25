import { api } from '../../services/api';

export type AcademyCategory = {
  slug: string;
  title: string;
  description: string;
  sortOrder?: number;
  articleCount?: number;
};

export type AcademyArticle = {
  slug: string;
  title: string;
  summary: string;
  readMinutes: number;
  views: number;
  reviewStatus: string;
  publishedAt: string;
  categorySlug: string;
  categoryTitle: string;
};

export type AcademyArticleDetail = AcademyArticle & {
  id: string;
  body: string;
  tags: Array<{ slug: string; title: string }>;
};

export type AcademyOverview = {
  categories: AcademyCategory[];
  featured: AcademyArticle[];
  popular: AcademyArticle[];
  latest: AcademyArticle[];
  alphabet: string[];
  stats: {
    articles: number;
    categories: number;
    reviewed: number;
  };
};

export type AcademySearchResult = {
  query: string;
  category: string | null;
  letter: string | null;
  items: AcademyArticle[];
  total: number;
};

export const academyApi = {
  overview: () => api<AcademyOverview>('/academy/overview'),
  search: (params: { q?: string; category?: string; letter?: string }) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    if (params.letter) query.set('letter', params.letter);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return api<AcademySearchResult>('/academy/search' + suffix);
  },
  articleBySlug: (slug: string) => api<AcademyArticleDetail>(`/academy/articles/${encodeURIComponent(slug)}`),
  trackEvent: (payload: { event: 'search' | 'open_article' | 'category_click' | 'ai_cta' | 'consultation_cta'; target?: string; query?: string }) =>
    api<{ ok: boolean }>('/academy/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
