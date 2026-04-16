import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'id' | 'en';

interface I18nState {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      lang: 'id',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'alpha-i18n' }
  )
);
