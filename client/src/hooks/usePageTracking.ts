import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Generates or retrieves a persistent anonymous session ID
 * stored in localStorage for visitor tracking.
 */
function getOrCreateSessionId(): string {
  const key = "arabismart_sid";
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(key, sid);
  }
  return sid;
}

/**
 * usePageTracking - hook يتتبع مشاهدات الصفحات تلقائياً
 * يُستدعى مرة واحدة في App.tsx
 */
export function usePageTracking() {
  const [location] = useLocation();
  const trackMutation = trpc.analytics.trackPageView.useMutation();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    // تجنب التتبع المزدوج لنفس الصفحة
    if (lastTracked.current === location) return;
    lastTracked.current = location;

    const sessionId = getOrCreateSessionId();
    const referrer = document.referrer || "";

    // تتبع الصفحة بعد تأخير قصير لضمان اكتمال التحميل
    const timer = setTimeout(() => {
      trackMutation.mutate({
        page: location,
        referrer,
        sessionId,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [location]);
}
