import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sun,
  Moon,
  Bell,
  Heart,
  Sparkles,
  ALargeSmall,
  Archive,
  User,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";

interface QuickAccessPanelProps {
  favorites?: number;
  archived?: number;
  fontSize: "small" | "medium" | "large";
  onFontSizeChange: (size: "small" | "medium" | "large") => void;
}

export default function QuickAccessPanel({
  favorites = 0,
  archived = 0,
  fontSize,
  onFontSizeChange,
}: QuickAccessPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { lang } = useLanguage();
  const { isAuthenticated } = useAuth();
  const isRtl = lang === "ar";

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const label = (ar: string, sv: string, en: string) =>
    lang === "ar" ? ar : lang === "sv" ? sv : en;

  const fontSizeLabels = {
    small: label("صغير", "Liten", "Small"),
    medium: label("متوسط", "Medel", "Medium"),
    large: label("كبير", "Stor", "Large"),
  };

  // ─── Items ──────────────────────────────────────────────────────────────────
  type Item = {
    id: string;
    icon: React.ElementType;
    label: string;
    href?: string;
    action?: () => void;
    badge?: number;
    color: string;
    bg: string;
    border: string;
    pulse?: boolean;
    description?: string;
  };

  const mainItems: Item[] = [
    {
      id: "theme",
      icon: theme === "dark" ? Sun : Moon,
      label: theme === "dark"
        ? label("الوضع النهاري", "Ljust läge", "Light Mode")
        : label("الوضع الليلي", "Mörkt läge", "Dark Mode"),
      description: theme === "dark"
        ? label("تفعيل الإضاءة", "Aktivera ljust", "Switch to light")
        : label("تفعيل الظلام", "Aktivera mörkt", "Switch to dark"),
      action: toggleTheme ? () => toggleTheme() : undefined,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
    },
    {
      id: "daily-summary",
      icon: Sparkles,
      label: label("الملخص اليومي", "Daglig sammanfattning", "Daily Summary"),
      description: label("ملخص ذكي للأخبار", "Smart nyhetsöversikt", "AI news digest"),
      href: "/daily-summary",
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      border: "border-indigo-200 dark:border-indigo-800",
      pulse: true,
    },
    {
      id: "notifications",
      icon: Bell,
      label: label("الإشعارات", "Aviseringar", "Notifications"),
      description: label("آخر التنبيهات", "Senaste aviseringar", "Latest alerts"),
      href: "/notifications",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      id: "favorites",
      icon: Heart,
      label: label("المفضلة", "Favoriter", "Favorites"),
      description: label("أخبارك المحفوظة", "Dina sparade nyheter", "Your saved news"),
      href: "/favorites",
      badge: favorites > 0 ? favorites : undefined,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      border: "border-rose-200 dark:border-rose-800",
    },
  ];

  const authItems: Item[] = isAuthenticated
    ? [
        {
          id: "archive",
          icon: Archive,
          label: label("الأرشيف", "Arkiv", "Archive"),
          description: label("الأخبار المؤرشفة", "Arkiverade nyheter", "Archived news"),
          href: "/archive",
          badge: archived > 0 ? archived : undefined,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          border: "border-amber-200 dark:border-amber-800",
        },
        {
          id: "profile",
          icon: User,
          label: label("الملف الشخصي", "Profil", "Profile"),
          description: label("بيانات حسابك", "Ditt konto", "Your account"),
          href: "/profile",
          color: "text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
          border: "border-emerald-200 dark:border-emerald-800",
        },
        {
          id: "settings",
          icon: SettingsIcon,
          label: label("الإعدادات", "Inställningar", "Settings"),
          description: label("ضبط التفضيلات", "Anpassa inställningar", "Customize preferences"),
          href: "/settings",
          color: "text-slate-500",
          bg: "bg-slate-50 dark:bg-slate-800/40",
          border: "border-slate-200 dark:border-slate-700",
        },
      ]
    : [];

  // ─── Item Renderer ───────────────────────────────────────────────────────────
  const renderItem = (item: Item) => {
    const Icon = item.icon;
    const inner = (
      <button
        onClick={() => {
          if (item.action) item.action();
          if (!item.href) setIsOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border ${item.bg} ${item.border} hover:opacity-80 active:scale-[0.98] transition-all duration-150`}
      >
        {/* Icon */}
        <div className={`relative flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${item.bg} border ${item.border} shadow-sm`}>
          <Icon className={`h-5 w-5 ${item.color}`} />
          {item.pulse && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
            </span>
          )}
          {item.badge !== undefined && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          )}
        </div>

        {/* Text */}
        <div className={`flex-1 text-${isRtl ? "right" : "left"} min-w-0`}>
          <p className={`text-sm font-semibold ${item.color} arabic-text leading-tight`}>
            {item.label}
          </p>
          {item.description && (
            <p className="text-xs text-muted-foreground arabic-text truncate mt-0.5">
              {item.description}
            </p>
          )}
        </div>

        {/* Arrow hint */}
        <div className="flex-shrink-0 opacity-30">
          {isRtl ? (
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>
    );

    if (item.href) {
      return (
        <Link key={item.id} href={item.href} onClick={() => setIsOpen(false)}>
          {inner}
        </Link>
      );
    }
    return <div key={item.id}>{inner}</div>;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div ref={panelRef} className="relative">
      {/* ── Trigger: Arrow tab fixed on screen edge ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={label("فتح الوصول السريع", "Öppna snabbåtkomst", "Open Quick Access")}
        aria-expanded={isOpen}
        className={`
          flex items-center justify-center
          h-10 w-6 rounded-${isRtl ? "r" : "l"}-xl
          border border-border bg-background shadow-md
          hover:bg-primary/10 hover:border-primary/40
          transition-all duration-200
          ${isOpen ? "bg-primary/10 border-primary/40" : ""}
        `}
        title={label("الوصول السريع", "Snabbåtkomst", "Quick Access")}
      >
        {isOpen ? (
          isRtl ? <ChevronLeft className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-primary" />
        ) : (
          isRtl ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* ── Overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sliding Panel ── */}
      <div
        className={`
          fixed top-0 ${isRtl ? "left-0" : "right-0"} h-full w-72 z-50
          bg-background border-${isRtl ? "r" : "l"} border-border shadow-2xl
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : isRtl ? "-translate-x-full" : "translate-x-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label={label("قائمة الوصول السريع", "Snabbåtkomstmeny", "Quick Access Menu")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm arabic-text text-foreground">
              {label("الوصول السريع", "Snabbåtkomst", "Quick Access")}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5">
          {/* Main items */}
          {mainItems.map(renderItem)}

          {/* Font Size */}
          <Separator className="my-2" />
          <div className="px-1 pb-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <ALargeSmall className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide arabic-text">
                {label("حجم الخط", "Textstorlek", "Font Size")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onFontSizeChange(size)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all duration-150 arabic-text ${
                    fontSize === size
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {fontSizeLabels[size]}
                </button>
              ))}
            </div>
          </div>

          {/* Auth items */}
          {authItems.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="space-y-1.5">
                {authItems.map(renderItem)}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t bg-muted/20 text-center">
          <p className="text-[11px] text-muted-foreground arabic-text">
            ArabiSmart News &mdash; {label("الوصول السريع", "Snabbåtkomst", "Quick Access")}
          </p>
        </div>
      </div>
    </div>
  );
}
