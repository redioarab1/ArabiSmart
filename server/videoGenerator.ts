/**
 * videoGenerator.ts
 * Generates a daily podcast video using Remotion renderer.
 * Falls back to a simple FFmpeg-based video if Remotion fails (e.g. in production).
 */

import path from "path";
import fs from "fs";
import os from "os";
import { execSync } from "child_process";
import { storagePut } from "./storage";
import { getDailySummaryByDate } from "./db";

export type VideoGenerationResult = {
  success: boolean;
  videoUrl?: string;
  videoKey?: string;
  error?: string;
  method: "remotion" | "ffmpeg" | "none";
};

export type VideoInput = {
  summary: string;
  date: string; // YYYY-MM-DD
  topNews: Array<{ title: string; source: string; image?: string }>;
  trendingTopics: string[];
  audioUrl?: string;
  language: "ar" | "sv" | "en";
};

// ─── Remotion-based generation ────────────────────────────────────────────────
async function generateWithRemotion(
  input: VideoInput,
  outputPath: string
): Promise<boolean> {
  try {
    const { bundle } = await import("@remotion/bundler");
    const { renderMedia, selectComposition } = await import("@remotion/renderer");

    // Bundle the composition
    const compositionPath = path.join(
      __dirname,
      "videoComposition",
      "index.tsx"
    );

    if (!fs.existsSync(compositionPath)) {
      console.error("[VideoGenerator] Composition file not found:", compositionPath);
      return false;
    }

    console.log("[VideoGenerator] Bundling Remotion composition...");
    const bundleLocation = await bundle({
      entryPoint: compositionPath,
      webpackOverride: (config: unknown) => config as ReturnType<typeof config extends (...args: unknown[]) => infer R ? (...args: unknown[]) => R : never>,
    });

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "DailyPodcastVideo",
      inputProps: {
        summary: input.summary,
        date: input.date,
        topNews: input.topNews,
        trendingTopics: input.trendingTopics,
        audioUrl: input.audioUrl,
        language: input.language,
        siteName: "ArabiSmart News",
        siteUrl: "arabismart.vip",
      },
    });

    console.log("[VideoGenerator] Rendering video with Remotion...");
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: {
        summary: input.summary,
        date: input.date,
        topNews: input.topNews,
        trendingTopics: input.trendingTopics,
        audioUrl: input.audioUrl,
        language: input.language,
        siteName: "ArabiSmart News",
        siteUrl: "arabismart.vip",
      },
      chromiumOptions: {
        disableWebSecurity: true,
        headless: true,
      },
      concurrency: 1,
      timeoutInMilliseconds: 120000,
    });

    return fs.existsSync(outputPath);
  } catch (err) {
    console.error("[VideoGenerator] Remotion failed:", err);
    return false;
  }
}

