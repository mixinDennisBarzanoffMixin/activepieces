import { LocalesEnum } from '@activepieces/shared';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

const files = import.meta.glob('../public/locales/*/translation.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, unknown>>;

const resources = Object.fromEntries(
  Object.entries(files).flatMap(([file, translation]) => {
    const locale = file.split('/').at(-2);
    if (!locale) return [];
    return [[locale, { translation }]];
  }),
);

i18n
  .use(ICU)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    supportedLngs: Object.values(LocalesEnum),
    keySeparator: false,
    nsSeparator: false,
    returnEmptyString: false,
  });
export default i18n;
