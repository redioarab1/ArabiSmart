import { ENV } from "./_core/env";

/**
 * Translate text using Gemini API
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[Translator] GEMINI_API_KEY not found, returning original text");
      return text;
    }

    const languageNames: Record<string, string> = {
      ar: "Arabic",
      sv: "Swedish",
      en: "English",
    };

    const targetLanguage = languageNames[targetLang] || targetLang;
    const sourceLanguage = sourceLang ? languageNames[sourceLang] || sourceLang : "auto-detect";

    const prompt = sourceLang
      ? `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only provide the translation, no explanations:\n\n${text}`
      : `Translate the following text to ${targetLanguage}. Only provide the translation, no explanations:\n\n${text}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("[Translator] API error:", response.status, response.statusText);
      return text;
    }

    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

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
