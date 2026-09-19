import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ar from './locales/ar.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en'],
    defaultNS: 'translation',
    ns: ['translation'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'gym-system-language',
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  });

// Set initial direction
const setDirection = (lng: string) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
};

setDirection(i18n.language || 'ar');

i18n.on('languageChanged', (lng) => {
  setDirection(lng);
});

export default i18n;