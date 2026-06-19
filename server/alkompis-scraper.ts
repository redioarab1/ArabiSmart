/**
 * Alkompis Web Scraper
 * 
 * Since Alkompis doesn't provide a working RSS feed, this scraper
 * fetches news directly from their website using node's native fetch (undici).
 * Note: axios/node-http fail with "HPE_CR_EXPECTED" on this server due to
 * non-standard HTTP/1.1 headers; native fetch handles it correctly.
 */

import * as cheerio from 'cheerio';
import { execSync } from 'child_process';

interface AlkompisArticle {
  title: string;
  url: string;
  pubDate: Date;
  description: string;
}

export async function scrapeAlkompis(): Promise<AlkompisArticle[]> {
  try {
    console.log('[Alkompis Scraper] Starting scrape...');
    
    // Use curl to bypass HPE_CR_EXPECTED issue with Node.js HTTP parser
    let html: string;
    try {
      html = execSync(
        'curl -s -k --max-time 15 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "https://alkompis.se/news"',
        { encoding: 'utf8', timeout: 20000 }
      );
    } catch (curlErr: any) {
      throw new Error(`curl failed: ${curlErr.message}`);
    }

    const $ = cheerio.load(html);
    const articles: AlkompisArticle[] = [];
    const seen = new Set<string>();

    // Find all links that contain /news/ (article links)
    $('a[href*="/news/"]').each((_, element) => {
      const href = $(element).attr('href');
      const title = $(element).text().trim();
      
      if (!href || !title || title.length < 15) {
        return; // Skip invalid or short titles
      }
      
      // Skip category pages
      if (href.includes('category/')) {
        return;
      }
      
      const fullUrl = href.startsWith('http') ? href : `https://alkompis.se${href}`;
      
      // Skip duplicates
      if (seen.has(fullUrl)) {
        return;
      }
      
      seen.add(fullUrl);
      
      articles.push({
        title,
        url: fullUrl,
        pubDate: new Date(), // Use current time since we can't extract exact date
        description: title, // Use title as description
      });
    });

    // Limit to 20 most recent articles
    const limitedArticles = articles.slice(0, 20);
    
    console.log(`[Alkompis Scraper] ✅ Found ${limitedArticles.length} articles`);
    return limitedArticles;
    
  } catch (error: any) {
    console.error('[Alkompis Scraper] ❌ Error:', error.message);
    throw error;
  }
}
