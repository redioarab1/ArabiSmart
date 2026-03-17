/**
 * pdfService.ts — توليد PDF باستخدام PDFKit (Node.js فقط، بدون أي أدوات خارجية)
 * يعمل في جميع البيئات: التطوير والإنتاج
 */
import PDFDocument from "pdfkit";
import https from "https";
import http from "http";
import path from "path";
import fs from "fs";

// ── أنواع البيانات ──────────────────────────────────────────────────────────
type SummaryStats = {
  totalNews?: number;
  activeSources?: number;
  arabicNews?: number;
  swedishNews?: number;
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

// ── روابط الخطوط العربية من CDN ─────────────────────────────────────────────
const FONT_CDN_REGULAR =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028696863/CYisMZJ5WxxAv8Cz8dg9ZA/Amiri-Regular_12b2b259.ttf";
const FONT_CDN_BOLD =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028696863/CYisMZJ5WxxAv8Cz8dg9ZA/Amiri-Bold_e0658bdd.ttf";

const CACHE_DIR = "/tmp/arabismart-fonts";

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve();
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    const get = url.startsWith("https") ? https.get : http.get;
    get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        return downloadFile(res.headers.location!, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    }).on("error", (err) => {
      try { fs.unlinkSync(dest); } catch {}
      reject(err);
    });
  });
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      const get = url.startsWith("https") ? https.get : http.get;
      const req = get(url, { timeout: 5000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 && res.headers.location) {
          return fetchImageBuffer(res.headers.location!).then(resolve);
        }
        if (!res.statusCode || res.statusCode >= 400) return resolve(null);
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", () => resolve(null));
      });
      req.on("error", () => resolve(null));
      req.on("timeout", () => { req.destroy(); resolve(null); });
    } catch {
      resolve(null);
    }
  });
}

// ── الألوان ──────────────────────────────────────────────────────────────────
const DARK_NAVY  = "#0d1b2a";
const GOLD       = "#c9a84c";
const WHITE      = "#ffffff";
const LIGHT_GRAY = "#f5f5f0";
const MID_GRAY   = "#888888";
const RED_ACCENT = "#c0392b";
const DARK_GOLD  = "#8b6914";

