import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import translationFR from './locales/fr/translation.json';

// Resources object with translations
const resources = {
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  },
  fr: {
    translation: translationFR
  }
};

i18n
  // Use language detector to automatically detect user's language
  .use(LanguageDetector)
  // Initialize react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    // Default language
    lng: localStorage.getItem('i18nextLng') || 'en',
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    // Interpolation configuration
    interpolation: {
      escapeValue: false // React already escapes values
    },
    // Enable nested keys with dots
    keySeparator: '.',
    // Options for language detection
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    }
  });

export default i18n; 