import { invokeLLM } from "./_core/llm";
import { getNews, getNewsStats } from "./db";

interface DailySummaryResult {
  summary: string;
  topNews: number[];
  trendingTopics: string[];
  statistics: {
    totalNews: number;
    activeSources: number;
    arabicNews: number;
    swedishNews: number;
    englishNews: number;
  };
}

/**
 * Generate daily summary using LLM
 */
export async function generateDailySummary(
  date: Date = new Date(),
  language: "ar" | "sv" | "en" = "ar"
): Promise<DailySummaryResult> {
  // Get today's news
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch news from the last 24 hours
  const newsData = await getNews({
    limit: 100, // Get top 100 news
    page: 1,
  });

  if (!newsData.items || newsData.items.length === 0) {
    throw new Error("No news available for summary");
  }

  // Get statistics
  const stats = await getNewsStats();

  // Prepare news data for LLM
  const newsForSummary = newsData.items.slice(0, 50).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description || "",
    source: item.source,
    category: item.category,
    language: item.language,
    publishedAt: item.publishedAt,
  }));

  // Create prompt based on language
  const prompts = {
    ar: `أنت محلل أخبار ذكي. قم بتحليل الأخبار التالية وإنشاء ملخص يومي شامل باللغة العربية.

الأخبار:
${JSON.stringify(newsForSummary, null, 2)}

يرجى تقديم:
1. ملخص شامل لأهم الأخبار (3-5 فقرات)
2. قائمة بأهم 5 أخبار (IDs)
3. قائمة بالموضوعات الرائجة (5-7 موضوعات)

يجب أن يكون الملخص:
- مكتوب بأسلوب احترافي وواضح
- يغطي جميع الفئات (سياسة، اقتصاد، رياضة، تقنية، إلخ)
- يبرز الأحداث الأكثر أهمية
- يحلل الاتجاهات والأنماط`,

    sv: `Du är en intelligent nyhetsanalytiker. Analysera följande nyheter och skapa en omfattande daglig sammanfattning på svenska.

Nyheter:
${JSON.stringify(newsForSummary, null, 2)}

Vänligen ge:
1. En omfattande sammanfattning av de viktigaste nyheterna (3-5 stycken)
2. En lista över de 5 viktigaste nyheterna (IDs)
3. En lista över trendiga ämnen (5-7 ämnen)

Sammanfattningen ska vara:
- Skriven i professionell och tydlig stil
- Täcka alla kategorier (politik, ekonomi, sport, teknik, etc.)
- Lyfta fram de viktigaste händelserna
- Analysera trender och mönster`,

    en: `You are an intelligent news analyst. Analyze the following news and create a comprehensive daily summary in English.

News:
${JSON.stringify(newsForSummary, null, 2)}

Please provide:
1. A comprehensive summary of the most important news (3-5 paragraphs)
2. A list of the top 5 news items (IDs)
3. A list of trending topics (5-7 topics)

The summary should:
- Be written in professional and clear style
- Cover all categories (politics, economy, sports, technology, etc.)
- Highlight the most important events
- Analyze trends and patterns`,
  };

  // Call LLM with structured output - llama-3.3-70b-versatile للملخص اليومي (جودة عالية)
  const response = await invokeLLM({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You are a professional news analyst. Provide structured analysis in JSON format.",
      },
      {
        role: "user",
        content: prompts[language],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "daily_summary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Comprehensive daily news summary",
            },
            topNewsIds: {
              type: "array",
              items: { type: "number" },
              description: "Array of top 5 news IDs",
            },
            trendingTopics: {
              type: "array",
              items: { type: "string" },
              description: "Array of 5-7 trending topics",
            },
          },
          required: ["summary", "topNewsIds", "trendingTopics"],
          additionalProperties: false,
        },
      },
    },
  });

  // Parse LLM response
  const content = response.choices[0].message.content;
  if (!content || typeof content !== "string") {
    throw new Error("No valid content in LLM response");
  }

  const parsed = JSON.parse(content);

  // Prepare statistics
  const statistics = {
    totalNews: stats?.totalNews || 0,
    activeSources: stats?.activeSources || 0,
    arabicNews: newsData.items.filter((n: any) => n.language === "ar").length,
    swedishNews: newsData.items.filter((n: any) => n.language === "sv").length,
    englishNews: newsData.items.filter((n: any) => n.language === "en").length,
  };

  return {
    summary: parsed.summary,
    topNews: parsed.topNewsIds.slice(0, 5),
    trendingTopics: parsed.trendingTopics.slice(0, 7),
    statistics,
  };
}

/**
 * Format summary for display
 */
export function formatSummary(summary: string): string {
  // Add proper formatting for Arabic text
  return summary
    .split("\n\n")
    .map((para) => para.trim())
    .filter((para) => para.length > 0)
    .join("\n\n");
}
