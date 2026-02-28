/**
 * Translate text using MyMemory Translation API (free, no API key required)
 * @param text - Text to translate
 * @param targetLang - Target language code (ar, sv, en)
 * @param sourceLang - Source language code (optional, auto-detect if not provided)
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<string> {
  try {
    // MyMemory API - Free translation service (1000 requests/day)
    // Auto-detect source language if not provided
    const sourceLanguage = sourceLang || detectLanguage(text);
    
    // Build API URL with query parameters
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLang}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "User-Agent": "ArabiSmart News/1.0",
      },
    });

    if (!response.ok) {
      console.error("[Translator] API error:", response.status, response.statusText);
      return text;
    }

    const data = await response.json();
    
    // Check if translation was successful
    if (data.responseStatus !== 200) {
      console.warn("[Translator] Translation failed:", data.responseDetails);
      return text;
    }

    const translatedText = data.responseData?.translatedText;

    if (!translatedText) {
      console.warn("[Translator] No translation returned");
      return text;
    }

    return translatedText.trim();
  } catch (error) {
    console.error("[Translator] Error:", error);
    return text;
  }
}

/**
 * Detect language of text using simple heuristics
 * @param text - Text to analyze
 * @returns Language code (ar, sv, en, or unknown)
 */
export function detectLanguage(text: string): string {
  // Arabic detection
  const arabicPattern = /[\u0600-\u06FF]/;
  if (arabicPattern.test(text)) {
    return "ar";
  }

  // Swedish specific characters
  const swedishPattern = /[åäöÅÄÖ]/;
  if (swedishPattern.test(text)) {
    return "sv";
  }

  // Default to English for Latin script
  return "en";
}
