import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import he from './locales/he.json';

export const resources = {
  en: { translation: en },
  he: { translation: he },
} as const;

export const supportedLanguages = ['en', 'he'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

// RTL languages
export const rtlLanguages = ['he', 'ar'] as const;
export type RtlLanguage = (typeof rtlLanguages)[number];

export function isRtlLanguage(lang: string): boolean {
  return rtlLanguages.includes(lang as RtlLanguage);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: [...supportedLanguages],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'relic-ai-language',
    },
  });

export default i18n;
