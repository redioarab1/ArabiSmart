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
const GA_ID = "G-Q9N7SX7GD5";

export function useGoogleAnalytics() {
  const [location] = useLocation();

  // تتبع تغييرات الصفحة (SPA page_view events)
  // السكريبت محمّل مسبقاً من index.html
  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: location,
      page_title: document.title,
      send_to: GA_ID,
    });
  }, [location]);
}
