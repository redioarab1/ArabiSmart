/**
 * Auto-translation service for Swedish/English news articles to Arabic
 * Uses the load-balanced LLM (Groq → SambaNova → Cerebras) for translation
 */
import { invokeLLM } from "./_core/llm";

/**
 * Translate a news title and description from Swedish/English to Arabic
 * Returns null if translation fails (non-blocking)
 */
export async function translateNewsToArabic(
  title: string,
  description: string | null,
  sourceLang: "sv" | "en"
): Promise<{ translatedTitle: string; translatedDescription: string | null } | null> {
  const langName = sourceLang === "sv" ? "السويدية" : "الإنجليزية";
  const descPart = description ? `\nالملخص: ${description.substring(0, 400)}` : "";

  const prompt = `ترجم النص التالي من اللغة ${langName} إلى العربية الفصحى بأسلوب إخباري احترافي.

العنوان: ${title}${descPart}

أجب بتنسيق JSON فقط:
{
  "title": "العنوان المترجم",
  "description": "الملخص المترجم أو null إذا لم يكن هناك ملخص"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "أنت مترجم إخباري محترف. ترجم النصوص بدقة واحترافية مع الحفاظ على المعنى والأسلوب الإخباري.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "العنوان المترجم إلى العربية" },
              description: {
                type: ["string", "null"],
                description: "الملخص المترجم إلى العربية أو null",
              },
            },
            required: ["title", "description"],
            additionalProperties: false,
          },
        },
      },
      max_tokens: 600,
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    if (!parsed?.title) return null;

    return {
      translatedTitle: parsed.title,
      translatedDescription: parsed.description || null,
    };
  } catch (err: any) {
    console.error(`[AutoTranslate] Translation failed: ${err.message}`);
    return null;
  }
}
