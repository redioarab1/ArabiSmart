import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * News articles table - stores all news items from RSS feeds and manual entries
 */
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  link: varchar("link", { length: 1024 }).notNull().unique(),
  image: varchar("image", { length: 1024 }),
  source: varchar("source", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["SE", "عربية"]).notNull(),
  language: mysqlEnum("language", ["ar", "sv", "en"]).notNull(),
  publishedAt: timestamp("publishedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  isManual: int("isManual").default(0).notNull(), // 0 = auto, 1 = manual
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

/**
 * RSS sources table - stores all RSS feed sources
 */
export const rssSources = mysqlTable("rssSources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull().unique(),
  category: mysqlEnum("category", ["SE", "عربية"]).notNull(),
  language: mysqlEnum("language", ["ar", "sv", "en"]).notNull(),
  isActive: int("isActive").default(1).notNull(), // 0 = inactive, 1 = active
  lastFetchedAt: timestamp("lastFetchedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RssSource = typeof rssSources.$inferSelect;
export type InsertRssSource = typeof rssSources.$inferInsert;

/**
 * Fetch logs table - tracks RSS fetch operations
 */
export const fetchLogs = mysqlTable("fetchLogs", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull(),
  status: mysqlEnum("status", ["success", "error"]).notNull(),
  itemsFetched: int("itemsFetched").default(0).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FetchLog = typeof fetchLogs.$inferSelect;
export type InsertFetchLog = typeof fetchLogs.$inferInsert;

/**
 * Favorites table - stores user's favorite news articles
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  newsId: int("newsId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Comments table - stores user comments on news articles
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  newsId: int("newsId").notNull(),
  content: text("content").notNull(),
  isApproved: int("isApproved").default(1).notNull(), // 0 = pending, 1 = approved
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Ratings table - stores user ratings for news articles
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  newsId: int("newsId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Archived news table - stores user-specific archived news items
 */
export const archivedNews = mysqlTable("archivedNews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  newsId: int("newsId").notNull(),
  archivedAt: timestamp("archivedAt").defaultNow().notNull(),
});

export type ArchivedNews = typeof archivedNews.$inferSelect;
export type InsertArchivedNews = typeof archivedNews.$inferInsert;

/**
 * Folders table - for organizing favorite news into custom folders
 */
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // emoji or icon name
  color: varchar("color", { length: 20 }), // hex color
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

/**
 * Folder items table - links news to folders
 */
export const folderItems = mysqlTable("folderItems", {
  id: int("id").autoincrement().primaryKey(),
  folderId: int("folderId").notNull(),
  newsId: int("newsId").notNull(),
  note: text("note"), // optional note for this news item
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FolderItem = typeof folderItems.$inferSelect;
export type InsertFolderItem = typeof folderItems.$inferInsert;

/**
 * Podcasts table - stores generated audio files for news articles
 */
export const podcasts = mysqlTable("podcasts", {
  id: int("id").autoincrement().primaryKey(),
  newsId: int("newsId").notNull().unique(), // one podcast per news article
  audioUrl: varchar("audioUrl", { length: 1024 }).notNull(),
  duration: int("duration"), // duration in seconds
  language: mysqlEnum("language", ["ar", "sv", "en"]).notNull(),
  status: mysqlEnum("status", ["generating", "ready", "failed"]).default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Podcast = typeof podcasts.$inferSelect;
export type InsertPodcast = typeof podcasts.$inferInsert;

/**
 * Daily summaries table - stores AI-generated daily news summaries
 */
export const dailySummaries = mysqlTable("dailySummaries", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull().unique(), // Date of the summary
  summary: text("summary").notNull(), // AI-generated summary
  topNews: text("topNews"), // JSON array of top news IDs
  trendingTopics: text("trendingTopics"), // JSON array of trending topics
  statistics: text("statistics"), // JSON object with stats (total news, sources, etc.)
  language: mysqlEnum("language", ["ar", "sv", "en"]).default("ar").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailySummary = typeof dailySummaries.$inferSelect;
export type InsertDailySummary = typeof dailySummaries.$inferInsert;
