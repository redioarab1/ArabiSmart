"""
generate_pdf.py
Generates a single A4 page newspaper-style Arabic PDF for ArabiSmart News daily summary.
Uses WeasyPrint for full RTL/Arabic support — works in all environments (no Chrome needed).

Usage:
  python3 generate_pdf.py <json_input_file> <output_pdf_file>
"""

import sys
import json
import base64
import urllib.request
import urllib.error
import ssl
import math
import os
from datetime import datetime

# ── Helpers ──────────────────────────────────────────────────────────────────

def fetch_image_base64(url: str, timeout: int = 8) -> str | None:
    """Fetch an image URL and return a data URI, or None on failure."""
    if not url or not url.startswith("http"):
        return None
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            if resp.status != 200:
                return None
            data = resp.read()
            content_type = resp.headers.get("Content-Type", "image/jpeg").split(";")[0].strip()
            b64 = base64.b64encode(data).decode("ascii")
            return f"data:{content_type};base64,{b64}"
    except Exception:
        return None


def get_category_label(cat: str) -> str:
    labels = {
        "breaking": "عاجل", "local": "محلي", "politics": "سياسة",
        "sports": "رياضة", "economy": "اقتصاد", "world": "عالمي",
        "technology": "تقنية", "culture": "ثقافة", "health": "صحة",
        "science": "علوم",
    }
    return labels.get(cat or "", "أخبار")


def get_category_color(cat: str) -> str:
    colors = {
        "breaking": "#dc2626", "local": "#2563eb", "politics": "#7c3aed",
        "sports": "#16a34a", "economy": "#d97706", "world": "#0891b2",
        "technology": "#0d9488", "culture": "#db2777", "health": "#059669",
        "science": "#6366f1",
    }
    return colors.get(cat or "", "#64748b")


LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663028696863/TREiIprHXGJofwwf.png"

# ── HTML Builder ──────────────────────────────────────────────────────────────

