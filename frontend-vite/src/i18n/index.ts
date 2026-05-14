import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import kk from "./locales/kk.json";

// Kazakh (kk) ships as an empty resource on purpose — it's selectable in the
// language switcher but every key falls back to English until kk.json is
// filled in. i18next does this fallback automatically per-key via fallbackLng.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "kk", label: "KK", name: "Қазақша" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      kk: { translation: kk },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ru", "kk"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "lambda_lang",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
