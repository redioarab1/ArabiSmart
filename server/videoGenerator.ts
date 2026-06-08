/**
 * videoGenerator.ts
 * Generates a daily news video using FFmpeg with:
 * - Arabic font support (Amiri) with fallback to NotoNaskhArabic
 * - News images from the site (downloaded and composited)
 * - Podcast audio embedded in the video
 * - ffmpeg-static fallback for production (Cloud Run)
 */

import path from "path";
import fs from "fs";
import os from "os";
import { execFileSync } from "child_process";
import https from "https";
import http from "http";
import { storagePut } from "./storage";
import { getDailySummaryByDate } from "./db";

export type VideoGenerationResult = {
  success: boolean;
  videoUrl?: string;
  videoKey?: string;
  error?: string;
  method: "ffmpeg" | "ffmpeg-static" | "none";
};

export type VideoInput = {
  summary: string;
  date: string; // YYYY-MM-DD
  topNews: Array<{ title: string; source: string; image?: string; id?: number }>;
  trendingTopics: string[];
  audioUrl?: string; // Podcast audio URL to embed
  language: "ar" | "sv" | "en";
};

// ─── Arabic font paths ────────────────────────────────────────────────────────
const ARABIC_FONTS = [
  "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Regular.ttf",
  "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf",
  "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
];

const ARABIC_FONT_BOLD = [
  "/usr/share/fonts/opentype/fonts-hosny-amiri/Amiri-Bold.ttf",
  "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf",
  "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf",
];

function getFont(bold = false): string {
  const list = bold ? ARABIC_FONT_BOLD : ARABIC_FONTS;
  for (const f of list) {
    if (fs.existsSync(f)) return f;
  }
  return ""; // let FFmpeg pick default
}

// ─── Resolve FFmpeg binary ────────────────────────────────────────────────────
function getFfmpegPath(): { path: string; isStatic: boolean } {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "pipe", timeout: 5000 });
    return { path: "ffmpeg", isStatic: false };
  } catch {
    // System ffmpeg not available
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegStatic = require("ffmpeg-static") as string | null;
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
      return { path: ffmpegStatic, isStatic: true };
    }
  } catch {
    // ffmpeg-static not installed
  }
  throw new Error("FFmpeg not found. Install ffmpeg or ffmpeg-static.");
}

// ─── Download image to local temp file ───────────────────────────────────────
async function downloadImage(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const proto = url.startsWith("https") ? https : http;
      const file = fs.createWriteStream(destPath);
      const req = proto.get(url, { timeout: 10000 }, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          resolve(false);
          return;
        }
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(true); });
      });
      req.on("error", () => { file.close(); fs.unlink(destPath, () => {}); resolve(false); });
      req.on("timeout", () => { req.destroy(); resolve(false); });
    } catch {
      resolve(false);
    }
  });
}

// ─── Download audio to local temp file ───────────────────────────────────────
async function downloadAudio(url: string, destPath: string): Promise<boolean> {
  return downloadImage(url, destPath); // same logic
}

