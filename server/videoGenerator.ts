/**
 * videoGenerator.ts — Cinematic Arabic News Video Generator
 * ──────────────────────────────────────────────────────────
 * Generates a broadcast-quality daily news video using FFmpeg with:
 *  • Cinematic dark theme with gradient overlays & animated bars
 *  • Arabic text rendered with Amiri font (proper RTL)
 *  • News images composited as full-bleed backgrounds with vignette
 *  • gTTS Arabic TTS narration auto-generated and embedded
 *  • Proxy URL via arabismart.vip/media/:filename
 */

import path from "path";
import fs from "fs";
import os from "os";
import { execFileSync, execSync } from "child_process";
import https from "https";
import http from "http";
import { storagePut } from "./storage";
import { getDailySummaryByDate } from "./db";
import { buildProxyUrl } from "./mediaProxy";

export type VideoGenerationResult = {
  success: boolean;
  videoUrl?: string;    // S3/CloudFront URL
  proxyUrl?: string;    // arabismart.vip/media/... URL
  videoKey?: string;
  error?: string;
  method: "ffmpeg" | "ffmpeg-static" | "none";
};

export type VideoInput = {
  summary: string;
  date: string; // YYYY-MM-DD
  topNews: Array<{ title: string; source: string; image?: string; id?: number }>;
  trendingTopics: string[];
  audioUrl?: string;
  language: "ar" | "sv" | "en";
};

// ─── Arabic font paths ────────────────────────────────────────────────────────
const ARABIC_FONTS = [
  "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Regular.ttf",
  "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf",
  "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
];
const ARABIC_FONTS_BOLD = [
  "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Bold.ttf",
  "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf",
  "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf",
];

function getFont(bold = false): string {
  const list = bold ? ARABIC_FONTS_BOLD : ARABIC_FONTS;
  for (const f of list) if (fs.existsSync(f)) return f;
  return "";
}

// ─── FFmpeg binary ────────────────────────────────────────────────────────────
function getFfmpegPath(): { path: string; isStatic: boolean } {
  try { execFileSync("ffmpeg", ["-version"], { stdio: "pipe", timeout: 5000 }); return { path: "ffmpeg", isStatic: false }; } catch {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const s = require("ffmpeg-static") as string | null;
    if (s && fs.existsSync(s)) return { path: s, isStatic: true };
  } catch {}
  throw new Error("FFmpeg not found");
}

// ─── Download helper ──────────────────────────────────────────────────────────
async function download(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const proto = url.startsWith("https") ? https : http;
      const file = fs.createWriteStream(dest);
      const req = proto.get(url, { timeout: 15000 }, (res) => {
        if (!res.statusCode || res.statusCode >= 400) { file.close(); fs.unlink(dest, () => {}); resolve(false); return; }
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(true); });
      });
      req.on("error", () => { file.close(); fs.unlink(dest, () => {}); resolve(false); });
      req.on("timeout", () => { req.destroy(); resolve(false); });
    } catch { resolve(false); }
  });
}

