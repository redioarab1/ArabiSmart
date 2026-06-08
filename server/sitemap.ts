import { Request, Response } from "express";
import { getAllNewsForSitemap } from "./db";

const SITE_URL = "https://arabismart.vip";

// Google News Sitemap: ONLY articles from last 2 days (strict requirement)
const NEWS_SITEMAP_WINDOW_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  { path: "/", changefreq: "hourly", priority: "1.0", hreflang: true },
  { path: "/daily-summary", changefreq: "daily", priority: "0.9", hreflang: true },
  { path: "/videos", changefreq: "daily", priority: "0.7", hreflang: false },
  { path: "/live", changefreq: "weekly", priority: "0.7", hreflang: false },
  { path: "/archive", changefreq: "daily", priority: "0.6", hreflang: false },
  { path: "/about", changefreq: "monthly", priority: "0.8", hreflang: true },
  { path: "/contact", changefreq: "monthly", priority: "0.8", hreflang: true },
  { path: "/privacy", changefreq: "yearly", priority: "0.5", hreflang: true },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Ping Google to re-crawl sitemaps after new articles are published.
 * Called from rssFetcher after each successful fetch cycle.
 */
export async function pingGoogleSitemap(): Promise<void> {
  const sitemapUrl = encodeURIComponent(`${SITE_URL}/sitemap-news.xml`);
  const pingUrl = `https://www.google.com/ping?sitemap=${sitemapUrl}`;
  try {
    const res = await fetch(pingUrl, { method: "GET", signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      console.log("[Sitemap] ✅ Pinged Google successfully");
    } else {
      console.warn(`[Sitemap] ⚠️ Google ping returned ${res.status}`);
    }
  } catch (err) {
    // Non-critical — don't throw
    console.warn("[Sitemap] ⚠️ Google ping failed (non-critical):", (err as Error).message);
  }
}

/**
 * Sitemap Index — entry point for all sub-sitemaps.
 * Submit THIS URL to Google Search Console.
 */
export async function generateSitemapIndex(req: Request, res: Response) {
  const now = new Date().toISOString();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  const sitemaps = [
    { loc: `${SITE_URL}/sitemap.xml`, lastmod: now },
    { loc: `${SITE_URL}/sitemap-news.xml`, lastmod: now },
    { loc: `${SITE_URL}/sitemap-images.xml`, lastmod: now },
  ];

  for (const sm of sitemaps) {
    xml += "  <sitemap>\n";
    xml += `    <loc>${sm.loc}</loc>\n`;
    xml += `    <lastmod>${sm.lastmod}</lastmod>\n`;
    xml += "  </sitemap>\n";
  }

  xml += "</sitemapindex>";
  res.header("Content-Type", "application/xml; charset=utf-8");
  res.header("Cache-Control", "public, max-age=3600");
  res.send(xml);
}

/**
 * Main sitemap — static pages + all news articles (no Google News tags here).
 * Max 50,000 URLs per sitemap per Google spec.
 */
export async function generateSitemap(req: Request, res: Response) {
  try {
    const newsItems = await getAllNewsForSitemap();
    const now = new Date().toISOString();
    const twoDaysAgo = new Date(Date.now() - NEWS_SITEMAP_WINDOW_MS);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    // Static pages
    for (const page of STATIC_PAGES) {
      xml += "  <url>\n";
      xml += `    <loc>${SITE_URL}${page.path}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      if (page.hreflang) {
        xml += `    <xhtml:link rel="alternate" hreflang="ar" href="${SITE_URL}${page.path}" />\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${page.path}" />\n`;
      }
      xml += "  </url>\n";
    }

    // All news articles (no Google News tags — those belong only in sitemap-news.xml)
    for (const item of newsItems) {
      const pubDate = new Date(item.publishedAt);
      const pubISO = pubDate.toISOString();
      const isRecent = pubDate > twoDaysAgo;
      const articleLang = item.language || "ar";

      xml += "  <url>\n";
      xml += `    <loc>${SITE_URL}/news/${item.id}</loc>\n`;
      xml += `    <lastmod>${pubISO}</lastmod>\n`;
      xml += "    <changefreq>never</changefreq>\n";
      xml += `    <priority>${isRecent ? "0.8" : "0.5"}</priority>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="${articleLang}" href="${SITE_URL}/news/${item.id}" />\n`;
      xml += "  </url>\n";
    }

    xml += "</urlset>";

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=1800");
    res.send(xml);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}

/**
 * Google News Sitemap — ONLY articles from the last 48 hours.
 * Google News spec: max 1,000 articles, published within 2 days.
 * This is the sitemap to submit to Google News Publisher Center.
 */
export async function generateNewsSitemap(req: Request, res: Response) {
  try {
    const newsItems = await getAllNewsForSitemap();
    const twoDaysAgo = new Date(Date.now() - NEWS_SITEMAP_WINDOW_MS);

    // Strict filter: only last 48 hours, must have title
    const recentItems = newsItems
      .filter((item) => item.title && new Date(item.publishedAt) > twoDaysAgo)
      .slice(0, 1000); // Google News hard limit

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    for (const item of recentItems) {
      const pubISO = new Date(item.publishedAt).toISOString();
      const articleLang = item.language || "ar";
      const source = (item as any).source || "ArabiSmart News";

      xml += "  <url>\n";
      xml += `    <loc>${SITE_URL}/news/${item.id}</loc>\n`;
      xml += `    <lastmod>${pubISO}</lastmod>\n`;

      // Google News required block
      xml += "    <news:news>\n";
      xml += "      <news:publication>\n";
      xml += "        <news:name>ArabiSmart News</news:name>\n";
      xml += `        <news:language>${articleLang}</news:language>\n`;
      xml += "      </news:publication>\n";
      xml += `      <news:publication_date>${pubISO}</news:publication_date>\n`;
      xml += `      <news:title><![CDATA[${item.title}]]></news:title>\n`;
      if (item.category) {
        xml += `      <news:keywords><![CDATA[${item.category}, ${escapeXml(source)}, أخبار]]></news:keywords>\n`;
      }
      xml += "    </news:news>\n";

      // Image for rich results
      if ((item as any).image) {
        xml += "    <image:image>\n";
        xml += `      <image:loc>${escapeXml((item as any).image)}</image:loc>\n`;
        xml += `      <image:title><![CDATA[${item.title}]]></image:title>\n`;
        xml += "    </image:image>\n";
      }

      xml += "  </url>\n";
    }

    xml += "</urlset>";

    res.header("Content-Type", "application/xml; charset=utf-8");
    // Short cache: Google News crawls frequently, keep fresh
    res.header("Cache-Control", "public, max-age=300"); // 5 minutes
    res.header("X-News-Count", String(recentItems.length));
    res.send(xml);
  } catch (error) {
    console.error("[News Sitemap] Error:", error);
    res.status(500).send("Error generating news sitemap");
  }
}

/**
 * Image Sitemap — all articles with images.
 * Helps Google Images index article photos for more traffic.
 */
export async function generateImagesSitemap(req: Request, res: Response) {
  try {
    const newsItems = await getAllNewsForSitemap();
    const itemsWithImages = newsItems.filter((item) => (item as any).image);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    for (const item of itemsWithImages) {
      const pubISO = new Date(item.publishedAt).toISOString();
      xml += "  <url>\n";
      xml += `    <loc>${SITE_URL}/news/${item.id}</loc>\n`;
      xml += `    <lastmod>${pubISO}</lastmod>\n`;
      xml += "    <image:image>\n";
      xml += `      <image:loc>${escapeXml((item as any).image)}</image:loc>\n`;
      if (item.title) {
        xml += `      <image:title><![CDATA[${item.title}]]></image:title>\n`;
      }
      xml += "    </image:image>\n";
      xml += "  </url>\n";
    }

    xml += "</urlset>";

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=3600");
    res.header("X-Images-Count", String(itemsWithImages.length));
    res.send(xml);
  } catch (error) {
    console.error("[Images Sitemap] Error:", error);
    res.status(500).send("Error generating images sitemap");
  }
}
