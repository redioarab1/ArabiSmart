import { invokeLLM, DEFAULT_MODELS } from "./_core/llm";
import { getDb } from "./db";
import { newsCategories } from "../drizzle/schema";

/**
 * Classify a single news article using AI
 * Returns array of category IDs (1-6)
 */
export async function classifyNews(title: string, description: string): Promise<number[]> {
  try {
    const prompt = `أنت نظام تصنيف أخبار ذكي. قم بتصنيف الخبر التالي إلى واحد أو أكثر من التصنيفات التالية:

التصنيفات المتاحة:
1. عاجلة (breaking) - أخبار عاجلة وحوادث طارئة وأحداث مهمة
2. محلية (local) - أخبار محلية سويدية
3. رياضة (sports) - أخبار رياضية
4. سياسة (politics) - أخبار سياسية
5. اقتصاد (economy) - أخبار اقتصادية ومالية
6. عالمية (world) - أخبار عالمية ودولية

الخبر:
العنوان: ${title}
الوصف: ${description || "لا يوجد وصف"}

قم بإرجاع أرقام التصنيفات المناسبة فقط (مثال: [1, 2] أو [3] أو [4, 6])`;

    // Groq يدعم json_object فقط، بينما Forge/Gemini يدعم json_schema
    const useJsonObject = !!process.env.GROQ_API_KEY;
    const response = await invokeLLM({
      model: DEFAULT_MODELS.classification, // llama-3.1-8b-instant - سريع ورخيص للتصنيف
      messages: [
        { role: "system", content: "أنت نظام تصنيف أخبار. أرجع فقط JSON بالشكل: {\"categories\": [1, 2]}" },
        { role: "user", content: prompt },
      ],
      response_format: useJsonObject
        ? { type: "json_object" }
        : {
            type: "json_schema",
            json_schema: {
              name: "news_classification",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: { type: "integer", minimum: 1, maximum: 6 },
                    description: "Array of category IDs (1-6)",
                  },
                },
                required: ["categories"],
                additionalProperties: false,
              },
            },
          },
    });

    const message = response.choices[0]?.message;
    if (!message || !message.content || typeof message.content !== 'string') {
      console.error("[News Classifier] No response from LLM");
      return [6]; // Default to "world" category
    }

    const result = JSON.parse(message.content);
    return result.categories || [6];
  } catch (error) {
    console.error("[News Classifier] Error classifying news:", error);
    return [6]; // Default to "world" category on error
  }
}

/**
 * Classify and link a news article to categories
 */
export async function classifyAndLinkNews(newsId: number, title: string, description: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[News Classifier] Database not available");
    return;
  }

  try {
    // Get category IDs from AI
    const categoryIds = await classifyNews(title, description);

    // Insert into newsCategories table
    for (const categoryId of categoryIds) {
      try {
        await db.insert(newsCategories).values({
          newsId,
          categoryId,
        });
      } catch (err: any) {
        // Ignore duplicate key errors
        if (!err.message?.includes('Duplicate entry')) {
          throw err;
        }
      }
    }

    console.log(`[News Classifier] ✅ Classified news ${newsId} into categories: ${categoryIds.join(", ")}`);
  } catch (error) {
    console.error(`[News Classifier] Error linking news ${newsId}:`, error);
  }
}