// ─── Sanitize text for FFmpeg drawtext ───────────────────────────────────────
function san(text: string, max = 50): string {
  return text
    .replace(/[\\:'"[\]{}()|&;<>!%@#$^*+=`~]/g, " ")
    .replace(/\n/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

// ─── Generate TTS audio using gTTS (Python) ──────────────────────────────────
async function generateTTSAudio(
  input: VideoInput,
  tmpDir: string
): Promise<string | null> {
  try {
    const langMap: Record<string, string> = { ar: "ar", sv: "sv", en: "en" };
    const lang = langMap[input.language] || "ar";

    // Build narration script
    const dateFormatted = input.date;
    const newsLines = input.topNews
      .slice(0, 3)
      .map((n, i) => `الخبر ${i + 1}: ${n.title}. المصدر: ${n.source}.`)
      .join(" ");

    const script =
      input.language === "ar"
        ? `بسم الله الرحمن الرحيم. مرحباً بكم في نشرة أخبار اليوم ${dateFormatted} من موقع أرابي سمارت نيوز. ${newsLines} وفيما يخص ملخص اليوم: ${input.summary.slice(0, 200)}. شكراً لمتابعتكم، ونلقاكم في نشرة قادمة.`
        : input.language === "sv"
        ? `Välkommen till dagens nyheter ${dateFormatted} från ArabiSmart News. ${input.topNews.map(n => n.title).join(". ")}. Tack för att du tittar.`
        : `Welcome to today's news bulletin ${dateFormatted} from ArabiSmart News. ${input.topNews.map(n => n.title).join(". ")}. Thank you for watching.`;

    const audioPath = path.join(tmpDir, "narration.mp3");

    // Write Python script to file
    const pyScript = path.join(tmpDir, "gen_tts.py");
    fs.writeFileSync(pyScript, `
from gtts import gTTS
import sys
text = sys.argv[1]
lang = sys.argv[2]
out = sys.argv[3]
tts = gTTS(text=text, lang=lang, slow=False)
tts.save(out)
print("TTS_OK:" + str(len(open(out,'rb').read())))
`);

    const result = execSync(
      `python3 "${pyScript}" "${script.replace(/"/g, "'")}" "${lang}" "${audioPath}"`,
      { timeout: 60000, encoding: "utf8" }
    );

    if (result.includes("TTS_OK") && fs.existsSync(audioPath)) {
      console.log("[VideoGenerator] ✅ TTS audio generated:", fs.statSync(audioPath).size, "bytes");
      return audioPath;
    }
    return null;
  } catch (err) {
    console.warn("[VideoGenerator] TTS generation failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Build cinematic FFmpeg filter_complex ────────────────────────────────────
function buildCinematicFilter(
  input: VideoInput,
  imagePaths: string[],
  hasAudio: boolean,
  totalDuration: number
): { filterComplex: string; inputArgs: string[]; mapArgs: string[] } {
  const font = getFont(false);
  const fontBold = getFont(true);
  const ff = (bold = false) => (bold ? fontBold : font) ? `:fontfile=${bold ? fontBold : font}` : "";

  // ── Cinematic color palette
  const GOLD = "0xF5A623";
  const RED_ACCENT = "0xE53E3E";
  const WHITE = "white";
  const DIM = "0xA0AEC0";
  const BG_DARK = "0x0A0E1A";       // near-black navy
  const BG_CARD = "0x111827@0.85";  // dark card

  // ── Text content
  const siteName = "ArabiSmart News";
  const dateLabel = san(
    input.language === "ar" ? `الملخص اليومي — ${input.date}` :
    input.language === "sv" ? `Daglig sammanfattning — ${input.date}` :
    `Daily Summary — ${input.date}`, 60
  );
  const headlineLabel = input.language === "ar" ? "أبرز الأخبار" : input.language === "sv" ? "Toppnyheter" : "Top Headlines";
  const summaryLabel  = input.language === "ar" ? "ملخص اليوم"  : input.language === "sv" ? "Sammanfattning" : "Today's Summary";
  const trendLabel    = input.language === "ar" ? "الأكثر تداولاً" : input.language === "sv" ? "Trender" : "Trending";
  const footerLabel   = "arabismart.vip";

  const n1 = san(input.topNews[0]?.title || "", 52);
  const s1 = san(input.topNews[0]?.source || "", 22);
  const n2 = san(input.topNews[1]?.title || "", 52);
  const s2 = san(input.topNews[1]?.source || "", 22);
  const n3 = san(input.topNews[2]?.title || "", 52);
  const s3 = san(input.topNews[2]?.source || "", 22);
  const summaryText = san(input.summary, 68);
  const topics = san(input.trendingTopics.slice(0, 5).join("  ·  "), 75);

  // Scene timing
  const T1_START = 0,  T1_END = 12;   // Headlines
  const T2_START = 12, T2_END = 22;   // Summary
  const T3_START = 22, T3_END = totalDuration; // Trending + outro

  // ── Input args: [0]=bg, [1..N]=images
  const inputArgs: string[] = [
    "-f", "lavfi",
    "-i", `color=c=${BG_DARK}:size=1280x720:rate=30:duration=${totalDuration}`,
  ];
  for (const img of imagePaths) inputArgs.push("-i", img);

  const filters: string[] = [];

  // ── Process images: scale + vignette effect
  for (let i = 0; i < imagePaths.length; i++) {
    // Scale to 1280x720 (full bleed), then darken for cinematic look
    filters.push(
      `[${i + 1}:v]scale=1280:720:force_original_aspect_ratio=increase,` +
      `crop=1280:720,` +
      `colorchannelmixer=rr=0.7:gg=0.7:bb=0.7[img${i}raw]`,
      // Add dark gradient overlay on top of image
      `[img${i}raw]vignette=PI/4[img${i}]`
    );
  }

  // ── Compose background: use image as full-bleed bg per scene, else solid bg
  let lastStream = "0:v";

  if (imagePaths.length >= 1) {
    // Scene 1 bg: image 0 (t=0..12)
    filters.push(`[${lastStream}][img0]overlay=x=0:y=0:enable='between(t,${T1_START},${T1_END})'[bg1]`);
    lastStream = "bg1";
  }
  if (imagePaths.length >= 2) {
    // Scene 2 bg: image 1 (t=12..22)
    filters.push(`[${lastStream}][img1]overlay=x=0:y=0:enable='between(t,${T2_START},${T2_END})'[bg2]`);
    lastStream = "bg2";
  }
  if (imagePaths.length >= 3) {
    // Scene 3 bg: image 2 (t=22..end)
    filters.push(`[${lastStream}][img2]overlay=x=0:y=0:enable='between(t,${T3_START},${T3_END})'[bg3]`);
    lastStream = "bg3";
  }

  // ── Cinematic overlay bars & text
  const drawFilters: string[] = [

    // ── Top gradient bar (always)
    `drawbox=x=0:y=0:w=1280:h=90:color=${BG_DARK}@0.75:t=fill`,
    `drawbox=x=0:y=0:w=1280:h=4:color=${GOLD}@1.0:t=fill`,

    // Site name — top center (always)
    `drawtext=text='${siteName}'${ff(true)}:fontcolor=${GOLD}:fontsize=42:x=(w-text_w)/2:y=22`,

    // Date line (always)
    `drawtext=text='${dateLabel}'${ff()}:fontcolor=${DIM}:fontsize=22:x=(w-text_w)/2:y=68`,

    // ── Bottom bar (always)
    `drawbox=x=0:y=660:w=1280:h=60:color=${BG_DARK}@0.85:t=fill`,
    `drawbox=x=0:y=660:w=1280:h=3:color=${RED_ACCENT}@1.0:t=fill`,
    `drawtext=text='${footerLabel}'${ff()}:fontcolor=${GOLD}:fontsize=20:x=(w-text_w)/2:y=678`,

    // ── SCENE 1: Headlines ──────────────────────────────────────────────────
    // Section header
    `drawbox=x=0:y=100:w=1280:h=55:color=${BG_DARK}@0.7:t=fill:enable='between(t,${T1_START},${T1_END})'`,
    `drawtext=text='${headlineLabel}'${ff(true)}:fontcolor=${WHITE}:fontsize=30:x=40:y=115:enable='between(t,${T1_START},${T1_END})'`,
    `drawbox=x=0:y=155:w=1280:h=2:color=${GOLD}@0.6:t=fill:enable='between(t,${T1_START},${T1_END})'`,

    // News card backgrounds
    `drawbox=x=0:y=158:w=1280:h=70:color=${BG_CARD}:t=fill:enable='between(t,1,${T1_END})'`,
    `drawbox=x=0:y=230:w=1280:h=70:color=${BG_CARD}:t=fill:enable='between(t,3,${T1_END})'`,
    `drawbox=x=0:y=302:w=1280:h=70:color=${BG_CARD}:t=fill:enable='between(t,5,${T1_END})'`,

    // Red accent left border on cards
    `drawbox=x=0:y=158:w=5:h=70:color=${RED_ACCENT}@1.0:t=fill:enable='between(t,1,${T1_END})'`,
    `drawbox=x=0:y=230:w=5:h=70:color=${RED_ACCENT}@1.0:t=fill:enable='between(t,3,${T1_END})'`,
    `drawbox=x=0:y=302:w=5:h=70:color=${RED_ACCENT}@1.0:t=fill:enable='between(t,5,${T1_END})'`,

    // News 1
    ...(n1 ? [
      `drawtext=text='${n1}'${ff()}:fontcolor=${WHITE}:fontsize=26:x=20:y=168:enable='between(t,1,${T1_END})'`,
      `drawtext=text='${s1}'${ff()}:fontcolor=${GOLD}:fontsize=18:x=20:y=200:enable='between(t,1,${T1_END})'`,
    ] : []),
    // News 2
    ...(n2 ? [
      `drawtext=text='${n2}'${ff()}:fontcolor=${WHITE}:fontsize=26:x=20:y=240:enable='between(t,3,${T1_END})'`,
      `drawtext=text='${s2}'${ff()}:fontcolor=${GOLD}:fontsize=18:x=20:y=272:enable='between(t,3,${T1_END})'`,
    ] : []),
    // News 3
    ...(n3 ? [
      `drawtext=text='${n3}'${ff()}:fontcolor=${WHITE}:fontsize=26:x=20:y=312:enable='between(t,5,${T1_END})'`,
      `drawtext=text='${s3}'${ff()}:fontcolor=${GOLD}:fontsize=18:x=20:y=344:enable='between(t,5,${T1_END})'`,
    ] : []),

    // ── SCENE 2: Summary ────────────────────────────────────────────────────
    `drawbox=x=0:y=100:w=1280:h=55:color=${BG_DARK}@0.7:t=fill:enable='between(t,${T2_START},${T2_END})'`,
    `drawtext=text='${summaryLabel}'${ff(true)}:fontcolor=${WHITE}:fontsize=30:x=40:y=115:enable='between(t,${T2_START},${T2_END})'`,
    `drawbox=x=0:y=155:w=1280:h=2:color=${GOLD}@0.6:t=fill:enable='between(t,${T2_START},${T2_END})'`,
    `drawbox=x=0:y=158:w=1280:h=90:color=${BG_CARD}:t=fill:enable='between(t,${T2_START},${T2_END})'`,
    `drawbox=x=0:y=158:w=5:h=90:color=${GOLD}@1.0:t=fill:enable='between(t,${T2_START},${T2_END})'`,
    `drawtext=text='${summaryText}'${ff()}:fontcolor=${WHITE}:fontsize=26:x=20:y=175:enable='between(t,${T2_START},${T2_END})'`,

    // ── SCENE 3: Trending ───────────────────────────────────────────────────
    `drawbox=x=0:y=100:w=1280:h=55:color=${BG_DARK}@0.7:t=fill:enable='between(t,${T3_START},${T3_END})'`,
    `drawtext=text='${trendLabel}'${ff(true)}:fontcolor=${WHITE}:fontsize=30:x=40:y=115:enable='between(t,${T3_START},${T3_END})'`,
    `drawbox=x=0:y=155:w=1280:h=2:color=${GOLD}@0.6:t=fill:enable='between(t,${T3_START},${T3_END})'`,
    `drawbox=x=0:y=158:w=1280:h=70:color=${BG_CARD}:t=fill:enable='between(t,${T3_START},${T3_END})'`,
    `drawtext=text='${topics}'${ff()}:fontcolor=${GOLD}:fontsize=28:x=(w-text_w)/2:y=180:enable='between(t,${T3_START},${T3_END})'`,

    // ── Animated ticker line at bottom of content area (always)
    `drawbox=x=0:y=390:w=1280:h=2:color=${RED_ACCENT}@0.4:t=fill`,
  ];

  filters.push(`[${lastStream}]${drawFilters.join(",")}[vout]`);

  const mapArgs = ["-map", "[vout]"];
  if (hasAudio) mapArgs.push("-map", `${imagePaths.length + 1}:a`);

  return { filterComplex: filters.join(";"), inputArgs, mapArgs };
}

// ─── Main generation ──────────────────────────────────────────────────────────
async function generateWithFFmpeg(
  input: VideoInput,
  outputPath: string
): Promise<{ success: boolean; method: "ffmpeg" | "ffmpeg-static" }> {
  const { path: ffmpegBin, isStatic } = getFfmpegPath();
  const method: "ffmpeg" | "ffmpeg-static" = isStatic ? "ffmpeg-static" : "ffmpeg";
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arabismart-vid-"));

  try {
    // 1. Download news images
    const imagePaths: string[] = [];
    for (let i = 0; i < Math.min(input.topNews.length, 3); i++) {
      const imgUrl = input.topNews[i]?.image;
      if (imgUrl && imgUrl.startsWith("http")) {
        const ext = imgUrl.includes(".png") ? ".png" : ".jpg";
        const dest = path.join(tmpDir, `img${i}${ext}`);
        const ok = await download(imgUrl, dest);
        if (ok) imagePaths.push(dest);
      }
    }

    // 2. Generate TTS audio (or use provided audioUrl)
    let audioPath: string | null = null;
    if (input.audioUrl && input.audioUrl.startsWith("http")) {
      const ext = input.audioUrl.includes(".mp3") ? ".mp3" : ".webm";
      const dest = path.join(tmpDir, `podcast${ext}`);
      audioPath = await download(input.audioUrl, dest) ? dest : null;
    }
    if (!audioPath) {
      // Auto-generate TTS narration
      audioPath = await generateTTSAudio(input, tmpDir);
    }

    // 3. Determine video duration (match audio length if available)
    let duration = 30;
    if (audioPath) {
      try {
        const probe = execFileSync(ffmpegBin, [
          "-i", audioPath, "-f", "null", "-"
        ], { stdio: "pipe", timeout: 10000 }).toString();
        const match = probe.match(/Duration: (\d+):(\d+):(\d+\.?\d*)/);
        if (match) {
          const secs = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
          duration = Math.max(30, Math.min(120, Math.ceil(secs) + 2));
        }
      } catch {
        // ffprobe output goes to stderr, try stderr
        try {
          let stderrOut = "";
          try {
            execFileSync(ffmpegBin, ["-i", audioPath], { stdio: ["pipe", "pipe", "pipe"], timeout: 5000 });
          } catch (e: unknown) {
            stderrOut = (e as { stderr?: Buffer }).stderr?.toString() || "";
          }
          const match = stderrOut.match(/Duration: (\d+):(\d+):(\d+\.?\d*)/);
          if (match) {
            const secs = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
            duration = Math.max(30, Math.min(120, Math.ceil(secs) + 2));
          }
        } catch { /* ignore */ }
      }
    }

    console.log(`[VideoGenerator] Duration: ${duration}s | Images: ${imagePaths.length} | Audio: ${!!audioPath}`);

    // 4. Build filter complex
    const { filterComplex, inputArgs, mapArgs } = buildCinematicFilter(
      input, imagePaths, !!audioPath, duration
    );

    // 5. Build FFmpeg args
    const args: string[] = ["-y", ...inputArgs];
    if (audioPath) args.push("-i", audioPath);

    args.push(
      "-filter_complex", filterComplex,
      ...mapArgs,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
    );
    if (audioPath) args.push("-c:a", "aac", "-b:a", "128k", "-shortest");
    args.push(outputPath);

    console.log(`[VideoGenerator] Generating cinematic video with ${method}...`);
    execFileSync(ffmpegBin, args, { timeout: 180000, stdio: "pipe" });

    return { success: fs.existsSync(outputPath), method };
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function generateDailyPodcastVideo(
  input: VideoInput
): Promise<VideoGenerationResult> {
  const tmpOutput = path.join(
    os.tmpdir(),
    `arabismart-daily-${input.date}-${input.language}-${Date.now()}.mp4`
  );
  if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);

  try {
    const { success, method } = await generateWithFFmpeg(input, tmpOutput);
    if (!success) return { success: false, error: "FFmpeg produced no output", method: "none" };

    const videoBuffer = fs.readFileSync(tmpOutput);
    const fileKey = `daily-videos/${input.date}-${input.language}-${Date.now()}.mp4`;
    const { url } = await storagePut(fileKey, videoBuffer, "video/mp4");
    try { fs.unlinkSync(tmpOutput); } catch {}

    const proxyUrl = buildProxyUrl(url);
    console.log(`[VideoGenerator] ✅ Video ready: ${proxyUrl} (method: ${method})`);
    return { success: true, videoUrl: url, proxyUrl, videoKey: fileKey, method };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[VideoGenerator] Failed:", msg);
    try { fs.unlinkSync(tmpOutput); } catch {}
    return { success: false, error: msg, method: "none" };
  }
}

// ─── Generate from DB summary ─────────────────────────────────────────────────
export async function generateVideoFromDailySummary(
  date: Date,
  language: "ar" | "sv" | "en" = "ar"
): Promise<VideoGenerationResult> {
  const summaryRecord = await getDailySummaryByDate(date);
  if (!summaryRecord) {
    return { success: false, error: `No daily summary for ${date.toISOString().split("T")[0]}`, method: "none" };
  }

  let topNewsIds: number[] = [];
  let trendingTopics: string[] = [];
  try { topNewsIds = JSON.parse(summaryRecord.topNews as string || "[]").slice(0, 3); } catch {}
  try { trendingTopics = JSON.parse(summaryRecord.trendingTopics as string || "[]"); } catch {}

  const topNews: Array<{ title: string; source: string; image?: string; id?: number }> = [];
  if (topNewsIds.length > 0) {
    const { getNewsById } = await import("./db");
    for (const id of topNewsIds) {
      try {
        const item = await getNewsById(id);
        if (item) topNews.push({ id: item.id, title: item.title, source: item.source || "", image: item.image || undefined });
      } catch {}
    }
  }

  return generateDailyPodcastVideo({
    summary: summaryRecord.summary,
    date: date.toISOString().split("T")[0],
    topNews,
    trendingTopics,
    audioUrl: (summaryRecord as Record<string, unknown>).podcastUrl as string | undefined,
    language,
  });
}
