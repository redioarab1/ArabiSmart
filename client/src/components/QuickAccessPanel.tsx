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
  X,
  Settings2,
  Archive,
  User,
  ChevronLeft,
  ChevronRight,
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
  const { t, lang } = useLanguage();
  const { isAuthenticated } = useAuth();
  const isRtl = lang === "ar";

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
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

  const fontSizeLabels = {
    small: lang === "ar" ? "صغير" : lang === "sv" ? "Liten" : "Small",
    medium: lang === "ar" ? "متوسط" : lang === "sv" ? "Medel" : "Medium",
    large: lang === "ar" ? "كبير" : lang === "sv" ? "Stor" : "Large",
  };

  type PanelItem = {
    id: string;
    icon: React.ElementType;
    label: string;
    action?: () => void;
    href?: string;
    badge?: number;
    color: string;
    bg: string;
    border: string;
    pulse?: boolean;
  };

  const panelItems: PanelItem[] = [
    {
      id: "theme",
      icon: theme === "dark" ? Sun : Moon,
      label: theme === "dark"
        ? (lang === "ar" ? "الوضع النهاري" : lang === "sv" ? "Ljust läge" : "Light Mode")
        : (lang === "ar" ? "الوضع الليلي" : lang === "sv" ? "Mörkt läge" : "Dark Mode"),
      action: toggleTheme ? () => { toggleTheme(); } : undefined,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
    },
    {
      id: "notifications",
      icon: Bell,
      label: lang === "ar" ? "الإشعارات" : lang === "sv" ? "Aviseringar" : "Notifications",
      href: "/notifications",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      id: "favorites",
      icon: Heart,
      label: lang === "ar" ? "المفضلة" : lang === "sv" ? "Favoriter" : "Favorites",
      href: "/favorites",
      badge: favorites > 0 ? favorites : undefined,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      border: "border-rose-200 dark:border-rose-800",
    },
    {
      id: "daily-summary",
      icon: Sparkles,
      label: lang === "ar" ? "الملخص اليومي" : lang === "sv" ? "Daglig sammanfattning" : "Daily Summary",
      href: "/daily-summary",
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      border: "border-indigo-200 dark:border-indigo-800",
      pulse: true,
    },
  ];

  const authItems = isAuthenticated
    ? [
        {
          id: "archive",
          icon: Archive,
          label: lang === "ar" ? "الأرشيف" : lang === "sv" ? "Arkiv" : "Archive",
          href: "/archive",
          badge: archived > 0 ? archived : undefined,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          border: "border-amber-200 dark:border-amber-800",
        },
        {
          id: "profile",
          icon: User,
          label: lang === "ar" ? "الملف الشخصي" : lang === "sv" ? "Profil" : "Profile",
          href: "/profile",
          color: "text-emerald-500",
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
          border: "border-emerald-200 dark:border-emerald-800",
        },
        {
          id: "settings",
          icon: Settings2,
          label: lang === "ar" ? "الإعدادات" : lang === "sv" ? "Inställningar" : "Settings",
          href: "/settings",
          color: "text-slate-500",
          bg: "bg-slate-50 dark:bg-slate-800/40",
          border: "border-slate-200 dark:border-slate-700",
        },
      ]
    : [];

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen((v) => !v)}
        className={`rounded-full transition-all duration-200 ${
          isOpen
            ? "bg-primary text-primary-foreground border-primary shadow-lg"
            : "hover:bg-primary/10"
        }`}
        title={lang === "ar" ? "الوصول السريع" : "Quick Access"}
        aria-label="Quick Access Panel"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Settings2 className="h-5 w-5" />
        )}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 ${isRtl ? "left-0" : "right-0"} h-full w-72 z-50 bg-background border-${isRtl ? "r" : "l"} shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0"
            : isRtl
            ? "-translate-x-full"
            : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Quick Access Panel"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <span className="font-bold text-base arabic-text">
              {lang === "ar" ? "الوصول السريع" : lang === "sv" ? "Snabbåtkomst" : "Quick Access"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="rounded-full h-8 w-8"
          >
            {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5">
          {/* Main Items */}
          {panelItems.map((item) => {
            const Icon = item.icon;
            const content = (
              <button
                key={item.id}
                onClick={() => {
                  if ('action' in item && item.action) item.action();
                  if (!item.href) setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border ${item.bg} ${item.border} hover:opacity-80 transition-all duration-150 group`}
              >
                <div className={`relative flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${item.bg} border ${item.border}`}>
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
                <span className={`text-sm font-medium arabic-text ${item.color} flex-1 text-${isRtl ? "right" : "left"}`}>
                  {item.label}
                </span>
              </button>
            );

            if (item.href) {
              return (
                <Link key={item.id} href={item.href} onClick={() => setIsOpen(false)}>
                  {content}
                </Link>
              );
            }
            return content;
          })}

          {/* Font Size Section */}
          <Separator className="my-2" />
          <div className="px-1">
            <div className="flex items-center gap-2 mb-2 px-2">
              <ALargeSmall className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide arabic-text">
                {lang === "ar" ? "حجم الخط" : lang === "sv" ? "Textstorlek" : "Font Size"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onFontSizeChange(size)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all duration-150 arabic-text ${
                    fontSize === size
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {fontSizeLabels[size]}
                </button>
              ))}
            </div>
          </div>

          {/* Auth Items */}
          {authItems.length > 0 && (
            <>
              <Separator className="my-2" />
              {authItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.id} href={item.href} onClick={() => setIsOpen(false)}>
                    <button className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border ${item.bg} ${item.border} hover:opacity-80 transition-all duration-150`}>
                      <div className={`relative flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${item.bg} border ${item.border}`}>
                        <Icon className={`h-5 w-5 ${item.color}`} />
                        {item.badge !== undefined && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                            {item.badge > 9 ? "9+" : item.badge}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-medium arabic-text ${item.color} flex-1 text-${isRtl ? "right" : "left"}`}>
                        {item.label}
                      </span>
                    </button>
                  </Link>
                );
              })}
            </>
          )}
        </div>

        {/* Panel Footer */}
        <div className="px-4 py-3 border-t bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground arabic-text">
            ArabiSmart News
          </p>
        </div>
      </div>
    </div>
  );
}
