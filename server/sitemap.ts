import { Request, Response } from "express";
import { getAllNewsForSitemap } from "./db";

const SITE_URL = "https://arabismart.vip";

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
 * Generate Sitemap Index pointing to sub-sitemaps
 * SEO best practice: split large sitemaps into index + sub-sitemaps
 */
export async function generateSitemapIndex(req: Request, res: Response) {
  const now = new Date().toISOString();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += "  <sitemap>\n";
  xml += `    <loc>${SITE_URL}/sitemap.xml</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += "  </sitemap>\n";
  xml += "  <sitemap>\n";
  xml += `    <loc>${SITE_URL}/sitemap-news.xml</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += "  </sitemap>\n";
  xml += "</sitemapindex>";

  res.header("Content-Type", "application/xml; charset=utf-8");
  res.header("Cache-Control", "public, max-age=3600");
  res.send(xml);
}

/**
 * Generate dynamic XML sitemap including all news articles
 * Supports Google News Sitemap format + Image Sitemap
 * SEO: includes hreflang, image:image, and proper priorities
 */
export async function generateSitemap(req: Request, res: Response) {
  try {
    const newsItems = await getAllNewsForSitemap();
    const now = new Date().toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

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

    // News articles
    for (const item of newsItems) {
      const pubDate = new Date(item.publishedAt);
      const pubISO = pubDate.toISOString();
      const isRecent = pubDate > twoDaysAgo;
      const articleLang = item.language || "ar";

      xml += "  <url>\n";
      xml += `    <loc>${SITE_URL}/news/${item.id}</loc>\n`;
      xml += `    <lastmod>${pubISO}</lastmod>\n`;
      xml += "    <changefreq>never</changefreq>\n";
      // Recent articles get higher priority for faster indexing
      xml += `    <priority>${isRecent ? "0.8" : "0.6"}</priority>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="${articleLang}" href="${SITE_URL}/news/${item.id}" />\n`;

      // Google News tag for articles published in last 2 days
      if (isRecent && item.title) {
        xml += "    <news:news>\n";
        xml += "      <news:publication>\n";
        xml += "        <news:name>ArabiSmart News</news:name>\n";
        xml += `        <news:language>${articleLang}</news:language>\n`;
        xml += "      </news:publication>\n";
        xml += `      <news:publication_date>${pubISO}</news:publication_date>\n`;
        xml += `      <news:title><![CDATA[${item.title}]]></news:title>\n`;
        if (item.category) {
          xml += `      <news:keywords><![CDATA[${item.category}, أخبار, ArabiSmart]]></news:keywords>\n`;
        }
        xml += "    </news:news>\n";
      }

      // Image sitemap for articles with images
      if (item.image) {
        xml += "    <image:image>\n";
        xml += `      <image:loc>${escapeXml(item.image)}</image:loc>\n`;
        if (item.title) {
          xml += `      <image:title><![CDATA[${item.title}]]></image:title>\n`;
        }
        xml += "    </image:image>\n";
      }

      xml += "  </url>\n";
    }

    xml += "</urlset>";

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=1800"); // Cache 30 min for fresher news
    res.send(xml);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}

/**
 * Google News-specific sitemap (last 2 days only)
 * Dedicated endpoint for Google News crawler
 */
export async function generateNewsSitemap(req: Request, res: Response) {
  try {
    const newsItems = await getAllNewsForSitemap();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const recentItems = newsItems.filter(
      (item) => new Date(item.publishedAt) > twoDaysAgo
    );

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    for (const item of recentItems) {
      if (!item.title) continue;
      const pubISO = new Date(item.publishedAt).toISOString();
      const articleLang = (item as any).language || "ar";

      xml += "  <url>\n";
      xml += `    <loc>${SITE_URL}/news/${item.id}</loc>\n`;
      xml += `    <lastmod>${pubISO}</lastmod>\n`;
      xml += "    <news:news>\n";
      xml += "      <news:publication>\n";
      xml += "        <news:name>ArabiSmart News</news:name>\n";
      xml += `        <news:language>${articleLang}</news:language>\n`;
      xml += "      </news:publication>\n";
      xml += `      <news:publication_date>${pubISO}</news:publication_date>\n`;
      xml += `      <news:title><![CDATA[${item.title}]]></news:title>\n`;
      if (item.category) {
        xml += `      <news:keywords><![CDATA[${item.category}, ${(item as any).source || ""}, أخبار عربية]]></news:keywords>\n`;
      }
      xml += "    </news:news>\n";

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
    res.header("Cache-Control", "public, max-age=600"); // Cache 10 min for news sitemap
    res.send(xml);
  } catch (error) {
    console.error("[News Sitemap] Error:", error);
    res.status(500).send("Error generating news sitemap");
  }
}
