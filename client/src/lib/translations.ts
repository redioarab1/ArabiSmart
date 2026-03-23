/**
 * Site-wide UI translations for Arabic, English, and Swedish
 * Used by LanguageContext to localize the entire interface
 */

export type SiteLang = "ar" | "en" | "sv";

export const translations = {
  ar: {
    // Navigation & Header
    siteName: "ArabiSmart News",
    siteSlogan: "تغطية بلا حدود، اجتمعت لتكون بين يديك في مكان واحد",
    home: "الرئيسية",
    about: "عن الموقع",
    contact: "اتصل بنا",
    privacy: "سياسة الخصوصية",
    dailySummary: "الملخص اليومي",
    search: "بحث",
    searchPlaceholder: "ابحث في الأخبار...",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    profile: "الملف الشخصي",
    admin: "لوحة التحكم",

    // News categories
    all: "الكل",
    breaking: "عاجلة 🔥",
    local: "محلية 📍",
    sports: "رياضة ⚽",
    politics: "سياسة 🏛️",
    economy: "اقتصاد 💰",
    world: "عالمية 🌍",
    video: "فيديو 📺",

    // News filters
    allSources: "جميع المصادر",
    allTimes: "كل الأوقات",
    today: "اليوم",
    thisWeek: "هذا الأسبوع",
    thisMonth: "هذا الشهر",
    filter: "تصفية",

    // News card
    readMore: "قراءة المزيد",
    readFull: "قراءة الخبر الكامل من المصدر",
    minuteRead: "دقيقة للقراءة",
    share: "مشاركة",
    save: "حفظ",
    archive: "أرشفة",
    translate: "ترجمة",
    translated: "مترجم",
    translating: "جاري الترجمة...",
    translateTo: "ترجمة إلى",
    translateToEn: "ترجمة إلى الإنجليزية",
    translateToSv: "ترجمة إلى السويدية",
    translateToAr: "ترجمة إلى العربية",
    originalText: "النص الأصلي",
    showTranslation: "عرض الترجمة",

    // News detail
    backToHome: "العودة للرئيسية",
    publishedAt: "نُشر في",
    importedAt: "استورد",
    listenPodcast: "استماع للبودكاست الصوتي",
    comments: "التعليقات",
    addComment: "أضف تعليقاً",
    submitComment: "إرسال التعليق",
    noComments: "لا توجد تعليقات بعد",

    // Daily summary
    dailySummaryTitle: "الملخص اليومي",
    generateSummary: "توليد ملخص اليوم",
    generating: "جاري التوليد...",
    topNews: "أبرز الأخبار",
    trendingTopics: "المواضيع الرائجة",
    statistics: "إحصائيات",
    totalNews: "إجمالي الأخبار",
    sources: "المصادر",

    // Footer
    footerTagline: "موقع إخباري ذكي يجمع أهم الأخبار العربية والسويدية",
    allRightsReserved: "جميع الحقوق محفوظة",

    // Misc
    loading: "جاري التحميل...",
    error: "حدث خطأ",
    retry: "إعادة المحاولة",
    noNews: "لا توجد أخبار",
    loadMore: "تحميل المزيد",
    close: "إغلاق",
    save_: "حفظ",
    cancel: "إلغاء",
    confirm: "تأكيد",
    success: "تم بنجاح",
    failed: "فشلت العملية",
    languageSwitch: "تغيير اللغة",
    dir: "rtl" as "rtl" | "ltr",
  },

  en: {
    siteName: "ArabiSmart News",
    siteSlogan: "Unlimited coverage, all in one place",
    home: "Home",
    about: "About",
    contact: "Contact",
    privacy: "Privacy Policy",
    dailySummary: "Daily Summary",
    search: "Search",
    searchPlaceholder: "Search news...",
    login: "Sign In",
    logout: "Sign Out",
    profile: "Profile",
    admin: "Admin Panel",

    all: "All",
    breaking: "Breaking 🔥",
    local: "Local 📍",
    sports: "Sports ⚽",
    politics: "Politics 🏛️",
    economy: "Economy 💰",
    world: "World 🌍",
    video: "Video 📺",

    allSources: "All Sources",
    allTimes: "All Time",
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    filter: "Filter",

    readMore: "Read More",
    readFull: "Read Full Article from Source",
    minuteRead: "min read",
    share: "Share",
    save: "Save",
    archive: "Archive",
    translate: "Translate",
    translated: "Translated",
    translating: "Translating...",
    translateTo: "Translate to",
    translateToEn: "Translate to English",
    translateToSv: "Translate to Swedish",
    translateToAr: "Translate to Arabic",
    originalText: "Original Text",
    showTranslation: "Show Translation",

    backToHome: "Back to Home",
    publishedAt: "Published",
    importedAt: "Imported",
    listenPodcast: "Listen to Podcast",
    comments: "Comments",
    addComment: "Add a comment",
    submitComment: "Submit Comment",
    noComments: "No comments yet",

    dailySummaryTitle: "Daily Summary",
    generateSummary: "Generate Today's Summary",
    generating: "Generating...",
    topNews: "Top News",
    trendingTopics: "Trending Topics",
    statistics: "Statistics",
    totalNews: "Total News",
    sources: "Sources",

    footerTagline: "Smart news platform aggregating top Arabic and Swedish news",
    allRightsReserved: "All rights reserved",

    loading: "Loading...",
    error: "An error occurred",
    retry: "Retry",
    noNews: "No news found",
    loadMore: "Load More",
    close: "Close",
    save_: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    success: "Success",
    failed: "Operation failed",
    languageSwitch: "Change Language",
    dir: "ltr" as "rtl" | "ltr",
  },

  sv: {
    siteName: "ArabiSmart News",
    siteSlogan: "Obegränsad täckning, allt på ett ställe",
    home: "Hem",
    about: "Om oss",
    contact: "Kontakt",
    privacy: "Integritetspolicy",
    dailySummary: "Daglig sammanfattning",
    search: "Sök",
    searchPlaceholder: "Sök nyheter...",
    login: "Logga in",
    logout: "Logga ut",
    profile: "Profil",
    admin: "Adminpanel",

    all: "Alla",
    breaking: "Bryta 🔥",
    local: "Lokalt 📍",
    sports: "Sport ⚽",
    politics: "Politik 🏛️",
    economy: "Ekonomi 💰",
    world: "Världen 🌍",
    video: "Video 📺",

    allSources: "Alla källor",
    allTimes: "All tid",
    today: "Idag",
    thisWeek: "Denna vecka",
    thisMonth: "Denna månad",
    filter: "Filtrera",

    readMore: "Läs mer",
    readFull: "Läs hela artikeln från källan",
    minuteRead: "min läsning",
    share: "Dela",
    save: "Spara",
    archive: "Arkivera",
    translate: "Översätt",
    translated: "Översatt",
    translating: "Översätter...",
    translateTo: "Översätt till",
    translateToEn: "Översätt till engelska",
    translateToSv: "Översätt till svenska",
    translateToAr: "Översätt till arabiska",
    originalText: "Originaltext",
    showTranslation: "Visa översättning",

    backToHome: "Tillbaka till startsidan",
    publishedAt: "Publicerad",
    importedAt: "Importerad",
    listenPodcast: "Lyssna på podcast",
    comments: "Kommentarer",
    addComment: "Lägg till en kommentar",
    submitComment: "Skicka kommentar",
    noComments: "Inga kommentarer ännu",

    dailySummaryTitle: "Daglig sammanfattning",
    generateSummary: "Generera dagens sammanfattning",
    generating: "Genererar...",
    topNews: "Toppnyheter",
    trendingTopics: "Trendande ämnen",
    statistics: "Statistik",
    totalNews: "Totala nyheter",
    sources: "Källor",

    footerTagline: "Smart nyhetsplattform som samlar de bästa arabiska och svenska nyheterna",
    allRightsReserved: "Alla rättigheter förbehållna",

    loading: "Laddar...",
    error: "Ett fel uppstod",
    retry: "Försök igen",
    noNews: "Inga nyheter hittades",
    loadMore: "Ladda mer",
    close: "Stäng",
    save_: "Spara",
    cancel: "Avbryt",
    confirm: "Bekräfta",
    success: "Lyckades",
    failed: "Åtgärden misslyckades",
    languageSwitch: "Byt språk",
    dir: "ltr" as "rtl" | "ltr",
  },
} as const;