// ─── Sanitize text for FFmpeg drawtext ───────────────────────────────────────
function sanitize(text: string, maxLen = 55): string {
  return text
    .replace(/[\\:'"[\]{}()|&;<>!%]/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

// ─── Build FFmpeg filter_complex with images + text ──────────────────────────
interface BuildResult {
  filterComplex: string;
  inputArgs: string[];
  mapArgs: string[];
}

function buildFilterComplex(
  input: VideoInput,
  imagePaths: string[],
  hasAudio: boolean
): BuildResult {
  const arabicFont = getFont(false);
  const arabicFontBold = getFont(true);

  const fontArg = arabicFont ? `:fontfile=${arabicFont}` : "";
  const fontArgBold = arabicFontBold ? `:fontfile=${arabicFontBold}` : fontArg;

  const accentColor = "0x38bdf8";
  const textColor = "white";
  const dimColor = "0xa0aec0";
  const bgDark = "0x0f172a";
  const bgMid = "0x1e293b";

  // Texts
  const siteLabel = "ArabiSmart News";
  const dateLabel = sanitize(
    input.language === "ar"
      ? `الملخص اليومي - ${input.date}`
      : input.language === "sv"
      ? `Daglig sammanfattning - ${input.date}`
      : `Daily Summary - ${input.date}`,
    55
  );
  const headlinesLabel = input.language === "ar" ? "أبرز الأخبار" : input.language === "sv" ? "Toppnyheter" : "Top Headlines";
  const summaryLabel = input.language === "ar" ? "الملخص" : input.language === "sv" ? "Sammanfattning" : "Summary";
  const trendingLabel = input.language === "ar" ? "الأكثر تداولاً" : input.language === "sv" ? "Trender" : "Trending";

  const news1 = sanitize(input.topNews[0]?.title || "", 52);
  const news2 = sanitize(input.topNews[1]?.title || "", 52);
  const news3 = sanitize(input.topNews[2]?.title || "", 52);
  const src1 = sanitize(input.topNews[0]?.source || "", 20);
  const src2 = sanitize(input.topNews[1]?.source || "", 20);
  const src3 = sanitize(input.topNews[2]?.source || "", 20);
  const topicsStr = sanitize(input.trendingTopics.slice(0, 4).join("  |  "), 70);
  const summaryShort = sanitize(input.summary, 65);

  // ── Input streams: [0] = background color, [1..N] = images
  const inputArgs: string[] = [
    "-f", "lavfi",
    "-i", `color=c=${bgDark}:size=1280x720:rate=30:duration=30`,
  ];

  // Add image inputs
  for (const imgPath of imagePaths) {
    inputArgs.push("-i", imgPath);
  }

  // ── Filter complex
  const filters: string[] = [];

  // Scale each image to fit a 400x225 slot (16:9 thumbnail)
  const imgSlots: string[] = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const inputIdx = i + 1; // 0 = bg, 1..N = images
    filters.push(`[${inputIdx}:v]scale=400:225:force_original_aspect_ratio=increase,crop=400:225[img${i}]`);
    imgSlots.push(`img${i}`);
  }

  // Overlay images on background at specific times
  // Scene 1 (t=0..12): Headlines + images
  // Scene 2 (t=12..22): Summary text
  // Scene 3 (t=22..30): Trending + outro
  let lastStream = "0:v";

  if (imgSlots.length > 0) {
    // Overlay image 0 at top-right during scene 1 (t=1..12)
    filters.push(`[${lastStream}][${imgSlots[0]}]overlay=x=840:y=160:enable='between(t,1,12)'[ov0]`);
    lastStream = "ov0";
  }
  if (imgSlots.length > 1) {
    // Overlay image 1 at bottom-right during scene 1 (t=4..12)
    filters.push(`[${lastStream}][${imgSlots[1]}]overlay=x=840:y=390:enable='between(t,4,12)'[ov1]`);
    lastStream = "ov1";
  }
  if (imgSlots.length > 2) {
    // Overlay image 2 centered during scene 2 (t=12..22)
    filters.push(`[${lastStream}][${imgSlots[2]}]overlay=x=440:y=200:enable='between(t,12,22)'[ov2]`);
    lastStream = "ov2";
  }

  // ── Drawtext filters on top of composited video
  const drawFilters: string[] = [
    // Top accent bar
    `drawbox=x=0:y=0:w=1280:h=8:color=${accentColor}@1.0:t=fill`,

    // Site name (always)
    `drawtext=text='${siteLabel}'${fontArgBold}:fontcolor=${accentColor}:fontsize=46:x=(w-text_w)/2:y=25:enable='between(t,0,30)'`,

    // Date line (always)
    `drawtext=text='${dateLabel}'${fontArg}:fontcolor=${dimColor}:fontsize=26:x=(w-text_w)/2:y=90:enable='between(t,0,30)'`,

    // Divider
    `drawbox=x=60:y=130:w=1160:h=2:color=${accentColor}@0.4:t=fill:enable='between(t,0,30)'`,

    // ── Scene 1: Headlines (t=0..12)
    `drawtext=text='${headlinesLabel}'${fontArgBold}:fontcolor=${accentColor}:fontsize=32:x=60:y=155:enable='between(t,0,12)'`,
    ...(news1 ? [
      `drawtext=text='1. ${news1}'${fontArg}:fontcolor=${textColor}:fontsize=24:x=60:y=210:enable='between(t,1,12)'`,
      `drawtext=text='${src1}'${fontArg}:fontcolor=${dimColor}:fontsize=18:x=60:y=242:enable='between(t,1,12)'`,
    ] : []),
    ...(news2 ? [
      `drawtext=text='2. ${news2}'${fontArg}:fontcolor=${textColor}:fontsize=24:x=60:y=290:enable='between(t,3,12)'`,
      `drawtext=text='${src2}'${fontArg}:fontcolor=${dimColor}:fontsize=18:x=60:y=322:enable='between(t,3,12)'`,
    ] : []),
    ...(news3 ? [
      `drawtext=text='3. ${news3}'${fontArg}:fontcolor=${textColor}:fontsize=24:x=60:y=370:enable='between(t,5,12)'`,
      `drawtext=text='${src3}'${fontArg}:fontcolor=${dimColor}:fontsize=18:x=60:y=402:enable='between(t,5,12)'`,
    ] : []),

    // ── Scene 2: Summary (t=12..22)
    `drawtext=text='${summaryLabel}'${fontArgBold}:fontcolor=${accentColor}:fontsize=32:x=60:y=155:enable='between(t,12,22)'`,
    `drawtext=text='${summaryShort}'${fontArg}:fontcolor=${textColor}:fontsize=26:x=60:y=210:enable='between(t,12,22)'`,

    // ── Scene 3: Trending (t=22..30)
    `drawtext=text='${trendingLabel}'${fontArgBold}:fontcolor=${accentColor}:fontsize=32:x=60:y=155:enable='between(t,22,30)'`,
    `drawtext=text='${topicsStr}'${fontArg}:fontcolor=${textColor}:fontsize=28:x=60:y=220:enable='between(t,22,30)'`,

    // ── Bottom bar (always)
    `drawbox=x=0:y=670:w=1280:h=50:color=${bgMid}@1.0:t=fill`,
    `drawtext=text='arabismart.vip'${fontArg}:fontcolor=${accentColor}:fontsize=22:x=(w-text_w)/2:y=686:enable='between(t,0,30)'`,
  ];

  // Combine: overlay stream → drawtext chain
  const drawChain = drawFilters.join(",");
  filters.push(`[${lastStream}]${drawChain}[vout]`);

  const filterComplex = filters.join(";");

  const mapArgs = ["-map", "[vout]"];
  if (hasAudio) {
    mapArgs.push("-map", `${imagePaths.length + 1}:a`);
  }

  return { filterComplex, inputArgs, mapArgs };
}

// ─── Main generation function ─────────────────────────────────────────────────
async function generateWithFFmpeg(
  input: VideoInput,
  outputPath: string
): Promise<{ success: boolean; method: "ffmpeg" | "ffmpeg-static" }> {
  const { path: ffmpegBin, isStatic } = getFfmpegPath();
  const method = isStatic ? "ffmpeg-static" : "ffmpeg";
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arabismart-vid-"));

  try {
    // 1. Download news images
    const imagePaths: string[] = [];
    for (let i = 0; i < Math.min(input.topNews.length, 3); i++) {
      const imgUrl = input.topNews[i]?.image;
      if (imgUrl && imgUrl.startsWith("http")) {
        const ext = imgUrl.includes(".png") ? ".png" : ".jpg";
        const dest = path.join(tmpDir, `news_img_${i}${ext}`);
        const ok = await downloadImage(imgUrl, dest);
        if (ok) imagePaths.push(dest);
      }
    }

    // 2. Download audio if available
    let audioPath: string | null = null;
    if (input.audioUrl && input.audioUrl.startsWith("http")) {
      const ext = input.audioUrl.includes(".mp3") ? ".mp3" : ".webm";
      const dest = path.join(tmpDir, `podcast${ext}`);
      const ok = await downloadAudio(input.audioUrl, dest);
      if (ok) audioPath = dest;
    }

    // 3. Build filter complex
    const { filterComplex, inputArgs, mapArgs } = buildFilterComplex(
      input,
      imagePaths,
      !!audioPath
    );

    // 4. Build full FFmpeg args
    const args: string[] = [
      "-y",
      ...inputArgs,
    ];

    // Add audio input if available
    if (audioPath) {
      args.push("-i", audioPath);
    }

    args.push(
      "-filter_complex", filterComplex,
      ...mapArgs,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "22",
      "-movflags", "+faststart",
    );

    if (audioPath) {
      args.push("-c:a", "aac", "-b:a", "128k", "-shortest");
    }

    args.push(outputPath);

    console.log(`[VideoGenerator] Generating video with ${method} (images: ${imagePaths.length}, audio: ${!!audioPath})...`);

    execFileSync(ffmpegBin, args, {
      timeout: 120000,
      stdio: "pipe",
    });

    return { success: fs.existsSync(outputPath), method };
  } finally {
    // Cleanup temp dir
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generateDailyPodcastVideo(
  input: VideoInput
): Promise<VideoGenerationResult> {
  const tmpOutput = path.join(
    os.tmpdir(),
    `arabismart-daily-${input.date}-${input.language}-${Date.now()}.mp4`
  );

  if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);

  let method: "ffmpeg" | "ffmpeg-static" | "none" = "none";

  try {
    const result = await generateWithFFmpeg(input, tmpOutput);
    if (result.success) {
      method = result.method;
    } else {
      return { success: false, error: "FFmpeg ran but output file not found", method: "none" };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[VideoGenerator] FFmpeg failed:", msg);
    return { success: false, error: `FFmpeg failed: ${msg}`, method: "none" };
  }

  // Upload to S3
  try {
    const videoBuffer = fs.readFileSync(tmpOutput);
    const fileKey = `daily-videos/${input.date}-${input.language}-${Date.now()}.mp4`;
    const { url } = await storagePut(fileKey, videoBuffer, "video/mp4");
    try { fs.unlinkSync(tmpOutput); } catch {}
    console.log(`[VideoGenerator] ✅ Video uploaded: ${url} (method: ${method})`);
    return { success: true, videoUrl: url, videoKey: fileKey, method };
  } catch (uploadErr: unknown) {
    const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
    console.error("[VideoGenerator] Upload failed:", msg);
    try { fs.unlinkSync(tmpOutput); } catch {}
    return { success: false, error: `Video generated but upload failed: ${msg}`, method };
  }
}

// ─── Helper: generate from daily summary in DB ───────────────────────────────
export async function generateVideoFromDailySummary(
  date: Date,
  language: "ar" | "sv" | "en" = "ar"
): Promise<VideoGenerationResult> {
  const summaryRecord = await getDailySummaryByDate(date);

  if (!summaryRecord) {
    return {
      success: false,
      error: `No daily summary found for ${date.toISOString().split("T")[0]}`,
      method: "none",
    };
  }

  // Parse topNews IDs and fetch actual news with images
  let topNewsIds: number[] = [];
  let trendingTopics: string[] = [];

  try {
    if (summaryRecord.topNews) {
      const parsed = JSON.parse(summaryRecord.topNews as string);
      topNewsIds = Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    }
  } catch { /* ignore */ }

  try {
    if (summaryRecord.trendingTopics) {
      const parsed = JSON.parse(summaryRecord.trendingTopics as string);
      trendingTopics = Array.isArray(parsed) ? parsed : [];
    }
  } catch { /* ignore */ }

  // Fetch news details with images from DB
  const topNews: Array<{ title: string; source: string; image?: string; id?: number }> = [];
  if (topNewsIds.length > 0) {
    const { getNewsById } = await import("./db");
    for (const id of topNewsIds) {
      try {
        const newsItem = await getNewsById(id);
        if (newsItem) {
          topNews.push({
            id: newsItem.id,
            title: newsItem.title,
            source: newsItem.source || "",
            image: newsItem.image || undefined,
          });
        }
      } catch { /* ignore */ }
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
