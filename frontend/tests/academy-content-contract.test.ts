import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const content = read('src/academy/content.ts');
const sitemap = read('public/sitemap.xml');
const searchIndex = JSON.parse(read('public/academy-search-index.json')) as Array<{ slug: string; title: string }>;

assert(content.includes('export const academyArticles: AcademyArticle[] = ['), 'Academy content layer must define article source-of-truth');
assert(content.includes('sources: ['), 'Academy articles must include sources');
assert(content.includes('medicalReviewer'), 'Academy articles must include medical reviewer metadata');
assert(content.includes('relatedSlugs'), 'Academy articles must include internal links');

for (const item of searchIndex) {
  assert(sitemap.includes(`/academy/${item.slug}`), `Sitemap must include Academy URL for ${item.slug}`);
  assert(item.title.length > 0, `Search index title must be present for ${item.slug}`);
}

console.log('Academy content contract passed');
