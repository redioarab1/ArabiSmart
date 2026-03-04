import cron from "node-cron";
import { fetchAllRSS } from "./rssFetcher";
import { generateDailySummary } from "./dailySummary";
import { upsertDailySummary } from "./db";

/**
 * Initialize cron jobs for automatic RSS fetching and daily summary generation
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

  // ─── Initial RSS fetch on startup ────────────────────────────────────────────
  console.log("[Cron] Running initial RSS fetch...");
  fetchAllRSS().catch((error) => {
    console.error("[Cron] Error in initial fetch:", error);
  });
}
