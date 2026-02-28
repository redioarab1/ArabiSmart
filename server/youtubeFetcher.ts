import Parser from "rss-parser";
import { getDb } from "./db";
import { youtubeChannels, videos } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const ARABIC_CHANNELS = [
  { name: "الجزيرة العربية", channelId: "UCfiwzLy-8yKzIbsmZTzxDgw" },
  // Additional channels can be added when their IDs are verified
];

export async function fetchYouTubeVideos(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Ensure channels exist in DB
  for (const ch of ARABIC_CHANNELS) {
    try {
      await db.insert(youtubeChannels).values({
        name: ch.name,
        channelId: ch.channelId,
        language: "ar",
        isActive: 1,
      }).onDuplicateKeyUpdate({ set: { name: ch.name } });
    } catch (_) {}
  }

  const parser = new Parser();
  let totalInserted = 0;

  for (const ch of ARABIC_CHANNELS) {
    try {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.channelId}`;
      const feed = await parser.parseURL(feedUrl);

      for (const item of (feed.items || []).slice(0, 10)) {
        const videoId = item.id?.split(":").pop() || item.link?.split("v=")[1]?.split("&")[0];
        if (!videoId) continue;

        const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        try {
          await db.insert(videos).values({
            title: item.title || "بدون عنوان",
            description: item.contentSnippet || item.content || "",
            videoId,
            thumbnail,
            channelName: ch.name,
            language: "ar",
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            isManual: 0,
          }).onDuplicateKeyUpdate({ set: { title: item.title || "بدون عنوان" } });
          totalInserted++;
        } catch (_) {}
      }
    } catch (err) {
      console.error(`[YouTube Fetcher] Error fetching ${ch.name}:`, err);
    }
  }

  return totalInserted;
}
