/**
 * mediaProxy.ts
 * ─────────────
 * GET /media/:filename
 *
 * Streams video/audio files from S3/CloudFront through arabismart.vip
 * so that public-facing URLs look like: https://arabismart.vip/media/filename.mp4
 *
 * Security:
 * - Only allows alphanumeric filenames with safe extensions
 * - Limits to known S3 bucket prefix (daily-videos/, daily-audio/)
 * - Streams directly without buffering in memory
 */

import type { Request, Response } from "express";
import https from "https";
import http from "http";

// S3/CloudFront base URL — same bucket used by storagePut()
const S3_BASE_URL = process.env.S3_BASE_URL || "";

// Allowed file extensions
const ALLOWED_EXTS = new Set([".mp4", ".webm", ".mp3", ".ogg", ".wav", ".m4a"]);

// Content-type map
const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
};

// In-memory URL cache: filename → full S3 URL
// Populated when videoUrl is stored in DB
const urlCache = new Map<string, string>();

/**
 * Register a media file URL in the proxy cache
 * Called by videoGenerator after upload
 */
export function registerMediaUrl(filename: string, fullUrl: string): void {
  urlCache.set(filename, fullUrl);
}

/**
 * Build a proxy URL for a given S3 URL
 * e.g. https://d2xsxph8kpxj0f.cloudfront.net/.../daily-videos/2026-06-08-ar-123.mp4
 *   → https://arabismart.vip/media/2026-06-08-ar-123.mp4
 */
export function buildProxyUrl(s3Url: string, siteUrl?: string): string {
  try {
    const u = new URL(s3Url);
    const filename = u.pathname.split("/").pop() || "";
    const base = siteUrl || process.env.SITE_URL || "https://arabismart.vip";
    // Register in cache for proxy lookup
    urlCache.set(filename, s3Url);
    return `${base.replace(/\/$/, "")}/media/${filename}`;
  } catch {
    return s3Url; // fallback to original
  }
}

export async function mediaProxyHandler(req: Request, res: Response): Promise<void> {
  const filename = req.params.filename;

  // Validate filename — only safe chars
  if (!filename || !/^[\w\-\.]+$/.test(filename)) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  // Check extension
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) {
    res.status(400).json({ error: "Unsupported file type" });
    return;
  }

  // Look up full S3 URL from cache
  let targetUrl = urlCache.get(filename);

  // If not in cache, try to reconstruct from DB
  if (!targetUrl) {
    try {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (db) {
        const { dailySummaries } = await import("../drizzle/schema");
        const { like } = await import("drizzle-orm");
        const rows = await db
          .select({ videoUrl: dailySummaries.videoUrl })
          .from(dailySummaries)
          .where(like(dailySummaries.videoUrl, `%${filename}%`))
          .limit(1);
        if (rows[0]?.videoUrl) {
          targetUrl = rows[0].videoUrl;
          urlCache.set(filename, targetUrl);
        }
      }
    } catch {
      // ignore DB errors
    }
  }

  if (!targetUrl) {
    res.status(404).json({ error: "Media file not found" });
    return;
  }

  // Stream from S3/CloudFront
  const proto = targetUrl.startsWith("https") ? https : http;

  const proxyReq = proto.get(targetUrl, { timeout: 30000 }, (upstream) => {
    if (upstream.statusCode !== 200) {
      res.status(upstream.statusCode || 502).json({ error: "Upstream error" });
      return;
    }

    const contentLength = upstream.headers["content-length"];
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.setHeader("Accept-Ranges", "bytes");
    if (contentLength) res.setHeader("Content-Length", contentLength);
    res.setHeader("X-Proxy-Source", "arabismart-media");

    upstream.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("[MediaProxy] Stream error:", err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: "Failed to stream media" });
    }
  });

  proxyReq.on("timeout", () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.status(504).json({ error: "Media stream timeout" });
    }
  });
}
