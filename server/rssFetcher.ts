import Parser from "rss-parser";
import { getDb } from "./db";
import { news, rssSources, fetchLogs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
    ],
  },
});

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  isoDate?: string;
  mediaContent?: any;
  mediaThumbnail?: any;
  enclosure?: any;
}

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item: RSSItem): string | null {
  // Try media:content
  if (item.mediaContent && item.mediaContent.$) {
    return item.mediaContent.$.url || null;
  }

  // Try media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$) {
    return item.mediaThumbnail.$.url || null;
  }

  // Try enclosure
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }

  // Try to extract from content
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }

  return null;
}

/**
 * Fetch and parse RSS feed from a single source
 */
export async function fetchRSSFeed(sourceId: number, sourceUrl: string, sourceName: string, category: string, language: string) {
  const db = await getDb();
  if (!db) {
    console.error("[RSS Fetcher] Database not available");
    return { success: false, itemsFetched: 0, error: "Database not available" };
  }

  try {
    console.log(`[RSS Fetcher] Fetching from: ${sourceName} (${sourceUrl})`);
    
    const feed = await parser.parseURL(sourceUrl);
    let itemsFetched = 0;

    for (const item of feed.items) {
      if (!item.link || !item.title) {
        continue; // Skip items without essential data
      }

      try {
        // Check if news already exists
        const existingNews = await db
          .select()
          .from(news)
          .where(eq(news.link, item.link))
          .limit(1);

        if (existingNews.length > 0) {
          continue; // Skip duplicate
        }

        const imageUrl = extractImageUrl(item);
        const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();

        await db.insert(news).values({
          title: item.title,
          description: item.contentSnippet || item.content?.substring(0, 500) || null,
          content: item.content || null,
          link: item.link,
          image: imageUrl,
          source: sourceName,
          category: category as "SE" | "عربية",
          language: language as "ar" | "sv" | "en",
          publishedAt: new Date(publishedAt),
          isManual: 0,
        });

        itemsFetched++;
      } catch (error: any) {
        console.error(`[RSS Fetcher] Error inserting news item: ${error.message}`);
      }
    }

    // Update last fetched time
    await db
      .update(rssSources)
      .set({ lastFetchedAt: new Date() })
      .where(eq(rssSources.id, sourceId));

    // Log success
    await db.insert(fetchLogs).values({
      sourceId,
      status: "success",
      itemsFetched,
      errorMessage: null,
    });

    console.log(`[RSS Fetcher] ✅ ${sourceName}: ${itemsFetched} new items`);
    return { success: true, itemsFetched, error: null };
  } catch (error: any) {
    console.error(`[RSS Fetcher] ❌ Error fetching ${sourceName}:`, error.message);

    // Log error
    await db.insert(fetchLogs).values({
      sourceId,
      status: "error",
      itemsFetched: 0,
      errorMessage: error.message,
    });

    return { success: false, itemsFetched: 0, error: error.message };
  }
}

/**
 * Fetch all active RSS sources
 */
export async function fetchAllRSS() {
  const db = await getDb();
  if (!db) {
    console.error("[RSS Fetcher] Database not available");
    return;
  }

  console.log("[RSS Fetcher] 🚀 Starting RSS fetch cycle...");

  try {
    const sources = await db
      .select()
      .from(rssSources)
      .where(eq(rssSources.isActive, 1));

    console.log(`[RSS Fetcher] Found ${sources.length} active sources`);

    let totalFetched = 0;
    for (const source of sources) {
      const result = await fetchRSSFeed(
        source.id,
        source.url,
        source.name,
        source.category,
        source.language
      );
      totalFetched += result.itemsFetched;
    }

    console.log(`[RSS Fetcher] ✨ Fetch cycle completed: ${totalFetched} total new items`);
  } catch (error: any) {
    console.error("[RSS Fetcher] Error in fetch cycle:", error.message);
  }
}
