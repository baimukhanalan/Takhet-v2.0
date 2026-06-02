import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sitePages } from '../content/siteContent';

type Lang = 'ru' | 'kk';

type NavItem = {
  ru: string;
  kk: string;
  href: string;
  external?: boolean;
};

type TeamMember = {
  name: string;
  roleRu: string;
  roleKk: string;
  groupTitleRu: string;
  groupTitleKk: string;
};

type TeamGroup = {
  titleRu: string;
  titleKk: string;
  members: TeamMember[];
};

type ScheduleSection = {
  titleRu: string;
  titleKk: string;
  headers: string[];
  rows: string[][];
};

type HomeData = {
  heroImage: string;
  heroTitleRu: string;
  heroTitleKk: string;
  heroTextRu: string;
  heroTextKk: string;
  aboutImage: string;
  aboutTitleRu: string;
  aboutTitleKk: string;
  aboutParagraphsRu: string[];
  aboutParagraphsKk: string[];
  servicesTitleRu: string;
  servicesTitleKk: string;
  services: { icon: string; ru: string; kk: string }[];
  teamTitleRu: string;
  teamTitleKk: string;
  teamGroups: TeamGroup[];
  galleryTitleRu: string;
  galleryTitleKk: string;
  galleryImages: { src: string; alt: string }[];
  patientInfo: { titleRu: string; titleKk: string; itemsRu: string[]; itemsKk: string[] }[];
  schedules: ScheduleSection[];
  contactsTitleRu: string;
  contactsTitleKk: string;
  mapSrc: string;
};

