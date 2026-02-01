/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Show a browser notification
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  }
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsEnabled(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Save notification preferences to localStorage
 */
export function saveNotificationPreferences(preferences: {
  enabled: boolean;
  sources: string[];
}) {
  localStorage.setItem("notification_preferences", JSON.stringify(preferences));
}

/**
 * Load notification preferences from localStorage
 */
export function loadNotificationPreferences(): {
  enabled: boolean;
  sources: string[];
} {
  const stored = localStorage.getItem("notification_preferences");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse notification preferences:", e);
    }
  }
  return { enabled: false, sources: [] };
}

/**
 * Check if a news item should trigger a notification
 */
export function shouldNotify(newsSource: string, preferences: { enabled: boolean; sources: string[] }): boolean {
  if (!preferences.enabled) return false;
  if (preferences.sources.length === 0) return true; // Notify for all sources if none selected
  return preferences.sources.includes(newsSource);
}
