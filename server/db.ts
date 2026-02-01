import { and, desc, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { favorites, InsertUser, news, rssSources, users, fetchLogs, News, RssSource, FetchLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

const eqOp = eq;

/**
 * Get paginated news with optional filters
 */
export async function getNews(params: {
  page?: number;
  limit?: number;
  category?: string;
  source?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const { page = 1, limit = 20, category, source, search } = params;
  const offset = (page - 1) * limit;

  let conditions = [];
  if (category) conditions.push(eqOp(news.category, category as any));
  if (source) conditions.push(eqOp(news.source, source));
  if (search) conditions.push(like(news.title, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select()
    .from(news)
    .where(whereClause)
    .orderBy(desc(news.publishedAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(news)
    .where(whereClause);

  const total = Number(totalResult[0]?.count || 0);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Get single news by ID
 */
export async function getNewsById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(news).where(eqOp(news.id, id)).limit(1);
  return result[0];
}

/**
 * Get all RSS sources
 */
export async function getAllRssSources() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(rssSources).orderBy(rssSources.name);
}

/**
 * Get news statistics
 */
export async function getNewsStats() {
  const db = await getDb();
  if (!db) return { totalNews: 0, activeSources: 0, lastUpdate: null };

  const totalNewsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(news);

  const activeSourcesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(rssSources)
    .where(eqOp(rssSources.isActive, 1));

  const lastUpdateResult = await db
    .select({ lastUpdate: news.createdAt })
    .from(news)
    .orderBy(desc(news.createdAt))
    .limit(1);

  return {
    totalNews: Number(totalNewsResult[0]?.count || 0),
    activeSources: Number(activeSourcesResult[0]?.count || 0),
    lastUpdate: lastUpdateResult[0]?.lastUpdate || null,
  };
}

/**
 * Add news to favorites
 */
export async function addFavorite(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already favorited
  const existing = await db
    .select()
    .from(favorites)
    .where(and(eqOp(favorites.userId, userId), eqOp(favorites.newsId, newsId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(favorites).values({ userId, newsId });
  return { id: Number(result[0].insertId), userId, newsId };
}

/**
 * Remove news from favorites
 */
export async function removeFavorite(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(favorites).where(and(eqOp(favorites.userId, userId), eqOp(favorites.newsId, newsId)));
  return { success: true };
}

/**
 * Get user's favorite news
 */
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: favorites.id,
      newsId: favorites.newsId,
      createdAt: favorites.createdAt,
      news: news,
    })
    .from(favorites)
    .innerJoin(news, eqOp(favorites.newsId, news.id))
    .where(eqOp(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  return result;
}

/**
 * Check if news is favorited by user
 */
export async function isFavorite(userId: number, newsId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(favorites)
    .where(and(eqOp(favorites.userId, userId), eqOp(favorites.newsId, newsId)))
    .limit(1);

  return result.length > 0;
}
