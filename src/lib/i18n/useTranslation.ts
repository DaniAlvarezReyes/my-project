'use client';
import { useState, useEffect, useCallback } from 'react';
import translations, { Locale } from './translations';

const DEFAULT_LOCALE: Locale = 'es';

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale;
    if (saved && translations[saved]) setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('locale', l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    return translations[locale]?.[key] || translations[DEFAULT_LOCALE]?.[key] || fallback || key;
  }, [locale]);

  return { t, locale, setLocale, locales: Object.keys(translations) as Locale[] };
}
