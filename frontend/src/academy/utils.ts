import { academyArticles, type AcademyArticle } from './content';

export const getAcademyArticleBySlug = (slug: string) =>
  academyArticles.find((article) => article.slug === slug);

export const getAcademyCategories = () => {
  const counts = new Map<string, number>();

  for (const article of academyArticles) {
    counts.set(article.category, (counts.get(article.category) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'ru'));
};

export const getAcademyLatestArticles = () =>
  [...academyArticles].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

export const getAcademyFeaturedArticles = () => getAcademyLatestArticles().slice(0, 6);

export const searchAcademyArticles = (query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return getAcademyFeaturedArticles();

  return academyArticles.filter((article) =>
    [
      article.title,
      article.excerpt,
      article.category,
      article.cluster,
      article.primaryKeyword,
      ...article.secondaryKeywords
    ].some((value) => value.toLowerCase().includes(normalized))
  );
};

export const getRelatedAcademyArticles = (article: AcademyArticle) =>
  article.relatedSlugs
    .map((slug) => getAcademyArticleBySlug(slug))
    .filter((related): related is AcademyArticle => Boolean(related));

export const getAcademyAlphabet = () =>
  [...new Set(academyArticles.map((article) => article.title[0]?.toUpperCase()).filter(Boolean))];
