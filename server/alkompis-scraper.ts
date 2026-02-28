/**
 * Alkompis Web Scraper
 * 
 * Since Alkompis doesn't provide a working RSS feed, this scraper
 * fetches news directly from their website using axios and cheerio.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

interface AlkompisArticle {
  title: string;
  url: string;
  pubDate: Date;
  description: string;
}

export async function scrapeAlkompis(): Promise<AlkompisArticle[]> {
  try {
    console.log('[Alkompis Scraper] Starting scrape...');
    
    const response = await axios.get('https://alkompis.se/news', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
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
