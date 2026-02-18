import Parser from "rss-parser";
import { getDb } from "./db";
import { videos, youtubeChannels } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const parser = new Parser({
  customFields: {
    item: [
      ["media:group", "mediaGroup"],
      ["yt:videoId", "videoId"],
      ["yt:channelId", "channelId"],
    ],
  },
});

interface YouTubeRSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  videoId?: string;
  channelId?: string;
  mediaGroup?: {
    "media:title"?: string;
    "media:description"?: string;
    "media:thumbnail"?: { $: { url: string } }[];
  };
}

/**
 * Fetch videos from a YouTube channel RSS feed
 */
export async function fetchYouTubeChannelVideos(channelId: string) {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    console.log(`[YouTube RSS] Fetching from channel: ${channelId}`);

    const feed = await parser.parseURL(rssUrl);
    
    if (!feed.items || feed.items.length === 0) {
      console.log(`[YouTube RSS] No videos found for channel: ${channelId}`);
      return 0;
    }

    // Get channel info from database
    const db = await getDb();
    if (!db) return 0;

    const [channel] = await db
      .select()
      .from(youtubeChannels)
      .where(eq(youtubeChannels.channelId, channelId))
      .limit(1);

    if (!channel) {
      console.log(`[YouTube RSS] Channel not found in database: ${channelId}`);
      return 0;
    }

    let newVideosCount = 0;

    for (const item of feed.items as unknown as YouTubeRSSItem[]) {
      try {
        const videoId = item.videoId || item.link?.split("v=")[1];
        if (!videoId) continue;

        // Check if video already exists
        const [existingVideo] = await db
          .select()
          .from(videos)
          .where(eq(videos.videoId, videoId))
          .limit(1);

        if (existingVideo) continue;

        const title = item.title || item.mediaGroup?.["media:title"] || "";
        const description = item.mediaGroup?.["media:description"] || "";
        const thumbnail =
          item.mediaGroup?.["media:thumbnail"]?.[0]?.$.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        await db.insert(videos).values({
          videoId,
          title,
          description,
          thumbnail,
          channelId: channel.channelId,
          channelTitle: channel.channelTitle,
          publishedAt,
          language: channel.language,
          category: channel.category,
        });

        newVideosCount++;
      } catch (error) {
        console.error(`[YouTube RSS] Error processing video:`, error);
      }
    }

    // Update last fetched timestamp
    await db
      .update(youtubeChannels)
      .set({ lastFetchedAt: new Date() })
      .where(eq(youtubeChannels.channelId, channelId));

    console.log(`[YouTube RSS] ✅ ${channel.channelTitle}: ${newVideosCount} new videos`);
    return newVideosCount;
  } catch (error) {
    console.error(`[YouTube RSS] ❌ Error fetching channel ${channelId}:`, error);
    return 0;
  }
}

/**
 * Fetch videos from all active YouTube channels
 */
export async function fetchAllYouTubeVideos() {
  console.log("[YouTube RSS] Starting to fetch videos from all channels...");

  const db = await getDb();
  if (!db) return 0;

  const activeChannels = await db
    .select()
    .from(youtubeChannels)
    .where(eq(youtubeChannels.isActive, 1));

  let totalNewVideos = 0;

  for (const channel of activeChannels) {
    const count = await fetchYouTubeChannelVideos(channel.channelId);
    totalNewVideos += count;
    
    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`[YouTube RSS] ✅ Total new videos fetched: ${totalNewVideos}`);
  return totalNewVideos;
}
