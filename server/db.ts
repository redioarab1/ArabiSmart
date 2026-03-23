import { and, desc, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { favorites, InsertUser, news, rssSources, users, fetchLogs, News, RssSource, FetchLog, comments, ratings, archivedNews, podcasts, InsertPodcast, Podcast, folders, folderItems, Folder, InsertFolder, FolderItem, InsertFolderItem, dailySummaries, DailySummary, InsertDailySummary, categories, Category, newsCategories } from "../drizzle/schema";
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
  categoryId?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const { page = 1, limit = 20, category, source, search, categoryId } = params;
  const offset = (page - 1) * limit;

  // If categoryId is provided, use JOIN with newsCategories
  if (categoryId) {
    const items = await db
      .select({
        id: news.id,
        title: news.title,
        description: news.description,
        link: news.link,
        source: news.source,
        category: news.category,
        image: news.image,
        language: news.language,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
      })
      .from(news)
      .innerJoin(newsCategories, eqOp(newsCategories.newsId, news.id))
      .where(eqOp(newsCategories.categoryId, categoryId))
      .orderBy(desc(news.publishedAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(DISTINCT ${news.id})` })
      .from(news)
      .innerJoin(newsCategories, eqOp(newsCategories.newsId, news.id))
      .where(eqOp(newsCategories.categoryId, categoryId));

    const total = Number(totalResult[0]?.count || 0);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Original logic for non-categoryId filters
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

/**
 * Add comment to news
 */
export async function addComment(userId: number, newsId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(comments).values({ userId, newsId, content });
  return { id: Number(result[0].insertId), userId, newsId, content };
}

/**
 * Get comments for news
 */
export async function getNewsComments(newsId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      newsId: comments.newsId,
      content: comments.content,
      isApproved: comments.isApproved,
      createdAt: comments.createdAt,
      user: users,
    })
    .from(comments)
    .innerJoin(users, eqOp(comments.userId, users.id))
    .where(and(eqOp(comments.newsId, newsId), eqOp(comments.isApproved, 1)))
    .orderBy(desc(comments.createdAt));

  return result;
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(comments).where(and(eqOp(comments.id, commentId), eqOp(comments.userId, userId)));
  return { success: true };
}

/**
 * Add or update rating
 */
export async function addRating(userId: number, newsId: number, rating: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if rating exists
  const existing = await db
    .select()
    .from(ratings)
    .where(and(eqOp(ratings.userId, userId), eqOp(ratings.newsId, newsId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing rating
    await db
      .update(ratings)
      .set({ rating, updatedAt: new Date() })
      .where(and(eqOp(ratings.userId, userId), eqOp(ratings.newsId, newsId)));
    return { id: existing[0].id, userId, newsId, rating };
  }

  // Insert new rating
  const result = await db.insert(ratings).values({ userId, newsId, rating });
  return { id: Number(result[0].insertId), userId, newsId, rating };
}

/**
 * Get average rating for news
 */
export async function getNewsRating(newsId: number) {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };

  const result = await db
    .select({
      average: sql<number>`AVG(${ratings.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(eqOp(ratings.newsId, newsId));

  return {
    average: Number(result[0]?.average || 0),
    count: Number(result[0]?.count || 0),
  };
}

/**
 * Get user's rating for news
 */
export async function getUserRating(userId: number, newsId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(ratings)
    .where(and(eqOp(ratings.userId, userId), eqOp(ratings.newsId, newsId)))
    .limit(1);

  return result.length > 0 ? result[0].rating : null;
}


/**
 * Archive a news item for a user
 */
export async function archiveNews(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already archived
  const existing = await db
    .select()
    .from(archivedNews)
    .where(and(eqOp(archivedNews.userId, userId), eqOp(archivedNews.newsId, newsId)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(archivedNews).values({ userId, newsId });
  return { id: Number(result[0].insertId), userId, newsId };
}

/**
 * Unarchive a news item for a user
 */
export async function unarchiveNews(userId: number, newsId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(archivedNews)
    .where(and(eqOp(archivedNews.userId, userId), eqOp(archivedNews.newsId, newsId)));
}

/**
 * Get all archived news for a user
 */
export async function getArchivedNews(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: archivedNews.id,
      newsId: archivedNews.newsId,
      archivedAt: archivedNews.archivedAt,
      news: news,
    })
    .from(archivedNews)
    .leftJoin(news, eqOp(archivedNews.newsId, news.id))
    .where(eqOp(archivedNews.userId, userId))
    .orderBy(desc(archivedNews.archivedAt));

  return result;
}

/**
 * Check if a news item is archived by a user
 */
export async function isNewsArchived(userId: number, newsId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(archivedNews)
    .where(and(eqOp(archivedNews.userId, userId), eqOp(archivedNews.newsId, newsId)))
    .limit(1);

  return result.length > 0;
}

/**
 * Create or get podcast for news article
 */
export async function createPodcast(data: InsertPodcast) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(podcasts).values(data);
  return { id: Number(result[0].insertId), ...data };
}

/**
 * Get podcast by news ID
 */
export async function getPodcastByNewsId(newsId: number): Promise<Podcast | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(podcasts)
    .where(eqOp(podcasts.newsId, newsId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Update podcast status
 */
export async function updatePodcastStatus(
  newsId: number,
  status: "generating" | "ready" | "failed",
  audioUrl?: string,
  duration?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (audioUrl) updateData.audioUrl = audioUrl;
  if (duration !== undefined) updateData.duration = duration;

  await db.update(podcasts).set(updateData).where(eqOp(podcasts.newsId, newsId));
}

/**
 * Get all ready podcasts (for playlist)
 */
export async function getReadyPodcasts(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      podcast: podcasts,
      news: news,
    })
    .from(podcasts)
    .innerJoin(news, eqOp(podcasts.newsId, news.id))
    .where(eqOp(podcasts.status, "ready"))
    .orderBy(desc(podcasts.createdAt))
    .limit(limit);

  return result;
}


// ==================== Folders Management ====================

/**
 * Create a new folder for a user
 */
export async function createFolder(userId: number, folderData: Omit<InsertFolder, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(folders).values({
    userId,
    ...folderData,
  });

  return result;
}

/**
 * Get all folders for a user
 */
export async function getUserFolders(userId: number): Promise<Folder[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(desc(folders.createdAt));

  return result;
}

/**
 * Get folder by ID
 */
export async function getFolderById(folderId: number, userId: number): Promise<Folder | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Update folder
 */
export async function updateFolder(
  folderId: number,
  userId: number,
  updates: Partial<Omit<InsertFolder, "userId">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(folders)
    .set(updates)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)));
}

/**
 * Delete folder and all its items
 */
export async function deleteFolder(folderId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First delete all folder items
  await db.delete(folderItems).where(eq(folderItems.folderId, folderId));

  // Then delete the folder
  await db
    .delete(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)));
}

