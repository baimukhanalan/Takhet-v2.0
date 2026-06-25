import { useEffect } from 'react';
import type { AcademyArticle } from './content';

const SITE_URL = 'https://www.takhet.com';

const ensureMeta = (selector: string, create: () => HTMLMetaElement) => {
  let node = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!node) {
    node = create();
    document.head.appendChild(node);
  }
  return node;
};

const ensureCanonical = () => {
  let node = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', 'canonical');
    document.head.appendChild(node);
  }
  return node;
};

const upsertJsonLd = (id: string, payload: object) => {
  let node = document.getElementById(id) as HTMLScriptElement | null;
  if (!node) {
    node = document.createElement('script');
    node.id = id;
    node.type = 'application/ld+json';
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(payload);
  return node;
};

export const useAcademyArticleSeo = (article: AcademyArticle, portal = false) => {
  useEffect(() => {
    const previousTitle = document.title;
    const previousDescription = document.head.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    const canonical = ensureCanonical();
    const description = ensureMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'description';
      return meta;
    });
    const ogTitle = ensureMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      return meta;
    });
    const ogDescription = ensureMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      return meta;
    });

    const publicPath = `/academy/${article.slug}`;
    const articleUrl = `${SITE_URL}${publicPath}`;
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Takhet+', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Academy', item: `${SITE_URL}/academy` },
        { '@type': 'ListItem', position: 3, name: article.title, item: articleUrl }
      ]
    };
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      headline: article.title,
      description: article.seoDescription,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: { '@type': 'Organization', name: article.author },
      reviewedBy: { '@type': 'Person', name: article.medicalReviewer },
      about: article.primaryKeyword,
      url: articleUrl
    };

    document.title = article.seoTitle;
    description.setAttribute('content', article.seoDescription);
    ogTitle.setAttribute('content', article.seoTitle);
    ogDescription.setAttribute('content', article.seoDescription);
    canonical.href = articleUrl;

    const schemaId = portal ? 'academy-article-schema-portal' : 'academy-article-schema';
    const breadcrumbId = portal ? 'academy-breadcrumb-schema-portal' : 'academy-breadcrumb-schema';
    upsertJsonLd(schemaId, articleSchema);
    upsertJsonLd(breadcrumbId, breadcrumbSchema);

    return () => {
      document.title = previousTitle;
      description.setAttribute('content', previousDescription);
      const schemaNode = document.getElementById(schemaId);
      const breadcrumbNode = document.getElementById(breadcrumbId);
      schemaNode?.remove();
      breadcrumbNode?.remove();
    };
  }, [article, portal]);
};
