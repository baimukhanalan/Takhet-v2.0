import { useEffect, useRef } from 'react';
import { useLanguage } from '../services/useLanguage';
import type { Language } from '../services/language';

// Legacy/quarantined component. Do not mount globally: translations must use explicit t() keys.
type RuntimeTextMap = Record<string, string>;
type RuntimeTextBundle = Record<Language, RuntimeTextMap>;

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();
const textNodeOriginals = new WeakMap<Text, string>();
const translatedAttributes = ['placeholder', 'aria-label', 'title', 'alt'] as const;

const translatePattern = (text: string, lang: Language) => {
  if (lang === 'ru') return text;

  const prefixLabels: Array<[RegExp, Record<Exclude<Language, 'ru'>, string>]> = [
    [/^Ответ врача:\s*(.+)$/i, { kk: 'Дәрігер жауабы: $1', en: 'Doctor response: $1' }],
    [/^Врач:\s*(.+)$/i, { kk: 'Дәрігер: $1', en: 'Doctor: $1' }],
    [/^Пациент:\s*(.+)$/i, { kk: 'Пациент: $1', en: 'Patient: $1' }],
    [/^Дата:\s*(.+)$/i, { kk: 'Күні: $1', en: 'Date: $1' }],
    [/^Время:\s*(.+)$/i, { kk: 'Уақыты: $1', en: 'Time: $1' }],
    [/^Специальность:\s*(.+)$/i, { kk: 'Мамандығы: $1', en: 'Specialty: $1' }],
    [/^Обращение\s+#(.+)$/i, { kk: 'Өтініш #$1', en: 'Case #$1' }],
    [/^Пациент\s+(.+)$/i, { kk: 'Пациент $1', en: 'Patient $1' }],
    [/^Врач\s+(.+)$/i, { kk: 'Дәрігер $1', en: 'Doctor $1' }]
  ];

  for (const [pattern, labels] of prefixLabels) {
    if (pattern.test(text)) return text.replace(pattern, labels[lang]);
  }

  return text;
};

const getTranslation = (text: string, lang: Language, runtimeText: RuntimeTextBundle | null) => {
  const normalized = normalizeText(text);
  if (!normalized) return text;
  if (lang === 'ru') return normalized;
  return runtimeText?.[lang]?.[normalized] || translatePattern(normalized, lang);
};

const shouldSkipTextNode = (node: Text) => {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(parent.closest('script, style, textarea, [data-no-runtime-i18n]'));
};

const preserveOuterWhitespace = (original: string, translated: string) => {
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  return `${leading}${translated}${trailing}`;
};

const localizeTextNode = (node: Text, lang: Language, runtimeText: RuntimeTextBundle | null) => {
  if (shouldSkipTextNode(node)) return;

  const current = node.nodeValue || '';
  if (!textNodeOriginals.has(node)) {
    textNodeOriginals.set(node, current);
  }

  const original = textNodeOriginals.get(node) || current;
  const translated = getTranslation(original, lang, runtimeText);
  const nextValue = preserveOuterWhitespace(original, translated);
  if (current !== nextValue) {
    node.nodeValue = nextValue;
  }
};

const originalAttributeName = (attribute: string) => `data-takhet-i18n-original-${attribute}`;

const localizeElementAttributes = (element: Element, lang: Language, runtimeText: RuntimeTextBundle | null) => {
  if (element.closest('[data-no-runtime-i18n]')) return;

  for (const attribute of translatedAttributes) {
    const value = element.getAttribute(attribute);
    if (!value) continue;

    const originalAttribute = originalAttributeName(attribute);
    if (!element.hasAttribute(originalAttribute)) {
      element.setAttribute(originalAttribute, value);
    }

    const original = element.getAttribute(originalAttribute) || value;
    const translated = getTranslation(original, lang, runtimeText);
    if (value !== translated) {
      element.setAttribute(attribute, translated);
    }
  }
};

const localizeTree = (root: ParentNode, lang: Language, runtimeText: RuntimeTextBundle | null) => {
  if (root instanceof Element) {
    localizeElementAttributes(root, lang, runtimeText);
  }

  const elementWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let elementNode = elementWalker.nextNode();
  while (elementNode) {
    if (elementNode instanceof Element) {
      localizeElementAttributes(elementNode, lang, runtimeText);
    }
    elementNode = elementWalker.nextNode();
  }

  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = textWalker.nextNode();
  while (textNode) {
    if (textNode instanceof Text) {
      localizeTextNode(textNode, lang, runtimeText);
    }
    textNode = textWalker.nextNode();
  }
};

const RuntimeTextLocalizer = () => {
  const { lang } = useLanguage();
  const runtimeTextRef = useRef<RuntimeTextBundle | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applyLocalization = async () => {
      if (lang !== 'ru' && !runtimeTextRef.current) {
        const module = await import('../locales/runtimeText');
        if (cancelled) return;
        runtimeTextRef.current = module.runtimeText;
      }

      localizeTree(document.body, lang, runtimeTextRef.current);
    };

    void applyLocalization();

    const scheduleLocalization = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        void applyLocalization();
      });
    };

    const observer = new MutationObserver(scheduleLocalization);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      cancelled = true;
      observer.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [lang]);

  return null;
};

export default RuntimeTextLocalizer;