// ─── FFmpeg-based fallback generation ────────────────────────────────────────
async function generateWithFFmpeg(
  input: VideoInput,
  outputPath: string
): Promise<boolean> {
  try {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arabismart-video-"));

    // Create a simple text-based image using FFmpeg drawtext
    const bgColor = "0x0f172a";
    const accentColor = "0x38bdf8";
    const textColor = "white";

    // Sanitize text for FFmpeg (escape special chars)
    const sanitize = (t: string) =>
      t
        .replace(/[\\:'"]/g, " ")
        .replace(/\n/g, " ")
        .slice(0, 80);

    const title = sanitize(
      input.language === "ar"
        ? `الملخص اليومي - ${input.date}`
        : input.language === "sv"
        ? `Daglig sammanfattning - ${input.date}`
        : `Daily Summary - ${input.date}`
    );

    const summaryShort = sanitize(input.summary);
    const topicsStr = sanitize(input.trendingTopics.slice(0, 4).join("  |  "));
    const news1 = sanitize(input.topNews[0]?.title || "");
    const news2 = sanitize(input.topNews[1]?.title || "");
    const news3 = sanitize(input.topNews[2]?.title || "");

    // Duration: 26 seconds
    const duration = 26;
    const fps = 30;

    // Build FFmpeg command with animated text
    const ffmpegCmd = [
      "ffmpeg -y",
      `-f lavfi -i color=c=${bgColor}:size=1280x720:rate=${fps}:duration=${duration}`,
      input.audioUrl ? `-i "${input.audioUrl}"` : "",
      `-vf "`,
      // Site name
      `drawtext=text='ArabiSmart News':fontcolor=${accentColor}:fontsize=52:x=(w-text_w)/2:y=80:enable='between(t,0,26)',`,
      // Title
      `drawtext=text='${title}':fontcolor=${textColor}:fontsize=40:x=(w-text_w)/2:y=180:enable='between(t,0,8)',`,
      // Top news
      `drawtext=text='${news1}':fontcolor=${textColor}:fontsize=28:x=80:y=280:enable='between(t,4,12)',`,
      `drawtext=text='${news2}':fontcolor=${textColor}:fontsize=28:x=80:y=340:enable='between(t,4,12)',`,
      `drawtext=text='${news3}':fontcolor=${textColor}:fontsize=28:x=80:y=400:enable='between(t,4,12)',`,
      // Summary
      `drawtext=text='${summaryShort}':fontcolor=${textColor}:fontsize=24:x=80:y=260:enable='between(t,12,22)':line_spacing=10,`,
      // Trending
      `drawtext=text='${topicsStr}':fontcolor=${accentColor}:fontsize=26:x=(w-text_w)/2:y=500:enable='between(t,12,22)',`,
      // Outro
      `drawtext=text='arabismart.vip':fontcolor=${accentColor}:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,22,26)'`,
      `"`,
      input.audioUrl
        ? `-c:v libx264 -c:a aac -shortest`
        : `-c:v libx264`,
      `-preset fast -crf 23`,
      `"${outputPath}"`,
    ]
      .filter(Boolean)
      .join(" ");

    console.log("[VideoGenerator] Generating video with FFmpeg...");
    execSync(ffmpegCmd, { timeout: 60000, stdio: "pipe" });

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return fs.existsSync(outputPath);
  } catch (err) {
    console.error("[VideoGenerator] FFmpeg failed:", err);
    return false;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generateDailyPodcastVideo(
  input: VideoInput
): Promise<VideoGenerationResult> {
  const tmpOutput = path.join(
    os.tmpdir(),
    `arabismart-daily-${input.date}-${input.language}.mp4`
  );

  // Clean up previous temp file
  if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);

  // Try Remotion first (better quality)
  let success = false;
  let method: "remotion" | "ffmpeg" | "none" = "none";

  // Only try Remotion in non-production or when explicitly enabled
  const useRemotion = process.env.ENABLE_REMOTION === "true";

  if (useRemotion) {
    success = await generateWithRemotion(input, tmpOutput);
    if (success) method = "remotion";
  }

  // Fallback to FFmpeg
  if (!success) {
    success = await generateWithFFmpeg(input, tmpOutput);
    if (success) method = "ffmpeg";
  }

  if (!success) {
    return { success: false, error: "Both Remotion and FFmpeg failed", method: "none" };
  }

  // Upload to S3
  try {
    const videoBuffer = fs.readFileSync(tmpOutput);
    const fileKey = `daily-videos/${input.date}-${input.language}-${Date.now()}.mp4`;
    const { url } = await storagePut(fileKey, videoBuffer, "video/mp4");

    // Cleanup temp file
    fs.unlinkSync(tmpOutput);

    console.log(`[VideoGenerator] ✅ Video uploaded: ${url} (method: ${method})`);
    return { success: true, videoUrl: url, videoKey: fileKey, method };
  } catch (uploadErr) {
    console.error("[VideoGenerator] Upload failed:", uploadErr);
    return {
      success: false,
      error: `Video generated but upload failed: ${uploadErr}`,
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
      error: `No daily summary found for ${date.toISOString().split("T")[0]} (${language})`,
      method: "none",
    };
  }

  let topNews: Array<{ title: string; source: string; image?: string }> = [];
  let trendingTopics: string[] = [];

  try {
    if (summaryRecord.topNews) {
      const parsed = JSON.parse(summaryRecord.topNews);
      topNews = Array.isArray(parsed) ? parsed : [];
    }
  } catch {}

  try {
    if (summaryRecord.trendingTopics) {
      const parsed = JSON.parse(summaryRecord.trendingTopics);
      trendingTopics = Array.isArray(parsed) ? parsed : [];
    }
  } catch {}

  return generateDailyPodcastVideo({
    summary: summaryRecord.summary,
    date: date.toISOString().split("T")[0],
    topNews,
    trendingTopics,
    language,
  });
}
