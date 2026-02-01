import axios from 'axios';
import * as cheerio from 'cheerio';

async function testScraper() {
  try {
    console.log('[Test] Starting scrape...');
    
    const response = await axios.get('https://alkompis.se/news', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const articles: any[] = [];
    const seen = new Set<string>();

    $('a[href*="/news/"]').each((_, element) => {
      const href = $(element).attr('href');
      const title = $(element).text().trim();
      
      if (!href || !title || title.length < 15 || href.includes('category/')) {
        return;
      }
      
      const fullUrl = href.startsWith('http') ? href : `https://alkompis.se${href}`;
      
      if (seen.has(fullUrl)) {
        return;
      }
      
      seen.add(fullUrl);
      articles.push({ title, url: fullUrl });
    });

    console.log(`\nFound ${articles.length} articles:\n`);
    articles.slice(0, 5).forEach((a, i) => {
      console.log(`${i+1}. ${a.title}`);
      console.log(`   ${a.url}\n`);
    });
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testScraper();
