import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const html = read('index.html');
const robots = read('public/robots.txt');
const sitemap = read('public/sitemap.xml');
const indexNowKey = read('public/6e48def1bba77833b1daaf7d9fd7a00f.txt').trim();

if (!html.includes('<title>ТАХЕТ+ | Health OS</title>')) {
  throw new Error('The landing page must expose the requested Yandex snippet title');
}

if (!html.includes('name="description"') || !html.includes('телемедицинская экосистема')) {
  throw new Error('The landing page must expose a meaningful Russian snippet description');
}

if (!html.includes('href="https://www.takhet.com/favicon.ico"')) {
  throw new Error('Yandex must receive one canonical absolute favicon URL');
}

if (!html.includes('"logo": "https://www.takhet.com/favicon.png"')) {
  throw new Error('Organization structured data must expose the Takhet+ logo');
}

if (!robots.includes('User-agent: Yandex') || !robots.includes('Host: www.takhet.com')) {
  throw new Error('robots.txt must declare the canonical Yandex host');
}

if (!sitemap.includes('<loc>https://www.takhet.com/</loc>') || !sitemap.includes('<lastmod>2026-07-01</lastmod>')) {
  throw new Error('The sitemap must mark the canonical home page as updated');
}

if (indexNowKey !== '6e48def1bba77833b1daaf7d9fd7a00f') {
  throw new Error('IndexNow ownership key file is invalid');
}

console.log('Yandex search snippet contract passed');
