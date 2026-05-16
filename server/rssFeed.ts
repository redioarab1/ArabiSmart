import { Request, Response } from "express";
import { getNewsForFeed } from "./db";

const SITE_URL = "https://arabismart.vip";
const SITE_NAME = "ArabiSmart News - عربي سمارت";
const SITE_DESC = "تابع آخر الأخبار العربية والسويدية والعالمية في مكان واحد مع ملخصات يومية بالذكاء الاصطناعي";

/**
 * Generate RSS 2.0 feed for the site - helps users subscribe and improves SEO
 */
export async function generateRSSFeed(req: Request, res: Response) {
  try {
    const recentItems = await getNewsForFeed(50);
    const buildDate = new Date().toUTCString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">\n';
    xml += "  <channel>\n";
    xml += `    <title>${escapeXml(SITE_NAME)}</title>\n`;
    xml += `    <link>${SITE_URL}</link>\n`;
    xml += `    <description>${escapeXml(SITE_DESC)}</description>\n`;
    xml += `    <language>ar</language>\n`;
    xml += `    <lastBuildDate>${buildDate}</lastBuildDate>\n`;
    xml += `    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />\n`;
    xml += `    <image>\n`;
    xml += `      <url>${SITE_URL}/icon-512x512.png</url>\n`;
    xml += `      <title>${escapeXml(SITE_NAME)}</title>\n`;
    xml += `      <link>${SITE_URL}</link>\n`;
    xml += `    </image>\n`;

    for (const item of recentItems) {
      const pubDate = new Date(item.publishedAt).toUTCString();
      const itemUrl = `${SITE_URL}/news/${item.id}`;
      const title = escapeXml(item.title || "");
      const desc = escapeXml((item.description || item.title || "").substring(0, 500));

      xml += "    <item>\n";
      xml += `      <title>${title}</title>\n`;
      xml += `      <link>${itemUrl}</link>\n`;
      xml += `      <guid isPermaLink="true">${itemUrl}</guid>\n`;
      xml += `      <description>${desc}</description>\n`;
      xml += `      <pubDate>${pubDate}</pubDate>\n`;
      if (item.source) {
        xml += `      <source url="${SITE_URL}">${escapeXml(item.source)}</source>\n`;
      }
      if (item.category) {
        xml += `      <category>${escapeXml(item.category)}</category>\n`;
      }
      if (item.image) {
        xml += `      <media:content url="${escapeXml(item.image)}" medium="image" />\n`;
      }
      xml += "    </item>\n";
    }

    xml += "  </channel>\n";
    xml += "</rss>";

    res.header("Content-Type", "application/rss+xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=1800"); // Cache 30 min
    res.send(xml);
  } catch (error) {
    console.error("[RSS Feed] Error generating feed:", error);
    res.status(500).send("Error generating RSS feed");
  }
}

/**
 * Generate Atom feed (alternative format supported by more readers)
 */
export async function generateAtomFeed(req: Request, res: Response) {
  try {
    const recentItems = await getNewsForFeed(50);
    const updated = recentItems[0]
      ? new Date(recentItems[0].publishedAt).toISOString()
      : new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ar">\n';
    xml += `  <title>${escapeXml(SITE_NAME)}</title>\n`;
    xml += `  <subtitle>${escapeXml(SITE_DESC)}</subtitle>\n`;
    xml += `  <link href="${SITE_URL}" />\n`;
    xml += `  <link rel="self" href="${SITE_URL}/atom.xml" />\n`;
    xml += `  <id>${SITE_URL}/</id>\n`;
    xml += `  <updated>${updated}</updated>\n`;
    xml += `  <icon>${SITE_URL}/icon-192x192.png</icon>\n`;
    xml += `  <logo>${SITE_URL}/icon-512x512.png</logo>\n`;

    for (const item of recentItems) {
      const pubDate = new Date(item.publishedAt).toISOString();
      const itemUrl = `${SITE_URL}/news/${item.id}`;

      xml += "  <entry>\n";
      xml += `    <title type="html">${escapeXml(item.title || "")}</title>\n`;
      xml += `    <link href="${itemUrl}" />\n`;
      xml += `    <id>${itemUrl}</id>\n`;
      xml += `    <published>${pubDate}</published>\n`;
      xml += `    <updated>${pubDate}</updated>\n`;
      if (item.description) {
        xml += `    <summary type="html">${escapeXml(item.description.substring(0, 500))}</summary>\n`;
      }
      if (item.source) {
        xml += `    <author><name>${escapeXml(item.source)}</name></author>\n`;
      }
      if (item.category) {
        xml += `    <category term="${escapeXml(item.category)}" />\n`;
      }
      xml += "  </entry>\n";
    }

    xml += "</feed>";

    res.header("Content-Type", "application/atom+xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=1800");
    res.send(xml);
  } catch (error) {
    console.error("[Atom Feed] Error generating feed:", error);
    res.status(500).send("Error generating Atom feed");
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
