/**
 * ArabiSmart News — Smart Cache Layer
 *
 * Strategy:
 *  - Uses in-memory LRU cache (always available, zero dependencies)
 *  - Automatically upgrades to Redis when REDIS_URL env is set
 *  - TTL-based expiry with automatic invalidation helpers
 *
 * Cache Keys & TTLs:
 *  - news:list:*          → 60s  (main news list, refreshed every minute)
 *  - news:stats           → 120s (stats counter)
 *  - news:sources         → 300s (RSS sources list, rarely changes)
 *  - news:feed            → 120s (RSS/Atom feed XML)
 *  - news:sitemap         → 300s (sitemap XML)
 *  - news:mostviewed      → 180s (most viewed sidebar)
 *  - news:item:*          → 300s (single news article)
 */

import { ENV } from "./_core/env";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// ─── In-Memory LRU Cache ───────────────────────────────────────────────────────

const MAX_ENTRIES = 500;
const memStore = new Map<string, CacheEntry<unknown>>();

function memGet<T>(key: string): T | null {
  const entry = memStore.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return entry.value;
}

function memSet<T>(key: string, value: T, ttlMs: number): void {
  // Evict oldest entries if at capacity
  if (memStore.size >= MAX_ENTRIES) {
    const oldest = Array.from(memStore.keys())[0];
    if (oldest) memStore.delete(oldest);
  }
  memStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function memDel(pattern: string): void {
  // Support wildcard suffix: "news:list:*"
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    for (const key of Array.from(memStore.keys())) {
      if (key.startsWith(prefix)) memStore.delete(key);
    }
  } else {
    memStore.delete(pattern);
  }
}

// ─── Redis Client (optional) ──────────────────────────────────────────────────

let redisClient: {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ex: number) => Promise<void>;
  del: (...keys: string[]) => Promise<void>;
  keys: (pattern: string) => Promise<string[]>;
} | null = null;

async function getRedis() {
  if (redisClient) return redisClient;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    // Dynamic import so the package is optional
    const { createClient } = await import("redis" as any);
    const client = createClient({ url: redisUrl });
    await client.connect();
    redisClient = {
      get: (key: string) => client.get(key),
      set: async (key: string, value: string, ex: number) => {
        await client.set(key, value, { EX: ex });
      },
      del: async (...keys: string[]) => {
        if (keys.length > 0) await client.del(keys);
      },
      keys: (pattern: string) => client.keys(pattern),
    };
    console.log("[Cache] Redis connected:", redisUrl);
    return redisClient;
  } catch (err) {
    console.warn("[Cache] Redis unavailable, using in-memory cache:", (err as Error).message);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get a cached value. Returns null on miss or expiry.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  // Try Redis first
  const redis = await getRedis();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw !== null) return JSON.parse(raw) as T;
      return null;
    } catch {
      // Fall through to memory
    }
  }
  return memGet<T>(key);
}

/**
 * Set a cached value with TTL in seconds.
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), ttlSeconds);
      return;
    } catch {
      // Fall through to memory
    }
  }
  memSet(key, value, ttlSeconds * 1000);
}

/**
 * Delete one key or all keys matching a prefix pattern (e.g. "news:list:*").
 */
export async function cacheDel(pattern: string): Promise<void> {
  // Always clear memory cache
  memDel(pattern);

  const redis = await getRedis();
  if (redis) {
    try {
      if (pattern.endsWith("*")) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) await redis.del(...keys);
      } else {
        await redis.del(pattern);
      }
    } catch {
      // Ignore Redis errors
    }
  }
}

/**
 * Cache-aside helper: returns cached value or calls loader and caches result.
 *
 * @example
 * const stats = await withCache("news:stats", 120, () => getNewsStats());
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await loader();
  // Don't cache null/undefined results
  if (fresh !== null && fresh !== undefined) {
    await cacheSet(key, fresh, ttlSeconds);
  }
  return fresh;
}

// ─── Cache Key Builders ───────────────────────────────────────────────────────

export const CacheKeys = {
  newsList: (params: Record<string, unknown>) =>
    `news:list:${JSON.stringify(params)}`,
  newsItem: (id: number) => `news:item:${id}`,
  newsStats: () => "news:stats",
  newsSources: () => "news:sources",
  newsFeed: (type: "rss" | "atom") => `news:feed:${type}`,
  newsSitemap: (type: string) => `news:sitemap:${type}`,
  newsMostViewed: (limit: number) => `news:mostviewed:${limit}`,
  newsTranslations: (id: number, lang: string) => `news:trans:${id}:${lang}`,
} as const;

// ─── Invalidation Groups ──────────────────────────────────────────────────────

/**
 * Invalidate all caches that depend on the news list (called after add/edit/delete).
 */
export async function invalidateNewsCache(): Promise<void> {
  await Promise.all([
    cacheDel("news:list:*"),
    cacheDel("news:stats"),
    cacheDel("news:feed:*"),
    cacheDel("news:sitemap:*"),
    cacheDel("news:mostviewed:*"),
  ]);
}

/**
 * Invalidate a single news item cache (called after edit/delete).
 */
export async function invalidateNewsItem(id: number): Promise<void> {
  await Promise.all([
    cacheDel(CacheKeys.newsItem(id)),
    invalidateNewsCache(),
  ]);
}

// ─── Cache Stats (for admin dashboard) ───────────────────────────────────────

export function getCacheStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;
  for (const [, entry] of Array.from(memStore.entries())) {
    if (now > (entry as CacheEntry<unknown>).expiresAt) expired++;
    else active++;
  }
  return {
    backend: process.env.REDIS_URL ? "redis" : "memory",
    totalEntries: memStore.size,
    activeEntries: active,
    expiredEntries: expired,
  };
}
