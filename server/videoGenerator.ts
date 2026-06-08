/**
 * videoGenerator.ts
 * Generates a daily news video using FFmpeg (via ffmpeg-static for production compatibility).
 * Uses ffmpeg-static binary when system ffmpeg is not available (e.g. Cloud Run).
 */

import path from "path";
import fs from "fs";
import os from "os";
import { execSync, execFileSync } from "child_process";
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
  topNews: Array<{ title: string; source: string; image?: string }>;
  trendingTopics: string[];
  audioUrl?: string;
  language: "ar" | "sv" | "en";
};

// ─── Resolve FFmpeg binary ─────────────────────────────────────────────────────
function getFfmpegPath(): { path: string; isStatic: boolean } {
  // 1. Try system ffmpeg first
  try {
    execSync("ffmpeg -version", { stdio: "pipe", timeout: 5000 });
    return { path: "ffmpeg", isStatic: false };
  } catch {
    // System ffmpeg not available
  }

  // 2. Try ffmpeg-static
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

// ─── Sanitize text for FFmpeg drawtext ────────────────────────────────────────
function sanitizeForFFmpeg(text: string, maxLen = 60): string {
  return text
    .replace(/[\\:'"[\]{}()|&;<>!]/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

// ─── Build FFmpeg drawtext filter chain ───────────────────────────────────────
function buildVideoFilter(input: VideoInput): string {
  const accentColor = "0x38bdf8";
  const textColor = "white";
  const dimColor = "0xa0aec0";

  const title = sanitizeForFFmpeg(
    input.language === "ar"
      ? `Daily Summary - ${input.date}`
      : input.language === "sv"
      ? `Daglig sammanfattning - ${input.date}`
      : `Daily Summary - ${input.date}`,
    55
  );

  const news1 = sanitizeForFFmpeg(input.topNews[0]?.title || "", 55);
  const news2 = sanitizeForFFmpeg(input.topNews[1]?.title || "", 55);
  const news3 = sanitizeForFFmpeg(input.topNews[2]?.title || "", 55);
  const topicsStr = sanitizeForFFmpeg(
    input.trendingTopics.slice(0, 4).join("  |  "),
    70
  );
  const summaryShort = sanitizeForFFmpeg(input.summary, 70);

  const filters: string[] = [
    // ── Background gradient overlay (dark blue)
    `drawbox=x=0:y=0:w=iw:h=ih:color=0x0f172a@1.0:t=fill`,

    // ── Top accent bar
    `drawbox=x=0:y=0:w=iw:h=8:color=${accentColor}@1.0:t=fill`,

    // ── Site name (always visible)
    `drawtext=text='ArabiSmart News':fontcolor=${accentColor}:fontsize=48:x=(w-text_w)/2:y=40:enable='between(t,0,26)'`,

    // ── Date line
    `drawtext=text='${title}':fontcolor=${dimColor}:fontsize=28:x=(w-text_w)/2:y=110:enable='between(t,0,26)'`,

    // ── Divider line
    `drawbox=x=60:y=155:w=iw-120:h=2:color=${accentColor}@0.5:t=fill:enable='between(t,0,26)'`,

    // ── Scene 1: Top headlines (t=0..13)
    `drawtext=text='Top Headlines':fontcolor=${accentColor}:fontsize=32:x=60:y=185:enable='between(t,0,13)'`,
    ...(news1 ? [`drawtext=text='1. ${news1}':fontcolor=${textColor}:fontsize=26:x=60:y=240:enable='between(t,1,13)'`] : []),
    ...(news2 ? [`drawtext=text='2. ${news2}':fontcolor=${textColor}:fontsize=26:x=60:y=290:enable='between(t,2,13)'`] : []),
    ...(news3 ? [`drawtext=text='3. ${news3}':fontcolor=${textColor}:fontsize=26:x=60:y=340:enable='between(t,3,13)'`] : []),

    // ── Scene 2: Summary (t=13..22)
    `drawtext=text='Summary':fontcolor=${accentColor}:fontsize=32:x=60:y=185:enable='between(t,13,22)'`,
    `drawtext=text='${summaryShort}':fontcolor=${textColor}:fontsize=24:x=60:y=240:enable='between(t,13,22)'`,

    // ── Scene 3: Trending topics (t=22..26)
    `drawtext=text='Trending Topics':fontcolor=${accentColor}:fontsize=32:x=60:y=185:enable='between(t,22,26)'`,
    `drawtext=text='${topicsStr}':fontcolor=${textColor}:fontsize=26:x=60:y=250:enable='between(t,22,26)'`,

    // ── Bottom bar
    `drawbox=x=0:y=670:w=1280:h=50:color=0x1e293b@1.0:t=fill`,
    `drawtext=text='arabismart.vip':fontcolor=${accentColor}:fontsize=24:x=(w-text_w)/2:y=690:enable='between(t,0,26)'`,
  ];

  return filters.join(",");
}

// ─── Generate video using FFmpeg ──────────────────────────────────────────────
async function generateWithFFmpeg(
  input: VideoInput,
  outputPath: string
): Promise<{ success: boolean; method: "ffmpeg" | "ffmpeg-static" }> {
  const { path: ffmpegBin, isStatic } = getFfmpegPath();
  const method = isStatic ? "ffmpeg-static" : "ffmpeg";

  const duration = 26;
  const fps = 30;
  const bgColor = "0x0f172a";
  const vf = buildVideoFilter(input);

  const args = [
    "-y",
    "-f", "lavfi",
    "-i", `color=c=${bgColor}:size=1280x720:rate=${fps}:duration=${duration}`,
    "-vf", vf,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-movflags", "+faststart",
    outputPath,
  ];

  console.log(`[VideoGenerator] Generating video with ${method}...`);

  execFileSync(ffmpegBin, args, {
    timeout: 90000,
    stdio: "pipe",
  });

  return { success: fs.existsSync(outputPath), method };
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generateDailyPodcastVideo(
  input: VideoInput
): Promise<VideoGenerationResult> {
  const tmpOutput = path.join(
    os.tmpdir(),
    `arabismart-daily-${input.date}-${input.language}-${Date.now()}.mp4`
  );

  // Clean up previous temp file
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

    // Cleanup temp file
    try { fs.unlinkSync(tmpOutput); } catch {}

    console.log(`[VideoGenerator] ✅ Video uploaded: ${url} (method: ${method})`);
    return { success: true, videoUrl: url, videoKey: fileKey, method };
  } catch (uploadErr: unknown) {
    const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
    console.error("[VideoGenerator] Upload failed:", msg);
    // Cleanup
    try { fs.unlinkSync(tmpOutput); } catch {}
    return {
      success: false,
      error: `Video generated but upload failed: ${msg}`,
      method,
    };
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

  let topNews: Array<{ title: string; source: string; image?: string }> = [];
  let trendingTopics: string[] = [];

  try {
    if (summaryRecord.topNews) {
      const parsed = JSON.parse(summaryRecord.topNews as string);
      topNews = Array.isArray(parsed) ? parsed : [];
    }
  } catch { /* ignore parse errors */ }

  try {
    if (summaryRecord.trendingTopics) {
      const parsed = JSON.parse(summaryRecord.trendingTopics as string);
      trendingTopics = Array.isArray(parsed) ? parsed : [];
    }
  } catch { /* ignore parse errors */ }

  return generateDailyPodcastVideo({
    summary: summaryRecord.summary,
    date: date.toISOString().split("T")[0],
    topNews,
    trendingTopics,
    language,
  });
}
