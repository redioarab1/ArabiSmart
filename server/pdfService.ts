/**
 * pdfService.ts
 * Generates a premium newspaper/magazine-style Arabic PDF for the daily summary
 * Uses Puppeteer + Chromium for full RTL/Arabic support
 * Design inspired by Al-Ahram, Al-Riyadh, and international newspaper layouts
 */
import puppeteer from "puppeteer";
import https from "https";
import http from "http";

// ─── Types ────────────────────────────────────────────────────────────────────
type SummaryStats = {
  totalNews?: number;
  activeSources?: number;
  arabicNews?: number;
  swedishNews?: number;
  englishNews?: number;
};

type NewsItem = {
  id?: number;
  title: string;
  source?: string;
  category?: string;
  imageUrl?: string;
  description?: string;
};

type SummaryData = {
  date: Date | string;
  summary: string;
  trendingTopics?: string[];
  statistics?: SummaryStats;
  topNewsItems?: NewsItem[];
};

// ─── Image Fetcher ────────────────────────────────────────────────────────────
async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url || !url.startsWith("http")) return null;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 8000);
    const protocol = url.startsWith("https") ? https : http;
    protocol
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          clearTimeout(timeout);
          resolve(null);
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          clearTimeout(timeout);
          const buffer = Buffer.concat(chunks);
          const contentType = res.headers["content-type"] || "image/jpeg";
          const b64 = buffer.toString("base64");
          resolve(`data:${contentType};base64,${b64}`);
        });
        res.on("error", () => {
          clearTimeout(timeout);
          resolve(null);
        });
      })
      .on("error", () => {
        clearTimeout(timeout);
        resolve(null);
      });
  });
}

// ─── Logo URL ─────────────────────────────────────────────────────────────────
const LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028696863/TREiIprHXGJofwwf.png";

// ─── Category Helpers ─────────────────────────────────────────────────────────
function getCategoryLabel(cat?: string): string {
  const map: Record<string, string> = {
    breaking: "عاجل",
    local: "محلي",
    politics: "سياسة",
    sports: "رياضة",
    economy: "اقتصاد",
    world: "عالمي",
    technology: "تقنية",
    culture: "ثقافة",
    health: "صحة",
    science: "علوم",
  };
  return map[cat || ""] || "أخبار";
}

function getCategoryColor(cat?: string): string {
  const map: Record<string, string> = {
    breaking: "#dc2626",
    local: "#2563eb",
    politics: "#7c3aed",
    sports: "#16a34a",
    economy: "#d97706",
    world: "#0891b2",
    technology: "#0d9488",
    culture: "#db2777",
    health: "#059669",
    science: "#6366f1",
  };
  return map[cat || ""] || "#64748b";
}

