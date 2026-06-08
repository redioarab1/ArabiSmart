/**
 * Image Proxy with WebP Conversion
 * ─────────────────────────────────
 * GET /api/img?url=<encoded-url>&w=<width>&q=<quality>
 *
 * - Fetches remote image, converts to WebP via sharp
 * - Caches result in-memory for 10 minutes (keyed by url+w+q)
 * - Falls back to original image on any error
 * - Adds Cache-Control: public, max-age=86400 (1 day) for CDN
 */

import type { Request, Response } from "express";
import sharp from "sharp";

interface CacheEntry {
  buffer: Buffer;
  contentType: string;
  expiresAt: number;
}

const imgCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_ENTRIES = 500;
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(imgCache.entries())) {
    if (now > entry.expiresAt) imgCache.delete(key);
  }
}, 5 * 60 * 1000);

export async function imageProxyHandler(req: Request, res: Response): Promise<void> {
  const rawUrl = req.query.url as string;
  const width = parseInt((req.query.w as string) || "0", 10) || undefined;
  const quality = Math.min(90, Math.max(20, parseInt((req.query.q as string) || "80", 10)));

  if (!rawUrl) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  // Validate URL — only allow http/https
  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
    if (!["http:", "https:"].includes(targetUrl.protocol)) throw new Error("Invalid protocol");
  } catch {
    res.status(400).json({ error: "Invalid url" });
    return;
  }

  const cacheKey = `${rawUrl}|w=${width ?? ""}|q=${quality}`;

  // Serve from cache if available
  const cached = imgCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    res.setHeader("Content-Type", cached.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
    res.setHeader("X-Cache", "HIT");
    res.send(cached.buffer);
    return;
  }

  try {
    // Fetch the remote image with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const fetchRes = await fetch(targetUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ArabiSmartBot/1.0)",
        "Accept": "image/*,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (!fetchRes.ok) throw new Error(`Upstream ${fetchRes.status}`);

    const contentLength = parseInt(fetchRes.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_IMAGE_SIZE_BYTES) throw new Error("Image too large");

    const arrayBuffer = await fetchRes.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    if (inputBuffer.length > MAX_IMAGE_SIZE_BYTES) throw new Error("Image too large");

    // Convert to WebP
    let sharpInstance = sharp(inputBuffer);
    if (width) {
      sharpInstance = sharpInstance.resize(width, undefined, {
        withoutEnlargement: true,
        fit: "inside",
      });
    }

    const webpBuffer = await sharpInstance
      .webp({ quality, effort: 4 })
      .toBuffer();

    // Store in cache (evict oldest if full)
    if (imgCache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = Array.from(imgCache.keys())[0];
      if (firstKey) imgCache.delete(firstKey);
    }
    imgCache.set(cacheKey, {
      buffer: webpBuffer,
      contentType: "image/webp",
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
    res.setHeader("X-Cache", "MISS");
    res.send(webpBuffer);
  } catch (err) {
    // On any error, redirect to original image (graceful fallback)
    res.redirect(302, rawUrl);
  }
}
