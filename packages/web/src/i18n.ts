import { LocalesEnum } from '@activepieces/shared';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import ICU from 'i18next-icu';

void i18n
  .use(ICU)
  .use(Backend)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: Object.values(LocalesEnum),
    keySeparator: false,
    nsSeparator: false,
    returnEmptyString: false,
  });
export default i18n;