/**
 * Add news to folder
 */
export async function addNewsToFolder(folderId: number, newsId: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already exists
  const existing = await db
    .select()
    .from(folderItems)
    .where(and(eq(folderItems.folderId, folderId), eq(folderItems.newsId, newsId)))
    .limit(1);

  if (existing.length > 0) {
    // Update note if provided
    if (note !== undefined) {
      await db
        .update(folderItems)
        .set({ note })
        .where(eq(folderItems.id, existing[0].id));
    }
    return existing[0];
  }

  // Insert new
  const result = await db.insert(folderItems).values({
    folderId,
    newsId,
    note: note || null,
  });

  return result;
}

/**
 * Remove news from folder
 */
export async function removeNewsFromFolder(folderId: number, newsId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(folderItems)
    .where(and(eq(folderItems.folderId, folderId), eq(folderItems.newsId, newsId)));
}

/**
 * Get all news in a folder
 */
export async function getFolderNews(folderId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      folderItem: folderItems,
      news: news,
    })
    .from(folderItems)
    .innerJoin(news, eq(folderItems.newsId, news.id))
    .where(eq(folderItems.folderId, folderId))
    .orderBy(desc(folderItems.createdAt));

  return result;
}

/**
 * Move news between folders
 */
export async function moveNewsBetweenFolders(
  newsId: number,
  fromFolderId: number,
  toFolderId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the note from the old folder
  const oldItem = await db
    .select()
    .from(folderItems)
    .where(and(eq(folderItems.folderId, fromFolderId), eq(folderItems.newsId, newsId)))
    .limit(1);

  const note = oldItem.length > 0 ? oldItem[0].note : null;

  // Remove from old folder
  await removeNewsFromFolder(fromFolderId, newsId);

  // Add to new folder
  await addNewsToFolder(toFolderId, newsId, note || undefined);
}