def build_html(data: dict, logo_data_url: str | None) -> str:
    date_raw = data.get("date", "")
    try:
        if isinstance(date_raw, (int, float)):
            date = datetime.fromtimestamp(date_raw / 1000)
        else:
            date = datetime.fromisoformat(str(date_raw).replace("Z", "+00:00"))
    except Exception:
        date = datetime.now()

    # Arabic date
    days_ar = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
    months_ar = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                 "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    day_name = days_ar[date.weekday()]
    arabic_date = f"{day_name}، {date.day} {months_ar[date.month - 1]} {date.year}"

    issue_number = int((date.timestamp() - datetime(2024, 1, 1).timestamp()) / 86400)

    stats = data.get("statistics") or {}
    topics = data.get("trendingTopics") or []
    top_news = data.get("topNewsItems") or []

    # Summary — limit to 3 paragraphs max to fit one page
    summary_text = data.get("summary") or ""
    paragraphs = [p.strip() for p in summary_text.split("\n") if p.strip()][:4]
    half = math.ceil(len(paragraphs) / 2) if paragraphs else 0
    col1_paras = paragraphs[:half]
    col2_paras = paragraphs[half:]

    # Logo HTML — compact single-line header
    if logo_data_url:
        logo_html = f'<img src="{logo_data_url}" alt="ArabiSmart" class="header-logo" />'
    else:
        logo_html = '<div class="header-logo-fallback">AS</div>'

    # Stats HTML — 4 items in one row
    stats_items = [
        (stats.get("totalNews", 0), "إجمالي الأخبار", "📰"),
        (stats.get("arabicNews", 0), "أخبار عربية", "🌍"),
        (stats.get("swedishNews", 0), "أخبار سويدية", "🇸🇪"),
        (stats.get("activeSources", 0), "مصدر نشط", "📡"),
    ]
    stats_html = "".join(
        f'<div class="stat-card"><span class="stat-icon">{icon}</span>'
        f'<span class="stat-value">{val}</span>'
        f'<span class="stat-label">{label}</span></div>'
        for val, label, icon in stats_items
    )

    # Topics — limit to 8 pills
    topics_html = "".join(
        f'<span class="topic-pill">{t}</span>'
        for t in topics[:8]
    )

    # Summary columns
    def para_html(p: str) -> str:
        return f'<p class="summary-para">{p}</p>'

    col1_html = "".join(para_html(p) for p in col1_paras) or '<p class="summary-para">لا يوجد محتوى متاح.</p>'
    col2_html = "".join(para_html(p) for p in col2_paras)

    # News cards — max 3 items (1 featured + 2 regular) to fit one page
    featured_html = ""
    regular_cells = ""

    for idx, item in enumerate(top_news[:3]):
        cat = item.get("category", "")
        cat_label = get_category_label(cat)
        cat_color = get_category_color(cat)
        title = item.get("title", "")
        source = item.get("source", "")
        img_url = item.get("imageUrl") or item.get("image") or ""
        img_data = fetch_image_base64(img_url) if img_url else None
        source_html = f'<span class="card-source">{source}</span>' if source else ""

        if idx == 0:
            # Featured card — full width, image on the side
            if img_data:
                img_html = f'<img src="{img_data}" alt="" class="feat-img" />'
            else:
                img_html = f'<div class="feat-img feat-img-placeholder"><span>{cat_label}</span></div>'
            featured_html = f"""
            <div class="feat-card">
              {img_html}
              <div class="feat-body">
                <div class="card-meta">
                  <span class="card-badge" style="background:{cat_color}">{cat_label}</span>
                  {source_html}
                </div>
                <p class="feat-title">1. {title}</p>
              </div>
            </div>"""
        else:
            # Regular card — table cell
            if img_data:
                img_html = f'<img src="{img_data}" alt="" class="reg-img" />'
            else:
                img_html = f'<div class="reg-img reg-img-placeholder"><span>{cat_label}</span></div>'
            regular_cells += f"""
            <td class="reg-card">
              {img_html}
              <div class="card-body">
                <div class="card-meta">
                  <span class="card-badge" style="background:{cat_color}">{cat_label}</span>
                  {source_html}
                </div>
                <p class="reg-title">{idx + 1}. {title}</p>
              </div>
            </td>"""

    news_section_html = ""
    if featured_html or regular_cells:
        reg_row = f'<table class="reg-row"><tr>{regular_cells}</tr></table>' if regular_cells else ""
        news_section_html = f"""
        <div class="section-header">
          <div class="sh-line"></div>
          <div class="sh-title">⭐ أبرز الأخبار</div>
          <div class="sh-line-gold"></div>
        </div>
        {featured_html}
        {reg_row}"""

    topics_section_html = ""
    if topics:
        topics_section_html = f"""
        <div class="section-header" style="margin-top:8px">
          <div class="sh-line"></div>
          <div class="sh-title">🔥 الموضوعات الرائجة</div>
          <div class="sh-line-gold"></div>
        </div>
        <div class="topics-wrap">{topics_html}</div>"""

    total_news = stats.get("totalNews", 0)
    active_sources = stats.get("activeSources", 0)
    year = date.year

    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>ملخص الأخبار اليومي - ArabiSmart News</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    @page {{
      size: A4 portrait;
      margin: 0;
    }}

    html, body {{
      width: 210mm;
      height: 297mm;
      overflow: hidden;
    }}

    body {{
      font-family: 'Cairo', 'Amiri', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      background: #fff;
      color: #1a1a1a;
      font-size: 9pt;
      line-height: 1.55;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}

    .page {{
      width: 210mm;
      height: 297mm;
      display: flex;
      flex-direction: column;
      background: #fff;
      overflow: hidden;
    }}

    /* ══ COMPACT HEADER (single line) ══ */
    .newspaper-header {{
      background: #1a1a2e;
      padding: 5px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }}

    .header-brand {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .header-logo {{
      width: 32px;
      height: 32px;
      object-fit: contain;
      border-radius: 4px;
      border: 1px solid #c9a227;
    }}

    .header-logo-fallback {{
      width: 32px;
      height: 32px;
      background: #c9a227;
      color: #1a1a2e;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10pt;
      font-weight: 900;
    }}

    .header-site-name {{
      font-family: 'Cairo', sans-serif;
      font-size: 14pt;
      font-weight: 900;
      color: #fff;
      direction: ltr;
      unicode-bidi: bidi-override;
      line-height: 1;
    }}

    .header-site-name span {{ color: #c9a227; }}

    .header-site-ar {{
      font-family: 'Amiri', serif;
      font-size: 9pt;
      color: rgba(201,162,39,0.85);
      margin-top: 1px;
    }}

    .header-center {{
      text-align: center;
    }}

    .header-summary-label {{
      font-family: 'Amiri', serif;
      font-size: 11pt;
      font-weight: 700;
      color: #c9a227;
      line-height: 1;
    }}

    .header-date {{
      font-size: 7.5pt;
      color: rgba(255,255,255,0.7);
      margin-top: 2px;
    }}

    .header-issue {{
      text-align: left;
      font-size: 7.5pt;
      color: rgba(201,162,39,0.8);
    }}

    /* ══ GOLD DIVIDER ══ */
    .gold-divider {{
      height: 2px;
      background: linear-gradient(90deg, #1a1a2e 0%, #c9a227 30%, #f0d060 50%, #c9a227 70%, #1a1a2e 100%);
      flex-shrink: 0;
    }}

    /* ══ STATS BAR ══ */
    .stats-bar {{
      display: flex;
      background: #f8f5ee;
      border-bottom: 1px solid #ddd;
      flex-shrink: 0;
    }}

    .stat-card {{
      flex: 1;
      text-align: center;
      padding: 5px 4px;
      border-left: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }}

    .stat-card:last-child {{ border-left: none; }}

    .stat-icon {{ font-size: 11pt; line-height: 1; }}

    .stat-value {{
      font-family: 'Cairo', sans-serif;
      font-size: 13pt;
      font-weight: 900;
      color: #1a1a2e;
      line-height: 1;
    }}

    .stat-label {{ font-size: 6.5pt; color: #777; font-weight: 500; }}

    /* ══ MAIN CONTENT ══ */
    .main-content {{
      padding: 7px 14px 6px;
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 0;
      justify-content: flex-start;
    }}

    .spacer {{ display: none; }}

    /* ══ SECTION HEADER ══ */
    .section-header {{
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 10px 0 5px;
      flex-shrink: 0;
    }}

    .sh-line {{ flex: 1; height: 1.5px; background: #1a1a2e; }}
    .sh-line-gold {{ flex: 1; height: 1.5px; background: #c9a227; }}

    .sh-title {{
      font-family: 'Amiri', serif;
      font-size: 9.5pt;
      font-weight: 700;
      color: #fff;
      background: #1a1a2e;
      padding: 2px 10px;
      border-radius: 2px;
      white-space: nowrap;
    }}

    /* ══ SUMMARY COLUMNS ══ */
    .summary-cols {{
      display: table;
      width: 100%;
      table-layout: fixed;
      flex-shrink: 0;
    }}

    .summary-col {{
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding-left: 10px;
    }}

    .summary-col:last-child {{
      padding-left: 0;
      padding-right: 10px;
      border-right: 1px solid #ddd;
    }}

    .summary-para {{
      font-family: 'Amiri', serif;
      font-size: 9.5pt;
      line-height: 1.65;
      color: #2c2c2c;
      text-align: justify;
      margin-bottom: 4px;
      text-indent: 12px;
    }}

    /* ══ TOPICS ══ */
    .topics-wrap {{
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
      flex-shrink: 0;
    }}

    .topic-pill {{
      background: #1a1a2e;
      color: #c9a227;
      padding: 2px 7px;
      border-radius: 20px;
      font-size: 7pt;
      font-weight: 600;
      white-space: nowrap;
    }}

    /* ══ FEATURED CARD ══ */
    .feat-card {{
      display: flex;
      flex-direction: row;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      background: #fff;
      margin-bottom: 5px;
      flex-shrink: 0;
    }}

    .feat-img {{
      width: 120px;
      height: 75px;
      object-fit: cover;
      flex-shrink: 0;
    }}

    .feat-img-placeholder {{
      width: 120px;
      height: 75px;
      background: linear-gradient(135deg, #1a1a2e, #0f2557);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}

    .feat-img-placeholder span {{ color: #c9a227; font-size: 8pt; font-weight: 700; }}

    .feat-body {{
      padding: 6px 10px;
      flex: 1;
    }}

    .feat-title {{
      font-family: 'Amiri', serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.45;
      margin-top: 4px;
    }}

    /* ══ REGULAR CARDS ROW ══ */
    .reg-row {{
      display: table;
      width: 100%;
      border-collapse: separate;
      border-spacing: 6px 0;
      flex-shrink: 0;
    }}

    .reg-card {{
      display: table-cell;
      width: 50%;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      background: #fff;
      vertical-align: top;
    }}

    .reg-img {{
      width: 100%;
      height: 58px;
      object-fit: cover;
      display: block;
    }}

    .reg-img-placeholder {{
      width: 100%;
      height: 58px;
      background: linear-gradient(135deg, #1a1a2e, #0f2557);
      display: flex;
      align-items: center;
      justify-content: center;
    }}

    .reg-img-placeholder span {{ color: #c9a227; font-size: 7.5pt; font-weight: 700; }}

    .card-body {{ padding: 5px 8px; }}

    .card-meta {{
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 3px;
    }}

    .card-badge {{
      color: #fff;
      font-size: 6.5pt;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 2px;
    }}

    .card-source {{ font-size: 6.5pt; color: #888; }}

    .reg-title {{
      font-family: 'Amiri', serif;
      font-size: 9pt;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.4;
    }}

    /* ══ AI BADGE ══ */
    .ai-badge {{
      margin-top: 6px;
      padding: 5px 10px;
      background: linear-gradient(135deg, #0a1628, #0f2557);
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }}

    .ai-icon {{ font-size: 13pt; flex-shrink: 0; }}
    .ai-text {{ color: #fff; font-size: 7pt; line-height: 1.4; }}
    .ai-text strong {{ color: #c9a227; font-size: 7.5pt; }}

    /* ══ FOOTER (single line) ══ */
    .newspaper-footer {{
      background: #1a1a2e;
      padding: 5px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      margin-top: auto;
    }}

    .footer-divider {{
      height: 1px;
      background: #c9a227;
      opacity: 0.4;
      flex-shrink: 0;
    }}

    .footer-copy {{
      font-family: 'Cairo', sans-serif;
      font-size: 7pt;
      color: rgba(201,162,39,0.9);
      white-space: nowrap;
    }}

    .footer-url {{
      font-size: 7pt;
      color: rgba(201,162,39,0.6);
      direction: ltr;
    }}
  </style>
</head>
<body>
<div class="page">

  <!-- COMPACT HEADER — single line -->
  <header class="newspaper-header">
    <div class="header-brand">
      {logo_html}
      <div>
        <div class="header-site-name">Arabi<span>Smart</span> News</div>
        <div class="header-site-ar">عربي سمارت للأخبار</div>
      </div>
    </div>
    <div class="header-center">
      <div class="header-summary-label">📰 ملخص الأخبار اليومي</div>
      <div class="header-date">{arabic_date}</div>
    </div>
    <div class="header-issue">
      <div>العدد {issue_number}</div>
      <div style="margin-top:2px">arabismart.vip</div>
    </div>
  </header>

  <div class="gold-divider"></div>

  <!-- STATS BAR -->
  <div class="stats-bar">{stats_html}</div>

  <!-- MAIN CONTENT -->
  <div class="main-content">

    <div class="section-header">
      <div class="sh-line"></div>
      <div class="sh-title">✦ ملخص اليوم ✦</div>
      <div class="sh-line-gold"></div>
    </div>

    <div class="summary-cols">
      <div class="summary-col">{col1_html}</div>
      <div class="summary-col">{col2_html}</div>
    </div>

    <div class="spacer"></div>
    {topics_section_html}
    <div class="spacer"></div>
    {news_section_html}
    <div class="spacer"></div>
    <div class="ai-badge">
      <div class="ai-icon">🤖</div>
      <div class="ai-text">
        <strong>مُولَّد بالذكاء الاصطناعي</strong> —
        تم توليده تلقائياً بواسطة نظام الذكاء الاصطناعي في ArabiSmart News
        من خلال تحليل {total_news} خبراً من {active_sources} مصدراً إخبارياً موثوقاً.
      </div>
    </div>

  </div>

  <!-- FOOTER — single line -->
  <div class="footer-divider"></div>
  <footer class="newspaper-footer">
    <div class="footer-copy">ArabiSmart News — جميع الحقوق محفوظة © {year}</div>
    <div class="footer-url">arabismart.vip</div>
  </footer>

</div>
</body>
</html>"""


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 generate_pdf.py <input.json> <output.pdf>", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Fetch logo
    logo_data_url = fetch_image_base64(LOGO_URL)

    # Build HTML
    html = build_html(data, logo_data_url)

    # Generate PDF with WeasyPrint
    try:
        import weasyprint
        pdf_bytes = weasyprint.HTML(string=html, base_url=None).write_pdf()
        with open(output_file, "wb") as f:
            f.write(pdf_bytes)
        print(f"OK:{len(pdf_bytes)}", flush=True)
    except Exception as e:
        print(f"ERROR:{e}", file=sys.stderr, flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
