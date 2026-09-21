import { create } from "zustand";

import type { AppLocale } from "@/i18n/translations";

type LocaleState = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "vi",
  setLocale: (locale) => set({ locale }),
}));
