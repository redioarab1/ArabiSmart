import { useEffect } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * useGoogleAnalytics - يُفعِّل Google Analytics تلقائياً
 * إذا كان VITE_GA_MEASUREMENT_ID محدداً في متغيرات البيئة.
 * يتتبع تغييرات المسار (SPA navigation) تلقائياً.
 */
export function useGoogleAnalytics() {
  const [location] = useLocation();
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

  // تحميل سكريبت GA مرة واحدة عند بدء التطبيق
  useEffect(() => {
    if (!gaId || typeof window === "undefined") return;

    // تجنب التحميل المزدوج
    if (window.gtag) return;

    // إنشاء dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", gaId, { send_page_view: false });

    // تحميل سكريبت gtag.js
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
  }, [gaId]);

  // تتبع تغييرات الصفحة (SPA)
  useEffect(() => {
    if (!gaId || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: location,
      page_title: document.title,
    });
  }, [location, gaId]);
}
