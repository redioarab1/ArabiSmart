import { useLanguage } from "@/contexts/LanguageContext";
import { SiteLang } from "@/lib/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LANGS: SiteLang[] = ["ar", "en", "sv"];

export default function LanguageSwitcher() {
  const { lang, setLang, langNames } = useLanguage();
  const current = langNames[lang];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 px-2 h-8 text-xs font-medium">
          <Globe className="h-3.5 w-3.5" />
          <span>{current.flag}</span>
          <span className="hidden sm:inline">{current.native}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[130px]">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLang(l)}
            className={`gap-2 cursor-pointer ${lang === l ? "font-bold bg-accent" : ""}`}
          >
            <span>{langNames[l].flag}</span>
            <span>{langNames[l].native}</span>
            {lang === l && <span className="mr-auto text-xs opacity-60">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