const ui = {
  quickRu: '\u0411\u044b\u0441\u0442\u0440\u044b\u0439 \u043f\u043e\u0438\u0441\u043a \u043f\u043e \u0441\u0430\u0439\u0442\u0443',
  quickKk: '\u0421\u0430\u0439\u0442 \u0431\u043e\u0439\u044b\u043d\u0448\u0430 \u0436\u044b\u043b\u0434\u0430\u043c \u0456\u0437\u0434\u0435\u0443',
  quickPlaceholderRu: '\u0420\u0430\u0437\u0434\u0435\u043b, \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442 \u0438\u043b\u0438 \u0443\u0441\u043b\u0443\u0433\u0430',
  quickPlaceholderKk: '\u0411\u04e9\u043b\u0456\u043c, \u049b\u04b1\u0436\u0430\u0442 \u043d\u0435\u043c\u0435\u0441\u0435 \u049b\u044b\u0437\u043c\u0435\u0442',
  quickTextRu: '\u041f\u0430\u0446\u0438\u0435\u043d\u0442\u0443 \u0434\u043e\u043b\u0436\u043d\u043e \u0431\u044b\u0442\u044c \u043f\u0440\u043e\u0449\u0435 \u043d\u0430\u0439\u0442\u0438 \u043d\u0443\u0436\u043d\u0443\u044e \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443 \u0432 \u0434\u0432\u0430 \u043a\u043b\u0438\u043a\u0430.',
  quickTextKk: '\u041f\u0430\u0446\u0438\u0435\u043d\u0442\u043a\u0435 \u049b\u0430\u0436\u0435\u0442 \u0431\u0435\u0442\u0442\u0456 \u0435\u043a\u0456 \u0431\u0430\u0441\u0443\u0434\u0430 \u0442\u0430\u0431\u0443 \u043e\u04a3\u0430\u0439 \u0431\u043e\u043b\u0443\u044b \u043a\u0435\u0440\u0435\u043a.',
  heroBadgeRu: '\u041c\u043d\u043e\u0433\u043e\u043f\u0440\u043e\u0444\u0438\u043b\u044c\u043d\u044b\u0439 \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u0439 \u0446\u0435\u043d\u0442\u0440',
  heroBadgeKk: '\u041a\u04e9\u043f\u0441\u0430\u043b\u0430\u043b\u044b \u043c\u0435\u0434\u0438\u0446\u0438\u043d\u0430\u043b\u044b\u049b \u043e\u0440\u0442\u0430\u043b\u044b\u049b',
  heroFactTeamRu: '\u041a\u043e\u043c\u0430\u043d\u0434\u0430',
  heroFactTeamKk: '\u041a\u043e\u043c\u0430\u043d\u0434\u0430',
  heroFactServiceRu: '\u041d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f',
  heroFactServiceKk: '\u0411\u0430\u0493\u044b\u0442\u0442\u0430\u0440',
  heroFactScheduleRu: '\u0413\u0440\u0430\u0444\u0438\u043a\u0438',
  heroFactScheduleKk: '\u041a\u0435\u0441\u0442\u0435\u043b\u0435\u0440',
  navigatorEyebrowRu: '\u041c\u0430\u0440\u0448\u0440\u0443\u0442 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u0430',
  navigatorEyebrowKk: '\u041f\u0430\u0446\u0438\u0435\u043d\u0442 \u043c\u0430\u0440\u0448\u0440\u0443\u0442\u044b',
  navigatorTitleRu: '\u041d\u0430\u0439\u0442\u0438 \u0432\u0440\u0430\u0447\u0430, \u0443\u0441\u043b\u0443\u0433\u0443 \u0438\u043b\u0438 \u043d\u0443\u0436\u043d\u044b\u0439 \u0440\u0430\u0437\u0434\u0435\u043b',
  navigatorTitleKk: '\u0414\u04d9\u0440\u0456\u0433\u0435\u0440\u0434\u0456, \u049b\u044b\u0437\u043c\u0435\u0442\u0442\u0456 \u043d\u0435\u043c\u0435\u0441\u0435 \u049b\u0430\u0436\u0435\u0442 \u0431\u04e9\u043b\u0456\u043c\u0434\u0456 \u0442\u0430\u0431\u0443',
  navigatorTextRu: '\u0412\u0435\u0440\u0445 \u0433\u043b\u0430\u0432\u043d\u043e\u0439 \u0441\u0434\u0435\u043b\u0430\u043d \u043a\u0430\u043a \u0440\u0430\u0431\u043e\u0447\u0438\u0439 \u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442: \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0443 \u0438 \u0441\u0440\u0430\u0437\u0443 \u043f\u0435\u0440\u0435\u0439\u0434\u0438\u0442\u0435 \u043a \u043d\u0443\u0436\u043d\u043e\u043c\u0443 \u0441\u0446\u0435\u043d\u0430\u0440\u0438\u044e.',
  navigatorTextKk: '\u0411\u0430\u0441 \u0431\u0435\u0442 \u0436\u04b1\u043c\u044b\u0441 \u049b\u04b1\u0440\u0430\u043b\u044b \u0440\u0435\u0442\u0456\u043d\u0434\u0435 \u0436\u0430\u0441\u0430\u043b\u0434\u044b: \u043c\u0456\u043d\u0434\u0435\u0442\u0442\u0456 \u0442\u0430\u04a3\u0434\u0430\u043f, \u049b\u0430\u0436\u0435\u0442 \u0441\u0446\u0435\u043d\u0430\u0440\u0438\u0439\u0433\u0435 \u0431\u0456\u0440\u0434\u0435\u043d \u04e9\u0442\u0456\u04a3\u0456\u0437.',
  navigatorQuestionRu: '\u0427\u0442\u043e \u0432\u0430\u043c \u043d\u0443\u0436\u043d\u043e \u0441\u0435\u0439\u0447\u0430\u0441?',
  navigatorQuestionKk: '\u049a\u0430\u0437\u0456\u0440 \u0441\u0456\u0437\u0433\u0435 \u043d\u0435 \u049b\u0430\u0436\u0435\u0442?',
  navigatorDoctorsRu: '\u041d\u0430\u0439\u0442\u0438 \u0432\u0440\u0430\u0447\u0430',
  navigatorDoctorsKk: '\u0414\u04d9\u0440\u0456\u0433\u0435\u0440 \u0442\u0430\u0431\u0443',
  navigatorDoctorsTextRu: '\u041f\u043e \u0444\u0430\u043c\u0438\u043b\u0438\u0438, \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u0438 \u0438 \u043e\u0442\u0434\u0435\u043b\u0435\u043d\u0438\u044e.',
  navigatorDoctorsTextKk: '\u0422\u0435\u0433\u0456, \u043c\u0430\u043c\u0430\u043d\u0434\u044b\u0493\u044b \u0436\u04d9\u043d\u0435 \u0431\u04e9\u043b\u0456\u043c\u0456 \u0431\u043e\u0439\u044b\u043d\u0448\u0430.',
  navigatorServicesRu: '\u041f\u043e\u0434\u043e\u0431\u0440\u0430\u0442\u044c \u0443\u0441\u043b\u0443\u0433\u0443',
  navigatorServicesKk: '\u049a\u044b\u0437\u043c\u0435\u0442 \u0442\u0430\u04a3\u0434\u0430\u0443',
  navigatorServicesTextRu: '\u041e\u0441\u043d\u043e\u0432\u043d\u044b\u0435 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u0438 \u043f\u0440\u043e\u0444\u0438\u043b\u0438 \u043a\u043b\u0438\u043d\u0438\u043a\u0438.',
  navigatorServicesTextKk: '\u041d\u0435\u0433\u0456\u0437\u0433\u0456 \u0431\u0430\u0493\u044b\u0442\u0442\u0430\u0440 \u043c\u0435\u043d \u043a\u043b\u0438\u043d\u0438\u043a\u0430 \u0431\u0435\u0439\u0456\u043d\u0456.',
  navigatorPatientsRu: '\u041d\u0430\u0439\u0442\u0438 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442',
  navigatorPatientsKk: '\u049a\u04b1\u0436\u0430\u0442 \u0442\u0430\u0431\u0443',
  navigatorPatientsTextRu: '\u041f\u0440\u0430\u0432\u0430, \u041e\u0421\u041c\u0421, \u0443\u0441\u043b\u0443\u0433\u0438 \u0438 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f \u0434\u043b\u044f \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043e\u0432.',
  navigatorPatientsTextKk: '\u049a\u04b1\u049b\u044b\u049b\u0442\u0430\u0440, \u04d8\u041c\u0421\u049a, \u049b\u044b\u0437\u043c\u0435\u0442\u0442\u0435\u0440 \u0436\u04d9\u043d\u0435 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043a\u0435 \u0430\u0440\u043d\u0430\u043b\u0493\u0430\u043d \u0430\u049b\u043f\u0430\u0440\u0430\u0442.',
  navigatorActionRu: '\u041e\u0442\u043a\u0440\u044b\u0442\u044c',
  navigatorActionKk: '\u0410\u0448\u0443',
  featuredDoctorsRu: '\u0412 \u0446\u0435\u043d\u0442\u0440\u0435 \u0441\u0435\u0439\u0447\u0430\u0441',
  featuredDoctorsKk: '\u049a\u0430\u0437\u0456\u0440 \u043e\u0440\u0442\u0430\u043b\u044b\u049b\u0442\u0430',
  servicesSpotRu: '\u041a\u043b\u044e\u0447\u0435\u0432\u044b\u0435 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f',
  servicesSpotKk: '\u041d\u0435\u0433\u0456\u0437\u0433\u0456 \u0431\u0430\u0493\u044b\u0442\u0442\u0430\u0440',
  patientRu: '\u0418\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f \u0434\u043b\u044f \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u0430',
  patientKk: '\u041f\u0430\u0446\u0438\u0435\u043d\u0442 \u04af\u0448\u0456\u043d \u0430\u049b\u043f\u0430\u0440\u0430\u0442',
  patientTextRu: '\u0412\u0441\u0435 \u043f\u0430\u043c\u044f\u0442\u043a\u0438 \u0438 \u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0435 \u0441\u0432\u0435\u0434\u0435\u043d\u0438\u044f \u0441\u043e\u0431\u0440\u0430\u043d\u044b \u043d\u0438\u0436\u0435 \u0431\u0435\u0437 \u0438\u0441\u043a\u0430\u0436\u0435\u043d\u0438\u0439.',
  patientTextKk: '\u0411\u0430\u0440\u043b\u044b\u049b \u0435\u0441\u043a\u0435\u0440\u0442\u043f\u0435\u043b\u0435\u0440 \u043c\u0435\u043d \u0440\u0435\u0441\u043c\u0438 \u043c\u04d9\u043b\u0456\u043c\u0435\u0442\u0442\u0435\u0440 \u0442\u04e9\u043c\u0435\u043d\u0434\u0435 \u04e9\u0437\u0433\u0435\u0440\u0456\u0441\u0441\u0456\u0437 \u0436\u0438\u043d\u0430\u049b\u0442\u0430\u043b\u0493\u0430\u043d.',
  allTeamRu: '\u0412\u0441\u044f \u043a\u043e\u043c\u0430\u043d\u0434\u0430',
  allTeamKk: '\u0411\u04af\u043a\u0456\u043b \u043a\u043e\u043c\u0430\u043d\u0434\u0430',
  teamSearchRu: '\u041d\u0430\u0439\u0442\u0438 \u0432\u0440\u0430\u0447\u0430 \u0438\u043b\u0438 \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u044c',
  teamSearchKk: '\u0414\u04d9\u0440\u0456\u0433\u0435\u0440\u0434\u0456 \u043d\u0435\u043c\u0435\u0441\u0435 \u043c\u0430\u043c\u0430\u043d\u0434\u044b\u049b\u0442\u044b \u0442\u0430\u0431\u0443',
  teamPromptRu: '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0440\u043e\u0444\u0438\u043b\u044c, \u0441\u0443\u0437\u044c\u0442\u0435 \u0432\u044b\u0434\u0430\u0447\u0443 \u0438 \u0441\u0440\u0430\u0437\u0443 \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0438\u0442\u0435 \u043a \u0437\u0430\u043f\u0438\u0441\u0438.',
  teamPromptKk: '\u041f\u0440\u043e\u0444\u0438\u043b\u044c\u0434\u0456 \u0442\u0430\u04a3\u0434\u0430\u043f, \u043d\u04d9\u0442\u0438\u0436\u0435\u043d\u0456 \u0441\u04af\u0437\u0456\u043f, \u0436\u0430\u0437\u044b\u043b\u0443\u0493\u0430 \u0431\u0456\u0440\u0434\u0435\u043d \u04e9\u0442\u0456\u04a3\u0456\u0437.',
  teamBookRu: '\u0417\u0430\u043f\u0438\u0441\u0430\u0442\u044c\u0441\u044f',
  teamBookKk: '\u0416\u0430\u0437\u044b\u043b\u0443',
  teamDepartmentRu: '\u041e\u0442\u0434\u0435\u043b\u0435\u043d\u0438\u0435',
  teamDepartmentKk: '\u0411\u04e9\u043b\u0456\u043c',
  galleryRu: '\u0413\u0430\u043b\u0435\u0440\u0435\u044f \u043a\u043b\u0438\u043d\u0438\u043a\u0438',
  galleryKk: '\u041a\u043b\u0438\u043d\u0438\u043a\u0430 \u0433\u0430\u043b\u0435\u0440\u0435\u044f\u0441\u044b',
  galleryTextRu: '\u0418\u043d\u0442\u0435\u0440\u044c\u0435\u0440, \u0437\u043e\u043d\u044b \u043e\u0436\u0438\u0434\u0430\u043d\u0438\u044f \u0438 \u0432\u0438\u0437\u0443\u0430\u043b\u044c\u043d\u0430\u044f \u0441\u0440\u0435\u0434\u0430 \u043a\u043b\u0438\u043d\u0438\u043a\u0438',
  galleryTextKk: '\u0418\u043d\u0442\u0435\u0440\u044c\u0435\u0440, \u043a\u04af\u0442\u0443 \u0430\u0439\u043c\u0430\u049b\u0442\u0430\u0440\u044b \u0436\u04d9\u043d\u0435 \u043a\u043b\u0438\u043d\u0438\u043a\u0430\u043d\u044b\u04a3 \u0432\u0438\u0437\u0443\u0430\u043b\u0434\u044b \u043e\u0440\u0442\u0430\u0441\u044b',
  scheduleRu: '\u0413\u0440\u0430\u0444\u0438\u043a\u0438 \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442\u043e\u0432',
  scheduleKk: '\u041c\u0430\u043c\u0430\u043d\u0434\u0430\u0440\u0434\u044b\u04a3 \u043a\u0435\u0441\u0442\u0435\u0441\u0456',
  scheduleTextRu: '\u0410\u043a\u0442\u0443\u0430\u043b\u044c\u043d\u044b\u0435 \u0442\u0430\u0431\u043b\u0438\u0446\u044b \u0441\u043e \u0441\u0442\u0430\u0440\u043e\u0433\u043e \u0441\u0430\u0439\u0442\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b \u0431\u0435\u0437 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439.',
  scheduleTextKk: '\u0415\u0441\u043a\u0456 \u0441\u0430\u0439\u0442\u0442\u0430\u0493\u044b \u04e9\u0437\u0435\u043a\u0442\u0456 \u043a\u0435\u0441\u0442\u0435\u043b\u0435\u0440 \u04e9\u0437\u0433\u0435\u0440\u0456\u0441\u0441\u0456\u0437 \u0441\u0430\u049b\u0442\u0430\u043b\u0434\u044b',
};