export type TranslationKeys = keyof typeof translations.ar;

/**
 * Detect the browser/device language and map to supported site language
 */
export function detectBrowserLang(): SiteLang {
  const browserLang = navigator.language || navigator.languages?.[0] || "ar";
  const code = browserLang.toLowerCase().split("-")[0];

  if (code === "ar") return "ar";
  if (code === "sv") return "sv";
  if (code === "en") return "en";

  // Fallback: check secondary languages
  for (const lang of navigator.languages || []) {
    const c = lang.toLowerCase().split("-")[0];
    if (c === "ar") return "ar";
    if (c === "sv") return "sv";
    if (c === "en") return "en";
  }

  return "ar"; // default to Arabic
}

/**
 * Given a news article's language, return the two target translation languages
 */
export function getTranslationTargets(newsLang: "ar" | "sv" | "en"): Array<"ar" | "en" | "sv"> {
  switch (newsLang) {
    case "ar": return ["en", "sv"];
    case "sv": return ["ar", "en"];
    case "en": return ["ar", "sv"];
    default: return ["en", "sv"];
  }
}

/**
 * Language display names
 */
export const langNames: Record<SiteLang, { native: string; flag: string }> = {
  ar: { native: "العربية", flag: "🇸🇦" },
  en: { native: "English", flag: "🇬🇧" },
  sv: { native: "Svenska", flag: "🇸🇪" },
};
