/**
 * حساب وقت القراءة المقدر بناءً على عدد الكلمات
 * متوسط سرعة القراءة: 200 كلمة/دقيقة للعربية، 250 كلمة/دقيقة للإنجليزية
 */
export function calculateReadingTime(text: string, language: "ar" | "en" | "sv" = "ar"): string {
  if (!text) return "< 1 دقيقة";

  // إزالة HTML tags إذا وجدت
  const cleanText = text.replace(/<[^>]*>/g, "");
  
  // حساب عدد الكلمات
  const wordCount = cleanText.trim().split(/\s+/).length;
  
  // تحديد سرعة القراءة حسب اللغة
  const wordsPerMinute = language === "ar" ? 200 : language === "sv" ? 220 : 250;
  
  // حساب الوقت بالدقائق
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  if (minutes < 1) {
    return "< 1 دقيقة";
  } else if (minutes === 1) {
    return "دقيقة واحدة";
  } else if (minutes === 2) {
    return "دقيقتان";
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