const getText = (lang: Lang, ru: string, kk: string) => (lang === 'kk' ? kk : ru);
const scrollToSection = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', `#${id}`);
  }
};
const getSpanText = (root: ParentNode, lang: Lang) =>
  (root.querySelector(`span[lang="${lang}"]`)?.textContent || '').replace(/\s+/g, ' ').trim();
const getFirstImage = (root: ParentNode) => root.querySelector('img')?.getAttribute('src') || '';
const parseHomePage = (html: string): HomeData => {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement;
  const sections = Array.from(root.children);
  const hero = sections.find((section) => section.classList.contains('hero')) as HTMLElement;
  const about = sections.find((section) => section.classList.contains('about')) as HTMLElement;
  const services = sections.find((section) => section.classList.contains('services')) as HTMLElement;
  const team = sections.find((section) => section.classList.contains('team')) as HTMLElement;
  const simpleSections = sections.filter(
    (section) =>
      section.classList.contains('section') &&
      !section.classList.contains('about') &&
      !section.classList.contains('services') &&
      !section.classList.contains('team'),
  ) as HTMLElement[];
  const gallery = simpleSections[0];
  const patientInfo = simpleSections[1];
  const schedule = simpleSections[2];
  const contactsSection = simpleSections[3];
  const aboutParagraphsRu = Array.from(about.querySelectorAll('.about-text p')).map((item) => getSpanText(item, 'ru'));
  const aboutParagraphsKk = Array.from(about.querySelectorAll('.about-text p')).map((item) => getSpanText(item, 'kk'));
  const serviceItems = Array.from(services.querySelectorAll('.service-card')).map((card) => ({
    icon: getFirstImage(card),
    ru: getSpanText(card, 'ru'),
    kk: getSpanText(card, 'kk'),
  }));
  const teamGroups: TeamGroup[] = [];
  let currentTitleRu = '';
  let currentTitleKk = '';

  Array.from(team.children).forEach((child) => {
    if ((child as HTMLElement).classList.contains('team-group-title')) {
      currentTitleRu = getSpanText(child, 'ru');
      currentTitleKk = getSpanText(child, 'kk');
    }
    if ((child as HTMLElement).classList.contains('team-grid')) {
      teamGroups.push({
        titleRu: currentTitleRu,
        titleKk: currentTitleKk,
        members: Array.from(child.querySelectorAll('.team-card')).map((card) => ({
          name: card.querySelector('h4')?.textContent?.trim() || '',
          roleRu: getSpanText(card, 'ru'),
          roleKk: getSpanText(card, 'kk'),
          groupTitleRu: currentTitleRu,
          groupTitleKk: currentTitleKk,
        })),
      });
    }
  });

  const galleryImages = Array.from(gallery.querySelectorAll('.gallery img')).map((img) => ({
    src: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '',
  }));
  const patientCards = Array.from(patientInfo.querySelectorAll('.card')).map((card) => ({
    titleRu: getSpanText(card.querySelector('h3') || card, 'ru'),
    titleKk: getSpanText(card.querySelector('h3') || card, 'kk'),
    itemsRu: Array.from(card.querySelectorAll('li')).map((item) => getSpanText(item, 'ru')),
    itemsKk: Array.from(card.querySelectorAll('li')).map((item) => getSpanText(item, 'kk')),
  }));
  const schedules: ScheduleSection[] = [];
  const scheduleChildren = Array.from(schedule.children);

  for (let index = 0; index < scheduleChildren.length; index += 1) {
    const node = scheduleChildren[index] as HTMLElement;
    if (node.tagName === 'H3') {
      const table = (scheduleChildren[index + 1] as HTMLElement | undefined)?.querySelector('table');
      if (table) {
        schedules.push({
          titleRu: getSpanText(node, 'ru'),
          titleKk: getSpanText(node, 'kk'),
          headers: Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent?.trim() || ''),
          rows: Array.from(table.querySelectorAll('tbody tr')).map((tr) =>
            Array.from(tr.querySelectorAll('td')).map((td) => td.textContent?.replace(/\s+/g, ' ').trim() || ''),
          ),
        });
      }
    }
  }

  return {
    heroImage: getFirstImage(hero),
    heroTitleRu: getSpanText(hero.querySelector('h1') || hero, 'ru'),
    heroTitleKk: getSpanText(hero.querySelector('h1') || hero, 'kk'),
    heroTextRu: getSpanText(hero.querySelector('p') || hero, 'ru'),
    heroTextKk: getSpanText(hero.querySelector('p') || hero, 'kk'),
    aboutImage: getFirstImage(about),
    aboutTitleRu: getSpanText(about.querySelector('h2') || about, 'ru'),
    aboutTitleKk: getSpanText(about.querySelector('h2') || about, 'kk'),
    aboutParagraphsRu,
    aboutParagraphsKk,
    servicesTitleRu: getSpanText(services.querySelector('h2') || services, 'ru'),
    servicesTitleKk: getSpanText(services.querySelector('h2') || services, 'kk'),
    services: serviceItems,
    teamTitleRu: getSpanText(team.querySelector('h2') || team, 'ru'),
    teamTitleKk: getSpanText(team.querySelector('h2') || team, 'kk'),
    teamGroups,
    galleryTitleRu: getSpanText(gallery.querySelector('h2') || gallery, 'ru'),
    galleryTitleKk: getSpanText(gallery.querySelector('h2') || gallery, 'kk'),
    galleryImages,
    patientInfo: patientCards,
    schedules,
    contactsTitleRu: getSpanText(contactsSection.querySelector('h2') || contactsSection, 'ru'),
    contactsTitleKk: getSpanText(contactsSection.querySelector('h2') || contactsSection, 'kk'),
    mapSrc: contactsSection.querySelector('iframe')?.getAttribute('src') || '',
  };
};
const SearchBox: React.FC<{ lang: Lang; navItems: NavItem[] }> = ({ lang, navItems }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const filtered = navItems.filter((item) => `${item.ru} ${item.kk}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  return (
    <div className="hero-search">
      <div className="hero-search__head">
        <div>
          <p className="section-eyebrow">{getText(lang, ui.quickRu, ui.quickKk)}</p>
          <h3>{getText(lang, ui.quickRu, ui.quickKk)}</h3>
        </div>
        <Sparkles size={18} />
      </div>
      <p className="hero-search__help">{getText(lang, ui.quickTextRu, ui.quickTextKk)}</p>
      <label className="hero-search__field">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={getText(lang, ui.quickPlaceholderRu, ui.quickPlaceholderKk)} type="search" />
      </label>
      <div className="hero-search__results">
        {filtered.map((item) =>
          item.external ? (
            <a className="hero-search__result" href={item.href} key={item.href} rel="noreferrer" target="_blank">
              <span>{getText(lang, item.ru, item.kk)}</span>
              <ArrowUpRight size={14} />
            </a>
          ) : (
            <button className="hero-search__result" key={item.href} onClick={() => navigate(item.href)} type="button">
              <span>{getText(lang, item.ru, item.kk)}</span>
              <ArrowRight size={14} />
            </button>
          ),
        )}
      </div>
    </div>
  );
};

const CareNavigator: React.FC<{ lang: Lang; navItems: NavItem[]; teamGroups: TeamGroup[]; services: HomeData['services'] }> = ({ lang, navItems, teamGroups, services }) => {
  const navigate = useNavigate();
  const topDoctors = teamGroups.flatMap((group) => group.members).slice(0, 4);
  const topServices = services.slice(0, 6);
  const patientLinks = navItems.filter((item) => ['osms', 'rights', 'faq', 'support', 'attachment', 'territory', 'legal'].some((token) => item.href.includes(token)));
  const pathways = [
    { icon: <Users2 size={18} />, titleRu: ui.navigatorDoctorsRu, titleKk: ui.navigatorDoctorsKk, textRu: ui.navigatorDoctorsTextRu, textKk: ui.navigatorDoctorsTextKk, action: () => scrollToSection('team-section') },
    { icon: <Stethoscope size={18} />, titleRu: ui.navigatorServicesRu, titleKk: ui.navigatorServicesKk, textRu: ui.navigatorServicesTextRu, textKk: ui.navigatorServicesTextKk, action: () => scrollToSection('services-section') },
    { icon: <ShieldCheck size={18} />, titleRu: ui.navigatorPatientsRu, titleKk: ui.navigatorPatientsKk, textRu: ui.navigatorPatientsTextRu, textKk: ui.navigatorPatientsTextKk, action: () => navigate(patientLinks[0]?.href || '/osms.html') },
  ];

  return (
    <section className="home-section care-navigator">
      <div className="section-heading">
        <div>
          <p className="section-eyebrow">{getText(lang, ui.navigatorEyebrowRu, ui.navigatorEyebrowKk)}</p>
          <h2>{getText(lang, ui.navigatorTitleRu, ui.navigatorTitleKk)}</h2>
        </div>
        <p className="section-note">{getText(lang, ui.navigatorTextRu, ui.navigatorTextKk)}</p>
      </div>
      <div className="care-navigator__grid">
        <div className="care-navigator__panel care-navigator__panel--primary">
          <div className="care-navigator__question"><span>{getText(lang, ui.navigatorQuestionRu, ui.navigatorQuestionKk)}</span></div>
          <div className="care-navigator__actions">
            {pathways.map((pathway) => (
              <button className="care-navigator__action" key={pathway.titleRu} onClick={pathway.action} type="button">
                <span className="care-navigator__action-icon">{pathway.icon}</span>
                <strong>{getText(lang, pathway.titleRu, pathway.titleKk)}</strong>
                <p>{getText(lang, pathway.textRu, pathway.textKk)}</p>
                <span>{getText(lang, ui.navigatorActionRu, ui.navigatorActionKk)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="care-navigator__stack">
          <article className="care-navigator__panel">
            <div className="care-navigator__mini-head"><Users2 size={18} /><h3>{getText(lang, ui.featuredDoctorsRu, ui.featuredDoctorsKk)}</h3></div>
            <div className="care-navigator__chips">
              {topDoctors.map((member) => (
                <button key={`${member.name}-${member.groupTitleRu}`} onClick={() => scrollToSection('team-section')} type="button"><span>{member.name}</span><small>{getText(lang, member.groupTitleRu, member.groupTitleKk)}</small></button>
              ))}
            </div>
          </article>
          <article className="care-navigator__panel">
            <div className="care-navigator__mini-head"><Sparkles size={18} /><h3>{getText(lang, ui.servicesSpotRu, ui.servicesSpotKk)}</h3></div>
            <div className="care-navigator__tag-cloud">
              {topServices.map((service) => (
                <button key={service.ru} onClick={() => scrollToSection('services-section')} type="button">{getText(lang, service.ru, service.kk)}</button>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

const GalleryCarousel: React.FC<{ images: { src: string; alt: string }[]; lang: Lang }> = ({ images, lang }) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (images.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % images.length), 4500);
    return () => window.clearInterval(timer);
  }, [images.length]);
  if (images.length === 0) return null;

  return (
    <div className="gallery-carousel">
      <div className="gallery-carousel__viewport"><div className="gallery-carousel__track" style={{ transform: `translateX(-${index * 100}%)` }}>{images.map((image) => <figure className="gallery-carousel__slide" key={image.src}><img alt={image.alt} src={image.src} /></figure>)}</div></div>
      <div className="gallery-carousel__thumbs">{images.map((image, thumbIndex) => <button aria-label={image.alt} className={thumbIndex === index ? 'is-active' : ''} key={`${image.src}-${thumbIndex}`} onClick={() => setIndex(thumbIndex)} type="button"><img alt={image.alt} src={image.src} /></button>)}</div>
      <div className="gallery-carousel__controls">
        <button onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)} type="button"><ArrowLeft size={16} />{lang === 'kk' ? '\u0410\u0440\u0442\u049b\u0430' : '\u041d\u0430\u0437\u0430\u0434'}</button>
        <div className="gallery-carousel__dots">{images.map((image, dotIndex) => <button aria-label={image.alt} className={dotIndex === index ? 'is-active' : ''} key={`${image.src}-dot-${dotIndex}`} onClick={() => setIndex(dotIndex)} type="button" />)}</div>
        <button onClick={() => setIndex((current) => (current + 1) % images.length)} type="button">{lang === 'kk' ? '\u0410\u043b\u0493\u0430' : '\u0412\u043f\u0435\u0440\u0435\u0434'}<ArrowRight size={16} /></button>
      </div>
    </div>
  );
};
const TeamExplorer: React.FC<{ data: HomeData; lang: Lang; whatsapp: string }> = ({ data, lang, whatsapp }) => {
  const [groupIndex, setGroupIndex] = useState(0);
  const [query, setQuery] = useState('');
  const tabs = [{ titleRu: ui.allTeamRu, titleKk: ui.allTeamKk, members: data.teamGroups.flatMap((group) => group.members) }, ...data.teamGroups];
  const current = tabs[groupIndex] || tabs[0];
  const members = current.members.filter((member) => `${member.name} ${member.roleRu} ${member.roleKk} ${member.groupTitleRu} ${member.groupTitleKk}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="home-section team-explorer">
      <div className="section-heading"><div><p className="section-eyebrow">{getText(lang, data.teamTitleRu, data.teamTitleKk)}</p><h2>{getText(lang, data.teamTitleRu, data.teamTitleKk)}</h2></div><p className="section-note">{getText(lang, ui.teamPromptRu, ui.teamPromptKk)}</p></div>
      <div className="team-explorer__toolbar">
        <div className="team-explorer__tabs">{tabs.map((group, index) => <button className={index === groupIndex ? 'is-active' : ''} key={`${group.titleRu}-${index}`} onClick={() => setGroupIndex(index)} type="button">{getText(lang, group.titleRu, group.titleKk)}</button>)}</div>
        <label className="team-explorer__search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={getText(lang, ui.teamSearchRu, ui.teamSearchKk)} type="search" /></label>
      </div>
      <div className="team-explorer__grid">{members.map((member) => <article className="team-explorer__card" key={`${member.name}-${member.roleRu}`}><div className="team-explorer__avatar">{member.name.charAt(0)}</div><div className="team-explorer__body"><span className="team-explorer__badge">{getText(lang, member.groupTitleRu, member.groupTitleKk)}</span><h3>{member.name}</h3><p>{getText(lang, member.roleRu, member.roleKk)}</p><div className="team-explorer__meta"><span>{getText(lang, ui.teamDepartmentRu, ui.teamDepartmentKk)}: {getText(lang, member.groupTitleRu, member.groupTitleKk)}</span></div><a className="team-explorer__cta" href={whatsapp} rel="noreferrer" target="_blank">{getText(lang, ui.teamBookRu, ui.teamBookKk)}<ArrowUpRight size={14} /></a></div></article>)}</div>
    </section>
  );
};

