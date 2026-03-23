import { Request, Response } from "express";
import { getAllNewsForSitemap } from "./db";

const SITE_URL = "https://arabismart.vip";

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  { path: "/", changefreq: "hourly", priority: "1.0" },
  { path: "/daily-summary", changefreq: "daily", priority: "0.9" },
  { path: "/videos", changefreq: "daily", priority: "0.7" },
  { path: "/live", changefreq: "weekly", priority: "0.7" },
  { path: "/archive", changefreq: "daily", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.8" },
  { path: "/privacy", changefreq: "yearly", priority: "0.5" },
];

/**
 * Generate dynamic XML sitemap including all news articles
 * Supports Google News Sitemap format for news articles published in last 2 days
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
      xml += `    <xhtml:link rel="alternate" hreflang="ar" href="${SITE_URL}${page.path}" />\n`;
      xml += "  </url>\n";
    }

    // News articles
    for (const item of newsItems) {
      const pubDate = new Date(item.publishedAt);
      const pubISO = pubDate.toISOString();
      const isRecent = pubDate > twoDaysAgo;

      xml += "  <url>\n";
      xml += `    <loc>${SITE_URL}/news/${item.id}</loc>\n`;
      xml += `    <lastmod>${pubISO}</lastmod>\n`;
      xml += "    <changefreq>never</changefreq>\n";
      xml += "    <priority>0.6</priority>\n";

      // Add Google News tag for articles published in last 2 days
      if (isRecent && item.title) {
        xml += "    <news:news>\n";
        xml += "      <news:publication>\n";
        xml += "        <news:name>ArabiSmart News</news:name>\n";
        xml += "        <news:language>ar</news:language>\n";
        xml += "      </news:publication>\n";
        xml += `      <news:publication_date>${pubISO}</news:publication_date>\n`;
        xml += `      <news:title><![CDATA[${item.title}]]></news:title>\n`;
        xml += "    </news:news>\n";
      }

      xml += "  </url>\n";
    }

    xml += "</urlset>";

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.send(xml);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}