// ─── HTML Builder ─────────────────────────────────────────────────────────────
async function buildHTML(
  data: SummaryData,
  logoDataUrl: string | null
): Promise<string> {
  const date = new Date(data.date);

  const arabicDate = date.toLocaleDateString("ar-EG", {
    weekday: "long",
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

  // Fetch images for top news (max 5)
  const newsWithImages = await Promise.all(
    topNews.slice(0, 5).map(async (item, idx) => {
      let imgDataUrl: string | null = null;
      if (item.imageUrl) {
        imgDataUrl = await fetchImageAsBase64(item.imageUrl);
      }
      return { ...item, imgDataUrl, index: idx + 1 };
    })
  );

  // ── Logo HTML ──
  const logoHTML = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="ArabiSmart" class="header-logo" />`
    : `<div class="header-logo-fallback">AS</div>`;

  // ── Stats ──
  const statsHTML = [
    { value: stats.totalNews ?? 0, label: "إجمالي الأخبار", icon: "📰" },
    { value: stats.arabicNews ?? 0, label: "أخبار عربية", icon: "🌍" },
    { value: stats.swedishNews ?? 0, label: "أخبار سويدية", icon: "🇸🇪" },
    { value: stats.activeSources ?? 0, label: "مصدر نشط", icon: "📡" },
  ]
    .map(
      (s) => `
    <div class="stat-card">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`
    )
    .join("");

  // ── Topics ──
  const topicsHTML = topics
    .slice(0, 12)
    .map((t) => `<span class="topic-pill">${t}</span>`)
    .join("");

  // ── Summary columns ──
  const half = Math.ceil(paragraphs.length / 2);
  const col1HTML = paragraphs
    .slice(0, half)
    .map((p) => `<p class="summary-para">${p}</p>`)
    .join("");
  const col2HTML = paragraphs
    .slice(half)
    .map((p) => `<p class="summary-para">${p}</p>`)
    .join("");

  // ── News Cards ──
  const newsCardsHTML = newsWithImages
    .map((item) => {
      const catLabel = getCategoryLabel(item.category);
      const catColor = getCategoryColor(item.category);
      const isFirst = item.index === 1;

      const imgHTML = item.imgDataUrl
        ? `<div class="card-img-wrap ${isFirst ? "card-img-first" : ""}">
            <img src="${item.imgDataUrl}" alt="" class="card-img" />
           </div>`
        : `<div class="card-img-placeholder ${isFirst ? "card-img-first" : ""}">
            <span class="placeholder-cat">${catLabel}</span>
           </div>`;

      return `
      <div class="news-card ${isFirst ? "news-card-featured" : ""}">
        ${imgHTML}
        <div class="card-body">
          <div class="card-meta">
            <span class="card-badge" style="background:${catColor}">${catLabel}</span>
            ${item.source ? `<span class="card-source">${item.source}</span>` : ""}
          </div>
          <p class="card-title">${item.index}. ${item.title}</p>
        </div>
      </div>`;
    })
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
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Base ── */
    body {
      font-family: 'Cairo', 'Amiri', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      background: #f5f0e8;
      color: #1a1a1a;
      font-size: 10.5pt;
      line-height: 1.75;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page ── */
    .page {
      width: 210mm;
      margin: 0 auto;
      background: #fff;
    }

    /* ══════════════════════════════════════════
       NEWSPAPER HEADER
    ══════════════════════════════════════════ */
    .newspaper-header {
      background: #fff;
    }

    /* Top bar */
    .header-topbar {
      background: #1a1a2e;
      color: #c9a227;
      padding: 5px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      font-weight: 600;
    }

    /* Masthead */
    .masthead {
      padding: 14px 20px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-logo {
      width: 68px;
      height: 68px;
      object-fit: contain;
      border-radius: 8px;
      border: 2px solid #1a1a2e;
    }

    .header-logo-fallback {
      width: 68px;
      height: 68px;
      background: #1a1a2e;
      color: #c9a227;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22pt;
      font-weight: 900;
      font-family: 'Cairo', sans-serif;
    }

    .masthead-center {
      flex: 1;
      text-align: center;
      padding: 0 16px;
    }

    .site-name-en {
      font-family: 'Cairo', sans-serif;
      font-size: 28pt;
      font-weight: 900;
      color: #1a1a2e;
      letter-spacing: -1px;
      line-height: 1;
    }

    .site-name-en span { color: #c9a227; }

    .site-name-ar {
      font-family: 'Amiri', serif;
      font-size: 13pt;
      color: #555;
      margin-top: 2px;
    }

    .site-tagline {
      font-size: 7.5pt;
      color: #888;
      margin-top: 3px;
    }

    .masthead-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      font-size: 8pt;
      color: #555;
    }

    .issue-badge {
      background: #1a1a2e;
      color: #c9a227;
      padding: 3px 10px;
      border-radius: 3px;
      font-weight: 700;
      font-size: 8pt;
    }

    /* Gold divider */
    .gold-divider {
      height: 3px;
      background: linear-gradient(90deg, #1a1a2e 0%, #c9a227 30%, #f0d060 50%, #c9a227 70%, #1a1a2e 100%);
    }

    /* Date banner */
    .date-banner {
      background: #f8f5ee;
      border-bottom: 2px solid #1a1a2e;
      padding: 7px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .date-banner-title {
      font-family: 'Amiri', serif;
      font-size: 15pt;
      font-weight: 700;
      color: #1a1a2e;
    }

    .date-banner-date {
      font-size: 9.5pt;
      color: #555;
      font-weight: 500;
    }

    /* ══════════════════════════════════════════
       STATS ROW
    ══════════════════════════════════════════ */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-bottom: 2px solid #1a1a2e;
    }

    .stat-card {
      text-align: center;
      padding: 10px 6px;
      border-left: 1px solid #e0e0e0;
    }

    .stat-card:last-child { border-left: none; }

    .stat-icon { font-size: 15pt; line-height: 1; margin-bottom: 3px; }

    .stat-value {
      font-family: 'Cairo', sans-serif;
      font-size: 20pt;
      font-weight: 900;
      color: #1a1a2e;
      line-height: 1;
    }

    .stat-label { font-size: 7.5pt; color: #777; margin-top: 2px; font-weight: 500; }

    /* ══════════════════════════════════════════
       MAIN CONTENT
    ══════════════════════════════════════════ */
    .main-content { padding: 0 20px 20px; }

    /* Section header */
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 14px 0 10px;
    }

    .sh-line { flex: 1; height: 2px; background: #1a1a2e; }
    .sh-line-gold { flex: 1; height: 2px; background: #c9a227; }

    .sh-title {
      font-family: 'Amiri', serif;
      font-size: 12pt;
      font-weight: 700;
      color: #fff;
      background: #1a1a2e;
      padding: 3px 14px;
      border-radius: 2px;
      white-space: nowrap;
    }

    /* ── Summary Two-Column ── */
    .summary-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    .summary-col {
      border-right: 1px solid #ddd;
      padding-right: 14px;
    }

    .summary-col:first-child { border-right: none; padding-right: 0; }

    .summary-para {
      font-family: 'Amiri', serif;
      font-size: 11pt;
      line-height: 1.95;
      color: #2c2c2c;
      text-align: justify;
      margin-bottom: 10px;
      text-indent: 16px;
    }

    /* Drop cap */
    .summary-col:first-child .summary-para:first-child::first-letter {
      font-family: 'Amiri', serif;
      font-size: 40pt;
      font-weight: 700;
      color: #1a1a2e;
      float: right;
      line-height: 0.75;
      margin-left: 5px;
      margin-top: 4px;
    }

    /* ── Trending Topics ── */
    .topics-box {
      background: #f8f5ee;
      border: 1px solid #ddd;
      border-top: 3px solid #c9a227;
      border-radius: 4px;
      padding: 10px 12px;
      margin-top: 14px;
    }

    .topics-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 8px;
    }

    .topic-pill {
      background: #1a1a2e;
      color: #c9a227;
      padding: 3px 9px;
      border-radius: 20px;
      font-size: 8pt;
      font-weight: 600;
      white-space: nowrap;
    }

    /* ══════════════════════════════════════════
       NEWS CARDS
    ══════════════════════════════════════════ */
    .news-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 0;
    }

    /* Featured card (first) spans full width */
    .news-card-featured {
      grid-column: 1 / -1;
      flex-direction: row !important;
    }

    .news-card {
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
    }

    /* Image wrappers */
    .card-img-wrap { overflow: hidden; flex-shrink: 0; }
    .card-img-first { width: 200px; height: 130px; }
    .news-card:not(.news-card-featured) .card-img-wrap { height: 100px; }

    .card-img { width: 100%; height: 100%; object-fit: cover; }

    .card-img-placeholder {
      background: linear-gradient(135deg, #1a1a2e, #0f2557);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-img-first.card-img-placeholder { width: 200px; height: 130px; }
    .news-card:not(.news-card-featured) .card-img-placeholder { height: 100px; }

    .placeholder-cat {
      color: #c9a227;
      font-size: 10pt;
      font-weight: 700;
      font-family: 'Amiri', serif;
    }

    .card-body { padding: 8px 10px; flex: 1; }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 5px;
    }

    .card-badge {
      color: #fff;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 3px;
    }

    .card-source { font-size: 7.5pt; color: #888; }

    .card-title {
      font-family: 'Amiri', serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.5;
    }

    .news-card-featured .card-title { font-size: 12.5pt; }

    /* ══════════════════════════════════════════
       AI BADGE
    ══════════════════════════════════════════ */
    .ai-badge {
      margin-top: 14px;
      padding: 9px 14px;
      background: linear-gradient(135deg, #0a1628, #0f2557);
      border-radius: 5px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .ai-icon { font-size: 18pt; flex-shrink: 0; }

    .ai-text { color: #fff; font-size: 8.5pt; line-height: 1.5; }
    .ai-text strong { color: #c9a227; font-size: 9pt; }

    /* ══════════════════════════════════════════
       FOOTER
    ══════════════════════════════════════════ */
    .newspaper-footer {
      border-top: 4px double #1a1a2e;
      background: #1a1a2e;
      color: #c9a227;
      padding: 9px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      font-weight: 600;
      margin-top: 18px;
    }

    .footer-logo { font-family: 'Amiri', serif; font-size: 10.5pt; font-weight: 700; }
    .footer-url { color: rgba(201,162,39,0.7); font-size: 7.5pt; direction: ltr; }

    /* ── Watermark ── */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-family: 'Amiri', serif;
      font-size: 60pt;
      color: rgba(15,37,87,0.04);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
    }

    @media print {
      body { margin: 0; }
      .page { width: 100%; }
    }
  </style>
</head>
<body>
<div class="watermark">ArabiSmart</div>
<div class="page">

  <!-- ══ HEADER ══ -->
  <header class="newspaper-header">
    <div class="header-topbar">
      <span>الإصدار الرقمي | النسخة العربية</span>
      <span>${arabicDate}</span>
      <span>العدد ${issueNumber}</span>
    </div>

    <div class="masthead">
      <div>${logoHTML}</div>
      <div class="masthead-center">
        <div class="site-name-en">Arabi<span>Smart</span> News</div>
        <div class="site-name-ar">عربي سمارت للأخبار</div>
        <div class="site-tagline">تغطية بلا حدود — اجتمعت لتكون بين يديك في مكان واحد</div>
      </div>
      <div class="masthead-meta">
        <span class="issue-badge">العدد ${issueNumber}</span>
        <span style="margin-top:5px;font-size:8pt">${arabicDate}</span>
        <span style="font-size:7.5pt;color:#888;margin-top:2px">arabismart.vip</span>
      </div>
    </div>

    <div class="gold-divider"></div>

    <div class="date-banner">
      <div class="date-banner-title">📰 ملخص الأخبار اليومي</div>
      <div class="date-banner-date">${arabicDate}</div>
    </div>
  </header>

  <!-- ══ STATS ══ -->
  <div class="stats-row">${statsHTML}</div>

  <!-- ══ MAIN CONTENT ══ -->
  <div class="main-content">

    <!-- Summary -->
    <div class="section-header">
      <div class="sh-line"></div>
      <div class="sh-title">✦ ملخص اليوم ✦</div>
      <div class="sh-line-gold"></div>
    </div>

    <div class="summary-cols">
      <div class="summary-col">${col1HTML || '<p class="summary-para">لا يوجد محتوى متاح.</p>'}</div>
      <div class="summary-col">${col2HTML}</div>
    </div>

    <!-- Trending Topics -->
    ${
      topics.length > 0
        ? `<div class="topics-box">
        <div class="section-header" style="margin:8px 0 0 0">
          <div class="sh-line"></div>
          <div class="sh-title">🔥 الموضوعات الرائجة</div>
          <div class="sh-line-gold"></div>
        </div>
        <div class="topics-wrap">${topicsHTML}</div>
      </div>`
        : ""
    }

    <!-- Top News -->
    ${
      newsWithImages.length > 0
        ? `<div class="section-header">
        <div class="sh-line"></div>
        <div class="sh-title">⭐ أبرز الأخبار</div>
        <div class="sh-line-gold"></div>
      </div>
      <div class="news-grid">${newsCardsHTML}</div>`
        : ""
    }

    <!-- AI Badge -->
    <div class="ai-badge">
      <div class="ai-icon">🤖</div>
      <div class="ai-text">
        <strong>مُولَّد بالذكاء الاصطناعي</strong><br/>
        هذا الملخص تم توليده تلقائياً بواسطة نظام الذكاء الاصطناعي في ArabiSmart News
        من خلال تحليل ${stats.totalNews || 0} خبراً من ${stats.activeSources || 0} مصدراً إخبارياً موثوقاً.
      </div>
    </div>

  </div>

  <!-- ══ FOOTER ══ -->
  <footer class="newspaper-footer">
    <div class="footer-logo">ArabiSmart News — عربي سمارت</div>
    <div style="text-align:center;font-size:7.5pt;color:rgba(201,162,39,0.8)">
      جميع الحقوق محفوظة © ${date.getFullYear()} | ملخص يومي بالذكاء الاصطناعي
    </div>
    <div class="footer-url">arabismart.vip</div>
  </footer>

</div>
</body>
</html>`;
}

// ─── Main PDF Generator ───────────────────────────────────────────────────────
export async function generateNewspaperPDF(data: SummaryData): Promise<Buffer> {
  // Fetch logo
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await fetchImageAsBase64(LOGO_URL);
  } catch {
    logoDataUrl = null;
  }

  const html = await buildHTML(data, logoDataUrl);

  // Determine the best executable path:
  // 1. Use puppeteer's bundled Chrome (works in all environments including production)
  // 2. Fall back to system chromium-browser if bundled is not available
  let executablePath: string | undefined;
  try {
    const { executablePath: bundledPath } = await import("puppeteer");
    const bundled = bundledPath();
    const { existsSync } = await import("fs");
    if (existsSync(bundled)) {
      executablePath = bundled;
    } else {
      executablePath = "/usr/bin/chromium-browser";
    }
  } catch {
    executablePath = "/usr/bin/chromium-browser";
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 30000,
    });
    await page.evaluate(() => document.fonts.ready);
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
