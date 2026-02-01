import cron from "node-cron";
import { fetchAllRSS } from "./rssFetcher";

/**
 * Initialize cron jobs for automatic RSS fetching
 * Runs every 10 minutes
 */
export function initializeCronJobs() {
  // Schedule task to run every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("[Cron] Running scheduled RSS fetch...");
    await fetchAllRSS();
  });

  console.log("[Cron] ✅ Cron jobs initialized - RSS fetch every 10 minutes");

  // Run initial fetch on startup
  console.log("[Cron] Running initial RSS fetch...");
  fetchAllRSS().catch((error) => {
    console.error("[Cron] Error in initial fetch:", error);
  });
}
