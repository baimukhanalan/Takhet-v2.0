import type { Language } from '../services/language';

type RuntimeTextMap = Record<string, string>;

// Legacy compatibility map only. The global DOM runtime localizer is quarantined
// and must not be used as a production translation source.
export const runtimeText: Record<Language, RuntimeTextMap> = {
  ru: {},
  kk: {},
  en: {}
} as const;