// ── الدالة الرئيسية ──────────────────────────────────────────────────────────
export async function generateNewspaperPDF(data: SummaryData): Promise<Buffer> {
  // تحميل الخطوط من CDN
  const fontRegPath = path.join(CACHE_DIR, "Amiri-Regular.ttf");
  const fontBoldPath = path.join(CACHE_DIR, "Amiri-Bold.ttf");

  let useArabicFont = true;
  try {
    await Promise.all([
      downloadFile(FONT_CDN_REGULAR, fontRegPath),
      downloadFile(FONT_CDN_BOLD, fontBoldPath),
    ]);
    // تحقق من وجود الملفات
    if (!fs.existsSync(fontRegPath) || !fs.existsSync(fontBoldPath)) {
      useArabicFont = false;
    }
  } catch {
    useArabicFont = false;
  }

  // تحميل صور الأخبار
  const headlines = data.topNewsItems?.slice(0, 3) ?? [];
  const imageBuffers: (Buffer | null)[] = await Promise.all(
    headlines.map((n) => (n.imageUrl ? fetchImageBuffer(n.imageUrl) : Promise.resolve(null)))
  );

  // تنسيق التاريخ
  const dateStr =
    data.date instanceof Date
      ? data.date.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      : String(data.date);

  const stats = data.statistics ?? {};

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `ملخص ArabiSmart - ${dateStr}`, Author: "ArabiSmart News" } });

    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;   // 595.28
    const H = doc.page.height;  // 841.89
    const PAD = 20;

    const reg  = useArabicFont ? fontRegPath  : "Helvetica";
    const bold = useArabicFont ? fontBoldPath : "Helvetica-Bold";

    // عكس النص للـ RTL
    function rtl(text: string): string {
      if (!text) return "";
      // عكس الكلمات فقط (PDFKit لا يدعم Unicode Bidi)
      return text.split(" ").reverse().join(" ");
    }

    function fillRect(x: number, y: number, w: number, h: number, color: string) {
      doc.rect(x, y, w, h).fill(color);
    }

    // ── 1. الترويسة ───────────────────────────────────────────────────────────
    const HDR_H = 50;
    fillRect(0, 0, W, HDR_H, DARK_NAVY);
    fillRect(0, HDR_H, W, 3, GOLD);

    // اسم الموقع (يسار)
    doc.font(bold).fontSize(18).fillColor(GOLD);
    doc.text("ArabiSmart", PAD, 8, { continued: true, features: [] });
    doc.fillColor(WHITE).text(" News", { features: [] });

    // عنوان الملخص (وسط)
    doc.font(bold).fontSize(11).fillColor(WHITE);
    doc.text(rtl("ملخص الأخبار اليومي"), W / 2 - 80, 8, { width: 160, align: "center", features: [] });

    // التاريخ (يمين)
    doc.font(reg).fontSize(8).fillColor(GOLD);
    doc.text(dateStr, W - 160, 10, { width: 140, align: "right", features: [] });
    doc.font(reg).fontSize(7).fillColor(WHITE);
    doc.text("arabismart.vip", W - 160, 24, { width: 140, align: "right", features: [] });

    // ── 2. شريط الإحصائيات ───────────────────────────────────────────────────
    const ST_Y = HDR_H + 3;
    const ST_H = 34;
    fillRect(0, ST_Y, W, ST_H, "#f0ede4");

    const statItems = [
      { label: rtl("إجمالي الأخبار"), value: (stats.totalNews ?? 0).toLocaleString() },
      { label: rtl("أخبار عربية"),    value: String(stats.arabicNews ?? 0) },
      { label: rtl("أخبار سويدية"),   value: String(stats.swedishNews ?? 0) },
      { label: rtl("المصادر النشطة"), value: String(stats.activeSources ?? 0) },
    ];
    const SW = W / 4;
    statItems.forEach((s, i) => {
      const sx = i * SW;
      if (i > 0) {
        doc.moveTo(sx, ST_Y + 5).lineTo(sx, ST_Y + ST_H - 5).lineWidth(0.5).stroke("#cccccc");
      }
      doc.font(bold).fontSize(13).fillColor(DARK_NAVY);
      doc.text(s.value, sx, ST_Y + 3, { width: SW, align: "center", features: [] });
      doc.font(reg).fontSize(6.5).fillColor(MID_GRAY);
      doc.text(s.label, sx, ST_Y + 20, { width: SW, align: "center", features: [] });
    });

    // ── 3. فاصل ──────────────────────────────────────────────────────────────
    const C_Y = ST_Y + ST_H + 5;
    doc.moveTo(PAD, C_Y).lineTo(W - PAD, C_Y).lineWidth(0.5).stroke(GOLD);

    // ── 4. ملخص اليوم ─────────────────────────────────────────────────────────
    const SUM_Y = C_Y + 5;
    fillRect(PAD, SUM_Y, W - PAD * 2, 15, DARK_NAVY);
    doc.font(bold).fontSize(8.5).fillColor(GOLD);
    doc.text(rtl("◆ ملخص اليوم"), PAD + 4, SUM_Y + 3, { width: W - PAD * 2 - 8, align: "right", features: [] });

    const SUM_TXT_Y = SUM_Y + 18;
    const COL_W = (W - PAD * 2 - 6) / 2;
    const summaryText = (data.summary ?? "").slice(0, 1000);
    const half = Math.floor(summaryText.length / 2);

    doc.font(reg).fontSize(8).fillColor(DARK_NAVY);
    doc.text(rtl(summaryText.slice(0, half)), PAD + COL_W + 6, SUM_TXT_Y, {
      width: COL_W, align: "right", lineGap: 3, features: [],
    });
    doc.font(reg).fontSize(8).fillColor(DARK_NAVY);
    doc.text(rtl(summaryText.slice(half)), PAD, SUM_TXT_Y, {
      width: COL_W, align: "right", lineGap: 3, features: [],
    });

    // ── 5. الموضوعات الرائجة ──────────────────────────────────────────────────
    const TOP_Y = SUM_TXT_Y + 125;
    fillRect(PAD, TOP_Y, W - PAD * 2, 15, "#1a3a5c");
    doc.font(bold).fontSize(8.5).fillColor(GOLD);
    doc.text(rtl("🔥 الموضوعات الرائجة"), PAD + 4, TOP_Y + 3, { width: W - PAD * 2 - 8, align: "right", features: [] });

    const CHIP_Y = TOP_Y + 18;
    const topics = data.trendingTopics?.slice(0, 5) ?? [];
    const chipColors = [DARK_NAVY, "#1a3a5c", "#2d5a8e", "#8b6914", RED_ACCENT];
    let chipX = W - PAD;
    topics.forEach((topic, i) => {
      const label = rtl(topic.replace(/^#\s*/, "").slice(0, 20));
      const chipW = Math.min(label.length * 5.5 + 14, 130);
      chipX -= chipW + 4;
      if (chipX < PAD) return;
      fillRect(chipX, CHIP_Y, chipW, 13, chipColors[i % chipColors.length]);
      doc.font(reg).fontSize(6).fillColor(WHITE);
      doc.text(label, chipX + 2, CHIP_Y + 3, { width: chipW - 4, align: "center", features: [] });
    });

    // ── 6. أبرز الأخبار ───────────────────────────────────────────────────────
    const NEWS_Y = CHIP_Y + 18;
    fillRect(PAD, NEWS_Y, W - PAD * 2, 15, DARK_NAVY);
    doc.font(bold).fontSize(8.5).fillColor(GOLD);
    doc.text(rtl("★ أبرز الأخبار"), PAD + 4, NEWS_Y + 3, { width: W - PAD * 2 - 8, align: "right", features: [] });

    const CARDS_Y = NEWS_Y + 18;
    const CARD_W = (W - PAD * 2 - 8) / 3;
    const CARD_H = H - CARDS_Y - 28; // يملأ الصفحة حتى التذييل
    const IMG_H = Math.floor(CARD_H * 0.45); // الصورة 45% من ارتفاع البطاقة

    headlines.forEach((news, i) => {
      const cx = PAD + i * (CARD_W + 4);
      fillRect(cx, CARDS_Y, CARD_W, CARD_H, LIGHT_GRAY);
      doc.rect(cx, CARDS_Y, CARD_W, CARD_H).lineWidth(0.5).stroke("#cccccc");

      // الصورة
      const imgBuf = imageBuffers[i];
      if (imgBuf && imgBuf.length > 500) {
        try {
          doc.image(imgBuf, cx, CARDS_Y, { width: CARD_W, height: IMG_H, cover: [CARD_W, IMG_H] });
        } catch {
          fillRect(cx, CARDS_Y, CARD_W, IMG_H, "#1a3a5c");
        }
      } else {
        fillRect(cx, CARDS_Y, CARD_W, IMG_H, "#1a3a5c");
        doc.font(bold).fontSize(22).fillColor(WHITE);
        doc.text("📰", cx, CARDS_Y + IMG_H / 2 - 14, { width: CARD_W, align: "center", features: [] });
      }

      // رقم الخبر
      fillRect(cx, CARDS_Y, 18, 18, RED_ACCENT);
      doc.font(bold).fontSize(9).fillColor(WHITE);
      doc.text(`${i + 1}`, cx, CARDS_Y + 4, { width: 18, align: "center", features: [] });

      // المصدر
      const srcY = CARDS_Y + IMG_H + 3;
      fillRect(cx + 2, srcY, CARD_W - 4, 12, DARK_NAVY);
      doc.font(reg).fontSize(6).fillColor(GOLD);
      doc.text((news.source ?? "").slice(0, 28), cx + 2, srcY + 2, {
        width: CARD_W - 4, align: "center", features: [],
      });

      // عنوان الخبر
      const titleY2 = srcY + 16;
      doc.font(bold).fontSize(8).fillColor(DARK_NAVY);
      doc.text(rtl((news.title ?? "").slice(0, 90)), cx + 2, titleY2, {
        width: CARD_W - 4, align: "right", height: 40, ellipsis: true, lineGap: 2, features: [],
      });

      // وصف الخبر (إذا توفر)
      if (news.description) {
        doc.font(reg).fontSize(7).fillColor("#444444");
        doc.text(rtl((news.description ?? "").slice(0, 200)), cx + 2, titleY2 + 46, {
          width: CARD_W - 4, align: "right", height: CARD_H - IMG_H - 75, ellipsis: true, lineGap: 2, features: [],
        });
      }

      // فئة الخبر
      if (news.category) {
        const catY = CARDS_Y + CARD_H - 18;
        fillRect(cx + 2, catY, CARD_W - 4, 14, "#e8e0d0");
        doc.font(reg).fontSize(6).fillColor(DARK_GOLD);
        doc.text(rtl(news.category.slice(0, 20)), cx + 2, catY + 3, {
          width: CARD_W - 4, align: "center", features: [],
        });
      }
    });

    // ── 7. التذييل ────────────────────────────────────────────────────────────
    const FTR_Y = H - 22;
    fillRect(0, FTR_Y - 2, W, 2, GOLD);
    fillRect(0, FTR_Y, W, 22, DARK_NAVY);

    doc.font(reg).fontSize(7).fillColor(WHITE);
    doc.text(
      `© ${new Date().getFullYear()} ArabiSmart News — ${rtl("جميع الحقوق محفوظة")}`,
      PAD, FTR_Y + 7, { width: W / 2 - PAD, align: "left", features: [] }
    );
    doc.font(reg).fontSize(7).fillColor(GOLD);
    doc.text("arabismart.vip", W / 2, FTR_Y + 7, { width: W / 2 - PAD, align: "right", features: [] });

    doc.end();
  });
}
