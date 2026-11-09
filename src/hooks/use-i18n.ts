import { translate, type TranslationKey } from "@/i18n/translations";
import { useLocaleStore } from "@/store/use-locale-store";

export function useI18n() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return {
    locale,
    setLocale,
    t: (key: TranslationKey) => translate(locale, key),
  };
}
