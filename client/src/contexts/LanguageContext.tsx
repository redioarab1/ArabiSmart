import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { SiteLang, translations, detectBrowserLang, langNames } from "@/lib/translations";

type AnyTranslation = typeof translations[SiteLang];

interface LanguageContextType {
  lang: SiteLang;
  setLang: (lang: SiteLang) => void;
  t: AnyTranslation;
  dir: "rtl" | "ltr";
  langNames: typeof langNames;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "arabismart_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SiteLang>(() => {
    // 1. Check localStorage for previously chosen language
    const stored = localStorage.getItem(STORAGE_KEY) as SiteLang | null;
    if (stored && ["ar", "en", "sv"].includes(stored)) return stored;
    // 2. Auto-detect from browser
    return detectBrowserLang();
  });

  const setLang = (newLang: SiteLang) => {
    localStorage.setItem(STORAGE_KEY, newLang);
    setLangState(newLang);
  };

  // Apply dir and lang attributes to <html> whenever language changes
  useEffect(() => {
    const dir = translations[lang].dir;
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("data-lang", lang);
  }, [lang]);

  const t = translations[lang];
  const dir = t.dir;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir, langNames }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
