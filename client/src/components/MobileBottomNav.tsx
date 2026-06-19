import { Link, useLocation } from "wouter";
import { Home, Tv, BookOpen, FileText, User, Sparkles } from "lucide-react";
import { useAuth } from "@/\_core/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "الرئيسية" },
  { href: "/live", icon: Tv, label: "البث" },
  { href: "/daily-summary", icon: FileText, label: "الملخص" },
  { href: "/AI", icon: Sparkles, label: "AI" },
  { href: "/profile", icon: User, label: "حسابي" },
];

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  // إخفاء الشريط في صفحات الإدارة وصفحات المصادقة
  const hiddenPaths = ["/admin", "/login", "/register", "/forgot-password", "/reset-password"];
  const shouldHide = hiddenPaths.some((p) => location.startsWith(p));
  if (shouldHide) return null;

  return (
    <>
      {/* مساحة فارغة أسفل الصفحة لمنع تداخل المحتوى مع الشريط */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* الشريط السفلي - يظهر فقط على الموبايل */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "bg-background/95 backdrop-blur-md border-t border-border",
          "shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
        )}
        dir="rtl"
      >
        <div className="flex items-center justify-around px-1 py-1 safe-area-pb">
          {navItems.map(({ href, icon: Icon, label }) => {
            // تحديد الصفحة النشطة
            const isActive =
              href === "/"
                ? location === "/"
                : location.startsWith(href);

            // تحديد ما إذا كان زر "حسابي" يشير لصفحة الملف الشخصي أو تسجيل الدخول
            const targetHref = href === "/profile" && !user ? "/login" : href;

            return (
              <Link key={href} href={targetHref}>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]",
                    isActive
                      ? "text-primary bg-primary/10 scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="relative">
                    <Icon
                      className={cn(
                        "transition-all duration-200",
                        isActive ? "w-5 h-5 stroke-[2.5]" : "w-5 h-5 stroke-2"
                      )}
                    />
                    {/* نقطة التمييز للصفحة النشطة */}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-none transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