const ScheduleViewer: React.FC<{ sections: ScheduleSection[]; lang: Lang }> = ({ sections, lang }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = sections[activeIndex] || sections[0];
  if (!current) return null;

  return (
    <section className="home-section schedule-viewer">
      <div className="section-heading"><div><p className="section-eyebrow">{getText(lang, ui.scheduleRu, ui.scheduleKk)}</p><h2>{getText(lang, ui.scheduleRu, ui.scheduleKk)}</h2></div><p className="section-note">{getText(lang, ui.scheduleTextRu, ui.scheduleTextKk)}</p></div>
      <div className="schedule-viewer__tabs">{sections.map((section, index) => <button className={index === activeIndex ? 'is-active' : ''} key={section.titleRu} onClick={() => setActiveIndex(index)} type="button">{getText(lang, section.titleRu, section.titleKk)}</button>)}</div>
      <div className="schedule-viewer__table-wrap"><table className="schedule-table schedule-table--custom"><thead><tr>{current.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{current.rows.map((row, rowIndex) => <tr key={`${current.titleRu}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div>
    </section>
  );
};

export const HomePage: React.FC<{ lang: Lang; navItems: NavItem[]; contacts: { whatsapp: string; supportPhone: string; supportLabel: string; dentalPhone: string; dentalLabel: string; addressRu: string; addressKk: string } }> = ({ lang, navItems, contacts }) => {
  const data = useMemo(() => parseHomePage(sitePages['takhet.html'].html), []);
  const heroFacts = [
    { icon: <Users2 size={18} />, value: data.teamGroups.flatMap((group) => group.members).length.toString(), labelRu: ui.heroFactTeamRu, labelKk: ui.heroFactTeamKk },
    { icon: <Stethoscope size={18} />, value: data.services.length.toString(), labelRu: ui.heroFactServiceRu, labelKk: ui.heroFactServiceKk },
    { icon: <CalendarDays size={18} />, value: data.schedules.length.toString(), labelRu: ui.heroFactScheduleRu, labelKk: ui.heroFactScheduleKk },
  ];

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__copy"><div className="home-hero__badge"><Sparkles size={14} /><span>{getText(lang, ui.heroBadgeRu, ui.heroBadgeKk)}</span></div><p className="section-eyebrow">Takhet Medical Center</p><h1>{getText(lang, data.heroTitleRu, data.heroTitleKk)}</h1><p className="home-hero__text">{getText(lang, data.heroTextRu, data.heroTextKk)}</p><div className="home-hero__actions"><a className="header-cta" href={contacts.whatsapp} rel="noreferrer" target="_blank">{lang === 'kk' ? '\u0416\u0430\u0437\u044b\u043b\u0443' : '\u0417\u0430\u043f\u0438\u0441\u0430\u0442\u044c\u0441\u044f'}</a><a className="header-cta header-cta--ghost" href="#team-section">{getText(lang, data.teamTitleRu, data.teamTitleKk)}</a></div><div className="home-hero__facts">{heroFacts.map((fact) => <article className="home-hero__fact-card" key={fact.labelRu}><span>{fact.icon}</span><strong>{fact.value}</strong><small>{getText(lang, fact.labelRu, fact.labelKk)}</small></article>)}</div></div>
        <div className="home-hero__visual"><div className="home-hero__orb home-hero__orb--one" /><div className="home-hero__orb home-hero__orb--two" /><div className="home-hero__image-wrap"><img alt={getText(lang, data.heroTitleRu, data.heroTitleKk)} src={data.heroImage} /><div className="home-hero__floating home-hero__floating--map"><MapPin size={16} /><span>{getText(lang, contacts.addressRu, contacts.addressKk)}</span></div><div className="home-hero__floating home-hero__floating--time"><Clock3 size={16} /><span>08:00 - 17:00</span></div></div><SearchBox lang={lang} navItems={navItems} /></div>
      </section>
      <CareNavigator lang={lang} navItems={navItems} services={data.services} teamGroups={data.teamGroups} />
      <section className="home-section about-showcase"><div className="about-showcase__media"><img alt={getText(lang, data.aboutTitleRu, data.aboutTitleKk)} src={data.aboutImage} /></div><div className="about-showcase__copy"><p className="section-eyebrow">{getText(lang, data.aboutTitleRu, data.aboutTitleKk)}</p><h2>{getText(lang, data.aboutTitleRu, data.aboutTitleKk)}</h2>{(lang === 'ru' ? data.aboutParagraphsRu : data.aboutParagraphsKk).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
      <section className="home-section services-showcase" id="services-section"><div className="section-heading"><div><p className="section-eyebrow">{getText(lang, data.servicesTitleRu, data.servicesTitleKk)}</p><h2>{getText(lang, data.servicesTitleRu, data.servicesTitleKk)}</h2></div><p className="section-note">{getText(lang, ui.navigatorServicesTextRu, ui.navigatorServicesTextKk)}</p></div><div className="services-showcase__grid">{data.services.map((service, index) => <article className={`service-spotlight service-spotlight--${(index % 5) + 1}`} key={`${service.ru}-${index}`}><div className="service-spotlight__icon"><img alt={service.ru} src={service.icon} /></div><h3>{getText(lang, service.ru, service.kk)}</h3></article>)}</div></section>
      <div id="team-section"><TeamExplorer data={data} lang={lang} whatsapp={contacts.whatsapp} /></div>
      <section className="home-section gallery-section"><div className="section-heading"><div><p className="section-eyebrow">{getText(lang, ui.galleryRu, ui.galleryKk)}</p><h2>{getText(lang, data.galleryTitleRu, data.galleryTitleKk)}</h2></div><p className="section-note">{getText(lang, ui.galleryTextRu, ui.galleryTextKk)}</p></div><GalleryCarousel images={data.galleryImages} lang={lang} /></section>
      <section className="home-section patient-cards"><div className="section-heading"><div><p className="section-eyebrow">{getText(lang, ui.patientRu, ui.patientKk)}</p><h2>{getText(lang, ui.patientRu, ui.patientKk)}</h2></div><p className="section-note">{getText(lang, ui.patientTextRu, ui.patientTextKk)}</p></div><div className="patient-cards__grid">{data.patientInfo.map((card) => <article className="patient-cards__card" key={card.titleRu}><h3>{getText(lang, card.titleRu, card.titleKk)}</h3><ul>{(lang === 'ru' ? card.itemsRu : card.itemsKk).map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></section>
      <ScheduleViewer lang={lang} sections={data.schedules} />
      <section className="home-section contact-section"><div className="section-heading"><div><p className="section-eyebrow">{getText(lang, data.contactsTitleRu, data.contactsTitleKk)}</p><h2>{getText(lang, data.contactsTitleRu, data.contactsTitleKk)}</h2></div></div><div className="contact-section__grid"><div className="contact-section__map"><iframe loading="lazy" src={data.mapSrc} title={getText(lang, data.contactsTitleRu, data.contactsTitleKk)} /></div><div className="contact-section__panel"><div><p className="section-eyebrow">{lang === 'kk' ? '\u041c\u0435\u043a\u0435\u043d\u0436\u0430\u0439' : '\u0410\u0434\u0440\u0435\u0441'}</p><p>{getText(lang, contacts.addressRu, contacts.addressKk)}</p></div><div><p className="section-eyebrow">{lang === 'kk' ? '\u0416\u04b1\u043c\u044b\u0441 \u0443\u0430\u049b\u044b\u0442\u044b' : '\u0420\u0435\u0436\u0438\u043c \u0440\u0430\u0431\u043e\u0442\u044b'}</p><p>08:00 - 17:00</p></div><div><p className="section-eyebrow">{lang === 'kk' ? '\u041f\u0430\u0446\u0438\u0435\u043d\u0442\u0442\u0435\u0440\u0434\u0456 \u049b\u043e\u043b\u0434\u0430\u0443 \u049b\u044b\u0437\u043c\u0435\u0442\u0456' : '\u0421\u043b\u0443\u0436\u0431\u0430 \u043f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0438 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u043e\u0432'}</p><a href={contacts.supportPhone}>{contacts.supportLabel}</a></div><div><p className="section-eyebrow">{lang === 'kk' ? '\u0421\u0442\u043e\u043c\u0430\u0442\u043e\u043b\u043e\u0433\u0438\u044f \u0431\u04e9\u043b\u0456\u043c\u0456' : '\u0421\u0442\u043e\u043c\u0430\u0442\u043e\u043b\u043e\u0433\u0438\u044f'}</p><a href={contacts.dentalPhone}>{contacts.dentalLabel}</a></div></div></div></section>
    </main>
  );
};

export default HomePage;
