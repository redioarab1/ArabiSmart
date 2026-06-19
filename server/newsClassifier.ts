import { invokeLLM, DEFAULT_MODELS } from "./_core/llm";
import { getDb } from "./db";
import { newsCategories } from "../drizzle/schema";

/**
 * Classify a single news article using AI
 * Returns array of category IDs (1-6)
 */
export async function classifyNews(title: string, description: string): Promise<number[]> {
  try {
    // تقليل حجم النص لتجنب تجاوز حدود الـ tokens
    const shortTitle = title.slice(0, 150);
    const shortDesc = (description || "").slice(0, 200);
    const prompt = `صنّف: "${shortTitle}. ${shortDesc}"
1=عاجل 2=محلي 3=رياضة 4=سياسة 5=اقتصاد 6=عالمي
JSON: {"categories":[رقم]}`;

    // استخدام llama-3.3-70b-versatile للتصنيف (حد 100K token/دقيقة)
    const response = await invokeLLM({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: 'Classify news. Return JSON: {"categories":[1]}' },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
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
