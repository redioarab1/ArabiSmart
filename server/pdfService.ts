/**
 * pdfService.ts
 * Generates a newspaper-style Arabic PDF for the daily summary
 * Uses Puppeteer + Chromium for full RTL/Arabic support
 */

import puppeteer from "puppeteer";

type SummaryStats = {
  totalNews?: number;
  activeSources?: number;
  arabicNews?: number;
  swedishNews?: number;
  englishNews?: number;
};

type SummaryData = {
  date: Date | string;
  summary: string;
  trendingTopics?: string[];
  statistics?: SummaryStats;
  topNewsItems?: Array<{ title: string; source?: string; category?: string }>;
};

// ─── HTML Template ────────────────────────────────────────────────────────────
function buildHTML(data: SummaryData): string {
  const date = new Date(data.date);
  const arabicDate = date.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const hijriDate = date.toLocaleDateString("ar-SA-u-ca-islamic", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const issueNumber = Math.floor(
    (date.getTime() - new Date("2024-01-01").getTime()) / 86400000
  );

  const stats = data.statistics || {};
  const topics = data.trendingTopics || [];
  const topNews = data.topNewsItems || [];

  // Split summary into paragraphs
  const paragraphs = (data.summary || "")
    .split(/\n+/)
    .filter((p) => p.trim().length > 0);

  const topicsHTML = topics
    .slice(0, 10)
    .map(
      (t) =>
        `<span class="topic-tag"># ${t}</span>`
    )
    .join("");

  const topNewsHTML = topNews
    .slice(0, 6)
    .map(
      (n, i) => `
      <div class="news-item">
        <span class="news-num">${i + 1}</span>
        <div class="news-content">
          <p class="news-title">${n.title}</p>
          ${n.source ? `<span class="news-source">${n.source}</span>` : ""}
        </div>
      </div>`
    )
    .join("");

  const paragraphsHTML = paragraphs
    .map((p) => `<p class="summary-para">${p}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ملخص الأخبار اليومي - ArabiSmart News</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Cairo', 'Amiri', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      background: #fff;
      color: #1a1a2e;
      font-size: 11pt;
      line-height: 1.7;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page Layout ── */
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      padding: 0;
    }

    /* ── Newspaper Header ── */
    .newspaper-header {
      background: linear-gradient(135deg, #0a1628 0%, #0f2557 50%, #1a1a6e 100%);
      padding: 0;
      position: relative;
      overflow: hidden;
    }

    .header-top-bar {
      background: #c9a227;
      padding: 4px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #1a1a2e;
      font-weight: 600;
    }

    .header-main {
      padding: 18px 20px 14px;
      text-align: center;
      position: relative;
    }

    .header-decorative-line {
      height: 2px;
      background: linear-gradient(90deg, transparent, #c9a227, #fff, #c9a227, transparent);
      margin: 0 20px 12px;
    }

    .site-name {
      font-family: 'Amiri', serif;
      font-size: 36pt;
      font-weight: 700;
      color: #fff;
      letter-spacing: 2px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.4);
      line-height: 1.1;
    }

    .site-name-ar {
      font-family: 'Amiri', serif;
      font-size: 18pt;
      color: #c9a227;
      font-weight: 400;
      margin-top: 2px;
      letter-spacing: 1px;
    }

    .header-tagline {
      font-size: 9pt;
      color: rgba(255,255,255,0.7);
      margin-top: 6px;
      font-weight: 300;
      letter-spacing: 0.5px;
    }

    .header-bottom-bar {
      background: #c9a227;
      padding: 6px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9pt;
      color: #1a1a2e;
      font-weight: 700;
    }

    .edition-badge {
      background: #1a1a2e;
      color: #c9a227;
      padding: 2px 10px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: 700;
    }

    /* ── Section Divider ── */
    .section-divider {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 16px 20px 12px;
    }

    .section-divider-line {
      flex: 1;
      height: 1px;
      background: #1a1a2e;
    }

    .section-divider-title {
      font-family: 'Amiri', serif;
      font-size: 13pt;
      font-weight: 700;
      color: #1a1a2e;
      white-space: nowrap;
      padding: 0 8px;
      border: 2px solid #1a1a2e;
      border-radius: 2px;
    }

    /* ── Stats Row ── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding: 12px 20px;
      background: #f8f9fa;
      border-bottom: 2px solid #1a1a2e;
      border-top: 2px solid #1a1a2e;
      margin: 0 0 0 0;
    }

    .stat-box {
      text-align: center;
      padding: 8px 4px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      border-top: 3px solid #0f2557;
    }

    .stat-value {
      font-family: 'Cairo', sans-serif;
      font-size: 20pt;
      font-weight: 800;
      color: #0f2557;
      line-height: 1;
    }

    .stat-label {
      font-size: 7.5pt;
      color: #666;
      margin-top: 3px;
      font-weight: 500;
    }

    /* ── Main Content ── */
    .main-content {
      padding: 0 20px 20px;
    }

    /* ── Summary Section ── */
    .summary-section {
      margin-top: 0;
    }

    .summary-headline {
      font-family: 'Amiri', serif;
      font-size: 20pt;
      font-weight: 700;
      color: #0a1628;
      line-height: 1.3;
      margin: 14px 0 8px;
      border-bottom: 3px double #c9a227;
      padding-bottom: 6px;
    }

    .summary-para {
      font-family: 'Amiri', serif;
      font-size: 11pt;
      line-height: 1.9;
      color: #2c2c2c;
      text-align: justify;
      margin-bottom: 10px;
      text-indent: 20px;
    }

    /* ── Two Column Layout ── */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }

    /* ── Trending Topics ── */
    .topics-section {
      background: #f8f9fa;
      border: 1px solid #ddd;
      border-top: 3px solid #c9a227;
      border-radius: 4px;
      padding: 12px;
    }

    .topics-title {
      font-family: 'Amiri', serif;
      font-size: 12pt;
      font-weight: 700;
      color: #0a1628;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .topics-title::before {
      content: '📈';
      font-size: 10pt;
    }

    .topics-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .topic-tag {
      background: #0f2557;
      color: #fff;
      padding: 3px 9px;
      border-radius: 12px;
      font-size: 8.5pt;
      font-weight: 500;
      white-space: nowrap;
    }

    /* ── Top News ── */
    .top-news-section {
      background: #fff;
      border: 1px solid #ddd;
      border-top: 3px solid #0f2557;
      border-radius: 4px;
      padding: 12px;
    }

    .top-news-title {
      font-family: 'Amiri', serif;
      font-size: 12pt;
      font-weight: 700;
      color: #0a1628;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .top-news-title::before {
      content: '📰';
      font-size: 10pt;
    }

    .news-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 0;
      border-bottom: 1px dashed #e0e0e0;
    }

    .news-item:last-child {
      border-bottom: none;
    }

    .news-num {
      background: #c9a227;
      color: #1a1a2e;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      font-weight: 800;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .news-content {
      flex: 1;
    }

    .news-title {
      font-size: 9pt;
      font-weight: 600;
      color: #1a1a2e;
      line-height: 1.5;
    }

    .news-source {
      font-size: 7.5pt;
      color: #888;
      margin-top: 1px;
      display: block;
    }

    /* ── AI Badge ── */
    .ai-badge-section {
      margin-top: 16px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #0a1628, #0f2557);
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ai-icon {
      font-size: 20pt;
      flex-shrink: 0;
    }

    .ai-text {
      color: #fff;
      font-size: 8.5pt;
      line-height: 1.5;
    }

    .ai-text strong {
      color: #c9a227;
      font-size: 9.5pt;
    }

    /* ── Footer ── */
    .newspaper-footer {
      margin-top: 20px;
      border-top: 3px double #1a1a2e;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
    }

    .footer-logo {
      font-family: 'Amiri', serif;
      font-size: 11pt;
      font-weight: 700;
      color: #0a1628;
    }

    .footer-url {
      font-size: 8pt;
      color: #666;
      direction: ltr;
    }

    .footer-copy {
      font-size: 7.5pt;
      color: #999;
    }

    /* ── Watermark ── */
    .watermark {
      position: fixed;
      bottom: 40mm;
      left: 50%;
      transform: translateX(-50%) rotate(-30deg);
      font-family: 'Amiri', serif;
      font-size: 60pt;
      color: rgba(15, 37, 87, 0.04);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
    }

    /* ── Ornament ── */
    .ornament {
      text-align: center;
      color: #c9a227;
      font-size: 14pt;
      margin: 8px 0;
      letter-spacing: 4px;
    }

    /* ── Print ── */
    @media print {
      body { margin: 0; }
      .page { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Watermark -->
    <div class="watermark">ArabiSmart</div>

    <!-- ══ NEWSPAPER HEADER ══ -->
    <header class="newspaper-header">
      <!-- Top info bar -->
      <div class="header-top-bar">
        <span>العدد: ${issueNumber}</span>
        <span>التاريخ الهجري: ${hijriDate}</span>
        <span>www.arabismart.vip</span>
      </div>

      <!-- Main title -->
      <div class="header-main">
        <div class="header-decorative-line"></div>
        <div class="site-name">ArabiSmart News</div>
        <div class="site-name-ar">عربي سمارت نيوز</div>
        <div class="header-tagline">تغطية بلا حدود — اجتمعت لتكون بين يديك في مكان واحد</div>
        <div class="header-decorative-line" style="margin-top: 10px; margin-bottom: 0;"></div>
      </div>

      <!-- Bottom date bar -->
      <div class="header-bottom-bar">
        <span>📅 ${arabicDate}</span>
        <span class="edition-badge">الملخص اليومي</span>
        <span>🤖 مُولَّد بالذكاء الاصطناعي</span>
      </div>
    </header>

    <!-- ══ STATS ROW ══ -->
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-value">${stats.totalNews || 0}</div>
        <div class="stat-label">إجمالي الأخبار</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${stats.activeSources || 0}</div>
        <div class="stat-label">المصادر النشطة</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${stats.arabicNews || 0}</div>
        <div class="stat-label">أخبار عربية</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${stats.swedishNews || 0}</div>
        <div class="stat-label">أخبار سويدية</div>
      </div>
    </div>

    <!-- ══ MAIN CONTENT ══ -->
    <div class="main-content">

      <!-- Section: Daily Summary -->
      <div class="section-divider">
        <div class="section-divider-line"></div>
        <div class="section-divider-title">✦ ملخص اليوم ✦</div>
        <div class="section-divider-line"></div>
      </div>

      <div class="summary-section">
        <h1 class="summary-headline">أبرز ما جرى اليوم في العالم العربي والعالمي</h1>
        <div class="ornament">❖ ❖ ❖</div>
        ${paragraphsHTML}
      </div>

      <!-- Two column: Topics + Top News -->
      <div class="two-col">

        <!-- Trending Topics -->
        ${topics.length > 0 ? `
        <div class="topics-section">
          <div class="topics-title">الموضوعات الرائجة</div>
          <div class="topics-grid">
            ${topicsHTML}
          </div>
        </div>` : "<div></div>"}

        <!-- Top News -->
        ${topNews.length > 0 ? `
        <div class="top-news-section">
          <div class="top-news-title">أبرز الأخبار</div>
          ${topNewsHTML}
        </div>` : "<div></div>"}

      </div>

      <!-- AI Badge -->
      <div class="ai-badge-section">
        <div class="ai-icon">🤖</div>
        <div class="ai-text">
          <strong>مُولَّد بالذكاء الاصطناعي</strong><br/>
          هذا الملخص تم توليده تلقائياً بواسطة نظام الذكاء الاصطناعي في ArabiSmart News
          من خلال تحليل ومعالجة ${stats.totalNews || 0} خبراً من ${stats.activeSources || 0} مصدراً إخبارياً موثوقاً.
        </div>
      </div>

    </div>

    <!-- ══ FOOTER ══ -->
    <footer class="newspaper-footer">
      <div class="footer-logo">ArabiSmart News — عربي سمارت نيوز</div>
      <div class="footer-copy">© ${date.getFullYear()} جميع الحقوق محفوظة</div>
      <div class="footer-url">www.arabismart.vip</div>
    </footer>

  </div>
</body>
</html>`;
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function generateNewspaperPDF(data: SummaryData): Promise<Buffer> {
  const html = buildHTML(data);

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Set viewport for A4
    await page.setViewport({ width: 794, height: 1123 });

    // Load HTML with fonts (wait for network idle to load Google Fonts)
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    // Extra wait for fonts to render
    await new Promise((r) => setTimeout(r, 1500));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      displayHeaderFooter: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
