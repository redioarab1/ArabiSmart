/**
 * حساب وقت القراءة المقدر بناءً على عدد الكلمات
 * متوسط سرعة القراءة: 200 كلمة/دقيقة للعربية، 250 كلمة/دقيقة للإنجليزية
 */
export function calculateReadingTime(text: string, language: "ar" | "en" | "sv" = "ar", title?: string): string {
  // دمج العنوان مع النص لحساب أدق (يُفيد لأخبار RSS القصيرة كـ RT Arabic)
  const combined = [title || "", text || ""].join(" ").trim();
  if (!combined) return "2 دقيقة";

  // إزالة HTML tags إذا وجدت
  const cleanText = combined.replace(/<[^>]*>/g, "");

  // حساب عدد الكلمات
  const wordCount = cleanText.trim().split(/\s+/).filter(w => w.length > 0).length;

  // تحديد سرعة القراءة حسب اللغة
  const wordsPerMinute = language === "ar" ? 200 : language === "sv" ? 220 : 250;

  // حساب الوقت بالدقائق مع حد أدنى 2 دقيقة لأخبار RSS القصيرة
  const rawMinutes = wordCount / wordsPerMinute;
  const minutes = Math.max(2, Math.ceil(rawMinutes));

  if (minutes === 2) {
    return "2 دقيقة";
  } else if (minutes === 3) {
    return "3 دقائق";
  } else if (minutes <= 10) {
    return `${minutes} دقائق`;
  } else {
    return `${minutes} دقيقة`;
  }
}

/**
 * تحديد لغة النص تلقائياً
 */
export function detectLanguage(text: string): "ar" | "en" | "sv" {
  if (!text) return "ar";

  // فحص وجود أحرف عربية
  const arabicChars = text.match(/[\u0600-\u06FF]/g);
  if (arabicChars && arabicChars.length > text.length * 0.3) {
    return "ar";
  }

  // فحص وجود أحرف سويدية
  const swedishChars = text.match(/[åäöÅÄÖ]/g);
  if (swedishChars && swedishChars.length > 0) {
    return "sv";
  }

  return "en";
}