/**
 * Get folder count for a user
 */
export async function getUserFolderCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(folders)
    .where(eq(folders.userId, userId));

  return result[0]?.count || 0;
}

/**
 * Get news count in a folder
 */
export async function getFolderNewsCount(folderId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(folderItems)
    .where(eq(folderItems.folderId, folderId));

  return result[0]?.count || 0;
}


// ==================== Daily Summaries ====================

/**
 * Create or update daily summary
 */
export async function upsertDailySummary(summaryData: InsertDailySummary) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if summary exists for this date
  const existing = await db
    .select()
    .from(dailySummaries)
    .where(eq(dailySummaries.date, summaryData.date))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(dailySummaries)
      .set(summaryData)
      .where(eq(dailySummaries.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new
    const result = await db.insert(dailySummaries).values(summaryData);
    return result[0].insertId;
  }
}

/**
 * Get daily summary by date
 */
export async function getDailySummaryByDate(date: Date): Promise<DailySummary | null> {
  const db = await getDb();
  if (!db) return null;
  // Use UTC dates to avoid timezone issues
  const d = new Date(date);
  const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

  const result = await db
    .select()
    .from(dailySummaries)
    .where(
      and(
        sql`${dailySummaries.date} >= ${startOfDay}`,
        sql`${dailySummaries.date} <= ${endOfDay}`
      )
    )
    .orderBy(desc(dailySummaries.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get latest daily summary
 */
export async function getLatestDailySummary(): Promise<DailySummary | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(dailySummaries)
    .orderBy(desc(dailySummaries.date))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get all daily summaries (paginated)
 */
export async function getDailySummaries(limit: number = 10, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(dailySummaries)
    .orderBy(desc(dailySummaries.date))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Delete old summaries (older than specified days)
 */
export async function deleteOldSummaries(daysToKeep: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  await db.delete(dailySummaries).where(sql`${dailySummaries.date} < ${cutoffDate}`);
}


/**
 * Create a new RSS source
 */
export async function createRssSource(data: {
  name: string;
  url: string;
  category: string;
  language: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(rssSources).values({
    name: data.name,
    url: data.url,
    category: data.category as any,
    language: data.language as any,
    isActive: (data.isActive ?? true) ? 1 : 0,
  });

  return { success: true, ...data };
}

/**
 * Update an existing RSS source
 */
export async function updateRssSource(
  id: number,
  data: Partial<{
    name: string;
    url: string;
    category: string;
    language: string;
    isActive: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.isActive !== undefined) updateData.isActive = data.isActive ? 1 : 0;

  await db.update(rssSources).set(updateData).where(eq(rssSources.id, id));

  return { id, ...data };
}

/**
 * Delete an RSS source
 */
export async function deleteRssSource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(rssSources).where(eq(rssSources.id, id));

  return { success: true };
}


/**
 * Get all news for sitemap generation
 */
export async function getAllNewsForSitemap() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: news.id,
      title: news.title,
      publishedAt: news.publishedAt,
    })
    .from(news)
    .orderBy(desc(news.publishedAt))
    .limit(5000); // Limit to 5000 for performance
}

/**
 * Get all active categories ordered by display order
 */
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, 1))
    .orderBy(categories.order);

  return result;
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: number): Promise<Category | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get categories for a specific news article
 */
export async function getNewsCategoriesByNewsId(newsId: number): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      nameAr: categories.nameAr,
      icon: categories.icon,
      color: categories.color,
      order: categories.order,
      isActive: categories.isActive,
      createdAt: categories.createdAt,
    })
    .from(newsCategories)
    .innerJoin(categories, eq(newsCategories.categoryId, categories.id))
    .where(eq(newsCategories.newsId, newsId));

  return result;
}
