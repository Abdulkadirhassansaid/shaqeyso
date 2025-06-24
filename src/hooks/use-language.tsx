
'use client';

import * as React from 'react';
import { translations, type Language, type Translations } from '@/lib/translations';
import { useLocalStorageState } from './use-local-storage-state';

interface LanguageContextType {
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  t: Translations[Language];
}

const LanguageContext = React.createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useLocalStorageState<Language>('shaqo-lang', 'en');

  const t = translations[language];

  // Set the lang attribute on the html tag whenever the language changes
  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = React.useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (context === null) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
