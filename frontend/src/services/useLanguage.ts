import { useState, useEffect } from 'react';
import { MockDB } from './db';
import { translations, Language } from './i18n';

export const useLanguage = () => {
  const [lang, setLang] = useState<Language>(MockDB.getLang());

  useEffect(() => {
    const handleUpdate = () => setLang(MockDB.getLang());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const tObject = translations[lang];
  const t = (path: string) => {
    if (typeof path !== 'string') return path;
    const keys = path.split('.');
    let current: any = tObject;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return path;
      }
    }
    return current;
  };

  // Attach properties for object-like access (t.key.subkey)
  Object.assign(t, tObject);

  const setLanguage = (newLang: Language) => {
    MockDB.setLang(newLang);
    setLang(newLang);
  };

  const toggleLang = () => {
    const newLang = lang === 'ru' ? 'kz' : 'ru';
    setLanguage(newLang);
  };

  return { lang, t: t as any, toggleLang, setLanguage };
};
