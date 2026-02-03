import { Request, Response } from "express";
import { getAllNewsForSitemap } from "./db";

/**
 * Generate XML sitemap for all news articles
 */
export async function generateSitemap(req: Request, res: Response) {
  try {
    const news = await getAllNewsForSitemap();
    const baseUrl = req.protocol + "://" + req.get("host");

    // Start XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add homepage
    xml += "  <url>\n";
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += "    <changefreq>hourly</changefreq>\n";
    xml += "    <priority>1.0</priority>\n";
    xml += "  </url>\n";

    // Add all news articles
    for (const item of news) {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/news/${item.id}</loc>\n`;
      xml += `    <lastmod>${new Date(item.publishedAt).toISOString()}</lastmod>\n`;
      xml += "    <changefreq>daily</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    }

    // Close XML
    xml += "</urlset>";

    // Set headers
    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.send(xml);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}
