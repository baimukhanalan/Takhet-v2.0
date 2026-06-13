import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const landing = read('src/pages/LandingPage.tsx');
const ruLocale = read('src/locales/ru.json');
const doctorsPage = read('src/pages/DoctorsPage.tsx');
const labsPage = read('src/pages/TakhetLabsPage.tsx');
const visibleSources = [landing, ruLocale, doctorsPage, labsPage].join('\n');

const forbiddenPublicCopy = [
  'Медицина, которая думает вместе с вами',
  'лучший путь лечения',
  'Коллективный интеллект врачей',
  'абстрактный диагноз',
  'Система формирует цифровой профиль здоровья',
  'Takhet+ анализирует симптомы',
  'Будущее',
  'революц',
  'умная медицинская экосистема',
];

for (const phrase of forbiddenPublicCopy) {
  assert(!visibleSources.toLowerCase().includes(phrase.toLowerCase()), `Visible copy must not use AI-slop phrase: ${phrase}`);
}

const forbiddenTechnicalCopy = [
  'future laboratory APIs',
  'automatic mapping into Takhet Labs dashboard',
];

for (const phrase of forbiddenTechnicalCopy) {
  assert(!visibleSources.includes(phrase), `Visible copy must not expose implementation wording: ${phrase}`);
}

const forbiddenInternalComments = [
  'AI Health Browser',
  'Why Choose Us Section',
  'Key Capabilities',
  'Background Decorative Elements',
  'Takhet AI Section',
  'Archive & Logistics',
  'Control Section',
  'Philosophy / Mission Block',
  'Final Call to Action',
];

for (const marker of forbiddenInternalComments) {
  assert(!landing.includes(marker), `Landing source must not keep generic internal section marker: ${marker}`);
}

const requiredPreciseCopy = [
  'Как Takhet+ помогает пациенту',
  'Сначала собрать факты',
  'Понятный следующий шаг',
  'История не теряется между обращениями',
  'Что уже можно сделать в Takhet+',
  'Второе мнение врачей (Swarm Medicine)',
  'Контроль без лишнего шума',
  'Начните с вопроса или консультации',
];

for (const phrase of requiredPreciseCopy) {
  assert(ruLocale.includes(phrase), `Landing copy must include precise replacement phrase: ${phrase}`);
}

assert(
  ruLocale.includes('AI помогает подготовить вопросы и документы; медицинские решения принимает врач.'),
  'Landing philosophy must clearly separate AI support from medical decisions'
);

assert(
  doctorsPage.includes('Вы ведете прием, а Takhet+ готовит контекст'),
  'Doctors page must use concrete doctor-facing copy instead of system-thinking wording'
);

assert(
  labsPage.includes('Загрузка PDF, ручной ввод, OCR-распознавание и нормализация показателей'),
  'Takhet Labs biomarkers section must describe user-facing workflow without implementation placeholders'
);

console.log('Landing AI-slop copy contract tests passed');
