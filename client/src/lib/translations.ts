/**
 * Site-wide UI translations for Arabic, English, and Swedish
 * Used by LanguageContext to localize the entire interface
 * NOTE: News content itself is NOT translated automatically — only UI elements
 */

export type SiteLang = "ar" | "en" | "sv";

export const translations = {
  ar: {
    dir: "rtl" as "rtl" | "ltr",

    // ── Navigation & Header ──
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
    settings: "الإعدادات",
    admin: "لوحة التحكم",
    notifications: "الإشعارات",
    favorites: "المفضلة",
    archive: "الأرشيف",
    folders: "المجلدات",
    liveTV: "البث المباشر",

    // ── News categories (tabs) ──
    catAll: "الكل",
    catBreaking: "عاجلة",
    catLocal: "محلية",
    catSports: "رياضة",
    catPolitics: "سياسة",
    catEconomy: "اقتصاد",
    catWorld: "عالمية",
    catVideo: "فيديو",
    catArabic: "أخبار عربية",
    catSwedish: "أخبار سويدية",
    catInternational: "أخبار دولية",

    // ── Filters ──
    allSources: "جميع المصادر",
    allTimes: "كل الأوقات",
    today: "اليوم",
    thisWeek: "هذا الأسبوع",
    thisMonth: "هذا الشهر",
    filter: "تصفية",
    sortBy: "ترتيب حسب",
    newest: "الأحدث",
    mostRated: "الأعلى تقييماً",
    mostCommented: "الأكثر تعليقاً",
    allCategories: "جميع الفئات",

    // ── News card ──
    readMore: "قراءة المزيد",
    readFull: "قراءة الخبر الكامل من المصدر",
    minuteRead: "دقيقة للقراءة",
    share: "مشاركة",
    save: "حفظ",
    archiveNews: "أرشفة",
    unarchive: "إلغاء الأرشفة",
    addToFolder: "إضافة إلى مجلد",
    translate: "ترجمة",
    translated: "تمت الترجمة بنجاح",
    translating: "جاري الترجمة...",
    translateTo: "ترجمة إلى",
    translateToEn: "ترجمة إلى الإنجليزية",
    translateToSv: "ترجمة إلى السويدية",
    translateToAr: "ترجمة إلى العربية",
    originalText: "النص الأصلي",
    showTranslation: "عرض الترجمة",
    fetchBreaking: "جلب أخبار عاجلة",
    fetching: "جاري الجلب...",

    // ── News detail ──
    backToHome: "العودة للرئيسية",
    publishedAt: "نُشر في",
    importedAt: "استورد",
    listenPodcast: "استماع للبودكاست الصوتي",
    comments: "التعليقات",
    addComment: "أضف تعليقاً",
    submitComment: "إرسال التعليق",
    noComments: "لا توجد تعليقات بعد",
    rateArticle: "قيّم الخبر",
    yourRating: "تقييمك",
    avgRating: "متوسط التقييم",

    // ── Daily summary ──
    dailySummaryTitle: "الملخص اليومي",
    generateSummary: "توليد ملخص اليوم",
    generating: "جاري التوليد...",
    topNews: "أبرز الأخبار",
    trendingTopics: "المواضيع الرائجة",
    statistics: "إحصائيات",
    totalNewsCount: "إجمالي الأخبار",
    sourcesCount: "المصادر",
    downloadPdf: "تحميل PDF",
    downloadPng: "تحميل صورة",
    shareOnWhatsapp: "مشاركة على واتساب",
    shareOnTelegram: "مشاركة على تيليجرام",
    shareOnFacebook: "مشاركة على فيسبوك",
    copyLink: "نسخ الرابط",
    noSummaryYet: "لا يوجد ملخص لهذا اليوم بعد",
    selectDate: "اختر التاريخ",

    // ── Favorites ──
    favoritesTitle: "المفضلة",
    noFavorites: "لا توجد أخبار في المفضلة",
    removeFromFavorites: "إزالة من المفضلة",
    addToFavorites: "إضافة إلى المفضلة",

    // ── Archive ──
    archiveTitle: "أرشيف الأخبار",
    noArchive: "لا توجد أخبار في الأرشيف",
    archivedOn: "أُرشف في",

    // ── Profile ──
    profileTitle: "الملف الشخصي",
    memberSince: "عضو منذ",
    totalComments: "إجمالي التعليقات",
    avgRatingGiven: "متوسط التقييمات",
    savedNews: "الأخبار المحفوظة",
    readingActivity: "نشاط القراءة",
    recentComments: "آخر التعليقات",

    // ── Settings ──
    settingsTitle: "إعدادات الحساب",
    editName: "تعديل الاسم",
    editEmail: "تعديل البريد الإلكتروني",
    changePassword: "تغيير كلمة المرور",
    changeAvatar: "تغيير الصورة الشخصية",
    deleteAccount: "حذف الحساب",
    privacySettings: "إعدادات الخصوصية",
    saveChanges: "حفظ التغييرات",
    saving: "جاري الحفظ...",

    // ── Notifications ──
    notificationsTitle: "الإشعارات",
    enableNotifications: "تفعيل الإشعارات",
    notificationSources: "مصادر الإشعارات",
    noNotifications: "لا توجد إشعارات",
    markAllRead: "تعليم الكل كمقروء",

    // ── Search ──
    searchTitle: "البحث المتقدم",
    searchResults: "نتائج البحث",
    noResults: "لا توجد نتائج",
    dateFrom: "من تاريخ",
    dateTo: "إلى تاريخ",
    savedSearches: "عمليات البحث المحفوظة",
    saveSearch: "حفظ البحث",

    // ── Footer ──
    footerTagline: "موقع إخباري ذكي يجمع أهم الأخبار العربية والسويدية",
    allRightsReserved: "جميع الحقوق محفوظة",
    followUs: "تابعنا",

    // ── About ──
    aboutTitle: "عن ArabiSmart News",
    aboutMission: "مهمتنا",
    aboutTeam: "فريق العمل",
    aboutContent: "موقع ArabiSmart News هو منصة إخبارية ذكية تجمع أهم الأخبار العربية والسويدية والدولية في مكان واحد.",

    // ── Contact ──
    contactTitle: "اتصل بنا",
    contactName: "الاسم",
    contactEmail: "البريد الإلكتروني",
    contactSubject: "الموضوع",
    contactMessage: "الرسالة",
    contactSend: "إرسال الرسالة",
    contactSending: "جاري الإرسال...",
    contactSuccess: "تم إرسال رسالتك بنجاح",

    // ── Privacy ──
    privacyTitle: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث",

    // ── Misc ──
    loading: "جاري التحميل...",
    error: "حدث خطأ",
    retry: "إعادة المحاولة",
    noNews: "لا توجد أخبار",
    loadMore: "تحميل المزيد",
    close: "إغلاق",
    cancel: "إلغاء",
    confirm: "تأكيد",
    success: "تم بنجاح",
    failed: "فشلت العملية",
    languageSwitch: "تغيير اللغة",
    darkMode: "الوضع الداكن",
    lightMode: "الوضع الفاتح",
    fontSize: "حجم الخط",
    fontSmall: "خط صغير",
    fontMedium: "خط متوسط",
    fontLarge: "خط كبير",
    news: "خبر",
    source: "مصدر",
    copyLinkSuccess: "تم نسخ الرابط",
    whatsapp: "واتساب",
    twitter: "تويتر",
    facebook: "فيسبوك",
    telegram: "تيليجرام",
    email: "البريد الإلكتروني",
    copyFull: "نسخ الكامل",
  },

  en: {
    dir: "ltr" as "rtl" | "ltr",

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
    settings: "Settings",
    admin: "Admin Panel",
    notifications: "Notifications",
    favorites: "Favorites",
    archive: "Archive",
    folders: "Folders",
    liveTV: "Live TV",

    catAll: "All",
    catBreaking: "Breaking",
    catLocal: "Local",
    catSports: "Sports",
    catPolitics: "Politics",
    catEconomy: "Economy",
    catWorld: "World",
    catVideo: "Video",
    catArabic: "Arabic News",
    catSwedish: "Swedish News",
    catInternational: "International",

    allSources: "All Sources",
    allTimes: "All Time",
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    filter: "Filter",
    sortBy: "Sort by",
    newest: "Newest",
    mostRated: "Top Rated",
    mostCommented: "Most Commented",
    allCategories: "All Categories",

    readMore: "Read More",
    readFull: "Read Full Article from Source",
    minuteRead: "min read",
    share: "Share",
    save: "Save",
    archiveNews: "Archive",
    unarchive: "Unarchive",
    addToFolder: "Add to Folder",
    translate: "Translate",
    translated: "Translation successful",
    translating: "Translating...",
    translateTo: "Translate to",
    translateToEn: "Translate to English",
    translateToSv: "Translate to Swedish",
    translateToAr: "Translate to Arabic",
    originalText: "Original Text",
    showTranslation: "Show Translation",
    fetchBreaking: "Fetch Breaking News",
    fetching: "Fetching...",

    backToHome: "Back to Home",
    publishedAt: "Published",
    importedAt: "Imported",
    listenPodcast: "Listen to Podcast",
    comments: "Comments",
    addComment: "Add a comment",
    submitComment: "Submit Comment",
    noComments: "No comments yet",
    rateArticle: "Rate this article",
    yourRating: "Your rating",
    avgRating: "Average rating",

    dailySummaryTitle: "Daily Summary",
    generateSummary: "Generate Today's Summary",
    generating: "Generating...",
    topNews: "Top News",
    trendingTopics: "Trending Topics",
    statistics: "Statistics",
    totalNewsCount: "Total News",
    sourcesCount: "Sources",
    downloadPdf: "Download PDF",
    downloadPng: "Download Image",
    shareOnWhatsapp: "Share on WhatsApp",
    shareOnTelegram: "Share on Telegram",
    shareOnFacebook: "Share on Facebook",
    copyLink: "Copy Link",
    noSummaryYet: "No summary available for this day yet",
    selectDate: "Select Date",

    favoritesTitle: "Favorites",
    noFavorites: "No saved news",
    removeFromFavorites: "Remove from Favorites",
    addToFavorites: "Add to Favorites",

    archiveTitle: "News Archive",
    noArchive: "No archived news",
    archivedOn: "Archived on",

    profileTitle: "Profile",
    memberSince: "Member since",
    totalComments: "Total Comments",
    avgRatingGiven: "Average Rating Given",
    savedNews: "Saved News",
    readingActivity: "Reading Activity",
    recentComments: "Recent Comments",

    settingsTitle: "Account Settings",
    editName: "Edit Name",
    editEmail: "Edit Email",
    changePassword: "Change Password",
    changeAvatar: "Change Avatar",
    deleteAccount: "Delete Account",
    privacySettings: "Privacy Settings",
    saveChanges: "Save Changes",
    saving: "Saving...",

    notificationsTitle: "Notifications",
    enableNotifications: "Enable Notifications",
    notificationSources: "Notification Sources",
    noNotifications: "No notifications",
    markAllRead: "Mark All as Read",

    searchTitle: "Advanced Search",
    searchResults: "Search Results",
    noResults: "No results found",
    dateFrom: "From Date",
    dateTo: "To Date",
    savedSearches: "Saved Searches",
    saveSearch: "Save Search",

    footerTagline: "Smart news platform aggregating top Arabic and Swedish news",
    allRightsReserved: "All rights reserved",
    followUs: "Follow Us",

    aboutTitle: "About ArabiSmart News",
    aboutMission: "Our Mission",
    aboutTeam: "Our Team",
    aboutContent: "ArabiSmart News is a smart news platform that aggregates the most important Arabic, Swedish, and international news in one place.",

    contactTitle: "Contact Us",
    contactName: "Name",
    contactEmail: "Email",
    contactSubject: "Subject",
    contactMessage: "Message",
    contactSend: "Send Message",
    contactSending: "Sending...",
    contactSuccess: "Your message has been sent successfully",

    privacyTitle: "Privacy Policy",
    lastUpdated: "Last updated",

    loading: "Loading...",
    error: "An error occurred",
    retry: "Retry",
    noNews: "No news found",
    loadMore: "Load More",
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    success: "Success",
    failed: "Operation failed",
    languageSwitch: "Change Language",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    fontSize: "Font Size",
    fontSmall: "Small",
    fontMedium: "Medium",
    fontLarge: "Large",
    news: "news",
    source: "source",
    copyLinkSuccess: "Link copied",
    whatsapp: "WhatsApp",
    twitter: "Twitter",
    facebook: "Facebook",
    telegram: "Telegram",
    email: "Email",
    copyFull: "Copy Full",
  },

  sv: {
    dir: "ltr" as "rtl" | "ltr",

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
    settings: "Inställningar",
    admin: "Adminpanel",
    notifications: "Aviseringar",
    favorites: "Favoriter",
    archive: "Arkiv",
    folders: "Mappar",
    liveTV: "Live TV",

    catAll: "Alla",
    catBreaking: "Bryta",
    catLocal: "Lokalt",
    catSports: "Sport",
    catPolitics: "Politik",
    catEconomy: "Ekonomi",
    catWorld: "Världen",
    catVideo: "Video",
    catArabic: "Arabiska nyheter",
    catSwedish: "Svenska nyheter",
    catInternational: "Internationellt",

    allSources: "Alla källor",
    allTimes: "All tid",
    today: "Idag",
    thisWeek: "Denna vecka",
    thisMonth: "Denna månad",
    filter: "Filtrera",
    sortBy: "Sortera efter",
    newest: "Nyaste",
    mostRated: "Högst betyg",
    mostCommented: "Mest kommenterade",
    allCategories: "Alla kategorier",

    readMore: "Läs mer",
    readFull: "Läs hela artikeln från källan",
    minuteRead: "min läsning",
    share: "Dela",
    save: "Spara",
    archiveNews: "Arkivera",
    unarchive: "Avarkivera",
    addToFolder: "Lägg till i mapp",
    translate: "Översätt",
    translated: "Översättning lyckades",
    translating: "Översätter...",
    translateTo: "Översätt till",
    translateToEn: "Översätt till engelska",
    translateToSv: "Översätt till svenska",
    translateToAr: "Översätt till arabiska",
    originalText: "Originaltext",
    showTranslation: "Visa översättning",
    fetchBreaking: "Hämta senaste nyheter",
    fetching: "Hämtar...",

    backToHome: "Tillbaka till startsidan",
    publishedAt: "Publicerad",
    importedAt: "Importerad",
    listenPodcast: "Lyssna på podcast",
    comments: "Kommentarer",
    addComment: "Lägg till en kommentar",
    submitComment: "Skicka kommentar",
    noComments: "Inga kommentarer ännu",
    rateArticle: "Betygsätt artikeln",
    yourRating: "Ditt betyg",
    avgRating: "Genomsnittligt betyg",

    dailySummaryTitle: "Daglig sammanfattning",
    generateSummary: "Generera dagens sammanfattning",
    generating: "Genererar...",
    topNews: "Toppnyheter",
    trendingTopics: "Trendande ämnen",
    statistics: "Statistik",
    totalNewsCount: "Totala nyheter",
    sourcesCount: "Källor",
    downloadPdf: "Ladda ner PDF",
    downloadPng: "Ladda ner bild",
    shareOnWhatsapp: "Dela på WhatsApp",
    shareOnTelegram: "Dela på Telegram",
    shareOnFacebook: "Dela på Facebook",
    copyLink: "Kopiera länk",
    noSummaryYet: "Ingen sammanfattning tillgänglig för denna dag ännu",
    selectDate: "Välj datum",

    favoritesTitle: "Favoriter",
    noFavorites: "Inga sparade nyheter",
    removeFromFavorites: "Ta bort från favoriter",
    addToFavorites: "Lägg till i favoriter",

    archiveTitle: "Nyhetsarkiv",
    noArchive: "Inga arkiverade nyheter",
    archivedOn: "Arkiverad den",

    profileTitle: "Profil",
    memberSince: "Medlem sedan",
    totalComments: "Totala kommentarer",
    avgRatingGiven: "Genomsnittligt betyg givet",
    savedNews: "Sparade nyheter",
    readingActivity: "Läsaktivitet",
    recentComments: "Senaste kommentarer",

    settingsTitle: "Kontoinställningar",
    editName: "Redigera namn",
    editEmail: "Redigera e-post",
    changePassword: "Ändra lösenord",
    changeAvatar: "Ändra avatar",
    deleteAccount: "Radera konto",
    privacySettings: "Sekretessinställningar",
    saveChanges: "Spara ändringar",
    saving: "Sparar...",

    notificationsTitle: "Aviseringar",
    enableNotifications: "Aktivera aviseringar",
    notificationSources: "Aviseringskällor",
    noNotifications: "Inga aviseringar",
    markAllRead: "Markera alla som lästa",

    searchTitle: "Avancerad sökning",
    searchResults: "Sökresultat",
    noResults: "Inga resultat hittades",
    dateFrom: "Från datum",
    dateTo: "Till datum",
    savedSearches: "Sparade sökningar",
    saveSearch: "Spara sökning",

    footerTagline: "Smart nyhetsplattform som samlar de bästa arabiska och svenska nyheterna",
    allRightsReserved: "Alla rättigheter förbehållna",
    followUs: "Följ oss",

    aboutTitle: "Om ArabiSmart News",
    aboutMission: "Vårt uppdrag",
    aboutTeam: "Vårt team",
    aboutContent: "ArabiSmart News är en smart nyhetsplattform som samlar de viktigaste arabiska, svenska och internationella nyheterna på ett ställe.",

    contactTitle: "Kontakta oss",
    contactName: "Namn",
    contactEmail: "E-post",
    contactSubject: "Ämne",
    contactMessage: "Meddelande",
    contactSend: "Skicka meddelande",
    contactSending: "Skickar...",
    contactSuccess: "Ditt meddelande har skickats",

    privacyTitle: "Integritetspolicy",
    lastUpdated: "Senast uppdaterad",

    loading: "Laddar...",
    error: "Ett fel uppstod",
    retry: "Försök igen",
    noNews: "Inga nyheter hittades",
    loadMore: "Ladda mer",
    close: "Stäng",
    cancel: "Avbryt",
    confirm: "Bekräfta",
    success: "Lyckades",
    failed: "Åtgärden misslyckades",
    languageSwitch: "Byt språk",
    darkMode: "Mörkt läge",
    lightMode: "Ljust läge",
    fontSize: "Teckenstorlek",
    fontSmall: "Liten",
    fontMedium: "Medium",
    fontLarge: "Stor",
    news: "nyheter",
    source: "källa",
    copyLinkSuccess: "Länk kopierad",
    whatsapp: "WhatsApp",
    twitter: "Twitter",
    facebook: "Facebook",
    telegram: "Telegram",
    email: "E-post",
    copyFull: "Kopiera allt",
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
