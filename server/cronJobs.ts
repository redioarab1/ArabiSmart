import cron from "node-cron";
import { fetchAllRSS } from "./rssFetcher";
import { generateDailySummary } from "./dailySummary";
import { upsertDailySummary } from "./db";

// ── Auto-archive old news (older than 7 days) ─────────────────────────────────
async function autoArchiveOldNews() {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return;
    const { news, archivedNews } = await import("../drizzle/schema");
    const { lt, sql } = await import("drizzle-orm");

    // Find news older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get IDs already auto-archived (userId = 0 = system)
    const alreadyArchived = await db
      .select({ newsId: archivedNews.newsId })
      .from(archivedNews);
    const archivedIds = new Set(alreadyArchived.map((a: any) => a.newsId));

    // Get old news not yet archived
    const oldNews = await db
      .select({ id: news.id })
      .from(news)
      .where(lt(news.publishedAt, sevenDaysAgo))
      .limit(300);

    const toArchive = oldNews.filter((n: any) => !archivedIds.has(n.id));

    if (toArchive.length === 0) {
      console.log("[Auto-Archive] No new items to archive");
      return;
    }

    // Insert auto-archive records with userId = 0 (system)
    await db
      .insert(archivedNews)
      .values(toArchive.map((n: any) => ({ userId: 0, newsId: n.id })))
      .onDuplicateKeyUpdate({ set: { newsId: sql`newsId` } });

    console.log(`[Auto-Archive] ✅ Auto-archived ${toArchive.length} old news items`);
  } catch (error) {
    console.error("[Auto-Archive] ❌ Error:", error);
  }
}

/**
 * Initialize cron jobs for automatic RSS fetching, daily summary, and auto-archiving
 */
export function initializeCronJobs() {
  // ─── RSS Fetch: every 10 minutes ─────────────────────────────────────────────
  cron.schedule("*/10 * * * *", async () => {
    console.log("[Cron] Running scheduled RSS fetch...");
    await fetchAllRSS();
  });
  console.log("[Cron] ✅ RSS fetch cron initialized - every 10 minutes");

  // ─── Daily Summary: every day at 07:00 AM ────────────────────────────────────
  cron.schedule("0 7 * * *", async () => {
    console.log("[Cron] 🤖 Generating daily AI summary...");
    try {
      const today = new Date();
      const summaryData = await generateDailySummary(today, "ar");
      await upsertDailySummary({
        date: today,
        summary: summaryData.summary,
        topNews: JSON.stringify(summaryData.topNews),
        trendingTopics: JSON.stringify(summaryData.trendingTopics),
        statistics: JSON.stringify(summaryData.statistics),
        language: "ar",
      });
      console.log("[Cron] ✅ Daily summary generated and saved successfully");
    } catch (error) {
      console.error("[Cron] ❌ Error generating daily summary:", error);
    }
  });
  console.log("[Cron] ✅ Daily summary cron initialized - runs every day at 07:00 AM");

  // ─── Auto-Archive: every day at 02:00 AM ─────────────────────────────────────
  cron.schedule("0 2 * * *", async () => {
    console.log("[Cron] 🗄️ Running auto-archive for old news...");
    await autoArchiveOldNews();
  });
  console.log("[Cron] ✅ Auto-archive cron initialized - runs every day at 02:00 AM");

  // ─── Initial RSS fetch on startup ────────────────────────────────────────────
  console.log("[Cron] Running initial RSS fetch...");
  fetchAllRSS().catch((error) => {
    console.error("[Cron] Error in initial fetch:", error);
  });
}
