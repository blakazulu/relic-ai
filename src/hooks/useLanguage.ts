import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores';
import { isRtlLanguage, type SupportedLanguage } from '@/i18n';

export function useLanguage() {
  const { i18n } = useTranslation();
  const { language: storedLanguage, setLanguage } = useSettingsStore();

  // Sync i18n with stored language preference
  useEffect(() => {
    let targetLang: string;

    if (storedLanguage === 'system') {
      // Get browser language, fallback to 'en'
      const browserLang = navigator.language.split('-')[0];
      targetLang = ['en', 'he'].includes(browserLang) ? browserLang : 'en';
    } else {
      targetLang = storedLanguage;
    }

    if (i18n.language !== targetLang) {
      i18n.changeLanguage(targetLang);
    }
  }, [storedLanguage, i18n]);

  // Update document direction and lang attribute when language changes
  useEffect(() => {
    const isRtl = isRtlLanguage(i18n.language);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const changeLanguage = useCallback((lang: SupportedLanguage | 'system') => {
    setLanguage(lang);
    if (lang !== 'system') {
      i18n.changeLanguage(lang);
    } else {
      // When switching to system, detect browser language
      const browserLang = navigator.language.split('-')[0];
      const targetLang = ['en', 'he'].includes(browserLang) ? browserLang : 'en';
      i18n.changeLanguage(targetLang);
    }
  }, [i18n, setLanguage]);

  const toggleLanguage = useCallback(() => {
    const newLang = i18n.language === 'en' ? 'he' : 'en';
    changeLanguage(newLang);
  }, [i18n.language, changeLanguage]);

  return {
    currentLanguage: i18n.language as SupportedLanguage,
    isRtl: isRtlLanguage(i18n.language),
    changeLanguage,
    toggleLanguage,
    storedPreference: storedLanguage,
  };
}
