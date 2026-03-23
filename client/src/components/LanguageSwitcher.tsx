import { useLanguage } from "@/contexts/LanguageContext";
import { SiteLang } from "@/lib/translations";

const LANGS: { code: SiteLang; flag: string; label: string }[] = [
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "sv", flag: "🇸🇪", label: "Svenska" },
  { code: "en", flag: "🌍", label: "English" },
];

interface LanguageSwitcherProps {
  /** When true, show flags as large inline buttons (for the header banner area) */
  variant?: "inline" | "dropdown";
}

export default function LanguageSwitcher({ variant = "dropdown" }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-1">
        {LANGS.map(({ code, flag, label }) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            title={label}
            className={`
              relative flex items-center justify-center
              w-12 h-12 rounded-xl text-3xl
              transition-all duration-200 cursor-pointer select-none
              ${lang === code
                ? "bg-primary/20 ring-2 ring-primary shadow-lg scale-110"
                : "hover:bg-muted/60 hover:scale-105 opacity-70 hover:opacity-100"
              }
            `}
          >
            <span>{flag}</span>
            {lang === code && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default: compact dropdown button (used in top-right header toolbar)
  const current = LANGS.find((l) => l.code === lang)!;
  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1 px-2 h-8 text-sm rounded-full border border-border bg-background hover:bg-muted transition-colors"
        onClick={() => {
          // Cycle through languages on click
          const idx = LANGS.findIndex((l) => l.code === lang);
          const next = LANGS[(idx + 1) % LANGS.length];
          setLang(next.code);
        }}
        title={current.label}
      >
        <span className="text-base">{current.flag}</span>
        <span className="hidden sm:inline text-xs font-medium">{current.label}</span>
      </button>
      {/* Hover panel showing all options */}
      <div className="absolute top-full mt-1 right-0 bg-popover border border-border rounded-xl shadow-xl p-1 z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-150 min-w-[120px]">
        {LANGS.map(({ code, flag, label }) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${lang === code ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted text-foreground"}`}
          >
            <span className="text-base">{flag}</span>
            <span>{label}</span>
            {lang === code && <span className="mr-auto text-xs opacity-60">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
