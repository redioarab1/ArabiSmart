import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  news: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          category: z.string().optional(),
          source: z.string().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const { getNews } = await import("./db");
        return await getNews(input || {});
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getNewsById } = await import("./db");
        return await getNewsById(input.id);
      }),

    stats: publicProcedure.query(async () => {
      const { getNewsStats } = await import("./db");
      return await getNewsStats();
    }),
  }),

  rssSources: router({
    list: publicProcedure.query(async () => {
      const { getAllRssSources } = await import("./db");
      return await getAllRssSources();
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          url: z.string().url(),
          category: z.enum(["SE", "عربية"]),
          language: z.enum(["ar", "sv", "en"]),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { createRssSource } = await import("./db");
        return await createRssSource(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          url: z.string().url().optional(),
          category: z.enum(["SE", "عربية"]).optional(),
          language: z.enum(["ar", "sv", "en"]).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateRssSource } = await import("./db");
        return await updateRssSource(input.id, input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteRssSource } = await import("./db");
        return await deleteRssSource(input.id);
      }),

    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        const { updateRssSource } = await import("./db");
        return await updateRssSource(input.id, { isActive: input.isActive });
      }),

    testFeed: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }) => {
        const Parser = (await import("rss-parser")).default;
        const parser = new Parser();
        try {
          const feed = await parser.parseURL(input.url);
          return {
            success: true,
            title: feed.title,
            itemCount: feed.items?.length || 0,
            latestItem: feed.items?.[0]?.title || null,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          };
        }
      }),
  }),

  translate: router({
    text: publicProcedure
      .input(
        z.object({
          text: z.string(),
          targetLang: z.enum(["ar", "sv", "en"]),
          sourceLang: z.enum(["ar", "sv", "en"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { translateText } = await import("./translator");
        const translated = await translateText(input.text, input.targetLang, input.sourceLang);
        return { translated };
      }),
  }),

  comments: router({
    add: protectedProcedure
      .input(z.object({ newsId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const { addComment } = await import("./db");
        return await addComment(ctx.user.id, input.newsId, input.content);
      }),
    list: publicProcedure
      .input(z.object({ newsId: z.number() }))
      .query(async ({ input }) => {
        const { getNewsComments } = await import("./db");
        return await getNewsComments(input.newsId);
      }),
    delete: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteComment } = await import("./db");
        return await deleteComment(input.commentId, ctx.user.id);
      }),
  }),

  ratings: router({
    add: protectedProcedure
      .input(z.object({ newsId: z.number(), rating: z.number().min(1).max(5) }))
      .mutation(async ({ ctx, input }) => {
        const { addRating } = await import("./db");
        return await addRating(ctx.user.id, input.newsId, input.rating);
      }),
    get: publicProcedure
      .input(z.object({ newsId: z.number() }))
      .query(async ({ input }) => {
        const { getNewsRating } = await import("./db");
        return await getNewsRating(input.newsId);
      }),
    getUserRating: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getUserRating } = await import("./db");
        return { rating: await getUserRating(ctx.user.id, input.newsId) };
      }),
  }),

  favorites: router({
    add: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { addFavorite } = await import("./db");
        return await addFavorite(ctx.user.id, input.newsId);
      }),
    remove: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { removeFavorite } = await import("./db");
        return await removeFavorite(ctx.user.id, input.newsId);
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserFavorites } = await import("./db");
      return await getUserFavorites(ctx.user.id);
    }),
    check: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { isFavorite } = await import("./db");
        return { isFavorite: await isFavorite(ctx.user.id, input.newsId) };
      }),
  }),

  admin: router({
    addNews: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          content: z.string().optional(),
          link: z.string(),
          image: z.string().optional(),
          source: z.string(),
          category: z.enum(["SE", "عربية"]),
          language: z.enum(["ar", "sv", "en"]),
          publishedAt: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { news } = await import("../drizzle/schema");
        
        await db.insert(news).values({
          ...input,
          publishedAt: input.publishedAt || new Date(),
          isManual: 1,
        });
        
        return { success: true };
      }),

    updateNews: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          content: z.string().optional(),
          image: z.string().optional(),
          source: z.string().optional(),
          category: z.enum(["SE", "عربية"]).optional(),
          language: z.enum(["ar", "sv", "en"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { news } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const { id, ...updateData } = input;
        await db.update(news).set(updateData).where(eq(news.id, id));
        
        return { success: true };
      }),

    deleteNews: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { news } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        await db.delete(news).where(eq(news.id, input.id));
        
        return { success: true };
      }),
  }),

  // Podcast router
  podcast: router({
    generate: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .mutation(async ({ input }) => {
        const { getNewsById, getPodcastByNewsId, createPodcast, updatePodcastStatus } = await import("./db");
        const { textToSpeech, prepareTextForTTS } = await import("./tts");

        // Check if podcast already exists
        const existing = await getPodcastByNewsId(input.newsId);
        if (existing && existing.status === "ready") {
          return existing;
        }

        // Get news article
        const newsArticle = await getNewsById(input.newsId);
        if (!newsArticle) {
          throw new Error("News article not found");
        }

        // Create podcast record with generating status
        if (!existing) {
          await createPodcast({
            newsId: input.newsId,
            audioUrl: "",
            language: newsArticle.language,
            status: "generating",
          });
        }

        try {
          // Prepare text for TTS
          const text = prepareTextForTTS(
            newsArticle.title,
            newsArticle.description,
            newsArticle.content
          );

          // Generate audio
          const { audioUrl, duration } = await textToSpeech({
            text,
            language: newsArticle.language,
            newsId: input.newsId,
          });

          // Update podcast status to ready
          await updatePodcastStatus(input.newsId, "ready", audioUrl, duration ?? undefined);

          return await getPodcastByNewsId(input.newsId);
        } catch (error) {
          // Update status to failed
          await updatePodcastStatus(input.newsId, "failed");
          throw error;
        }
      }),

    get: publicProcedure
      .input(z.object({ newsId: z.number() }))
      .query(async ({ input }) => {
        const { getPodcastByNewsId } = await import("./db");
        return await getPodcastByNewsId(input.newsId);
      }),

    playlist: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        const { getReadyPodcasts } = await import("./db");
        return await getReadyPodcasts(input.limit || 10);
      }),
  }),

  // Folders router
  folders: router({
    // Create a new folder
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          description: z.string().optional(),
          icon: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createFolder } = await import("./db");
        return await createFolder(ctx.user.id, input);
      }),

    // Get all folders for current user
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserFolders } = await import("./db");
      return await getUserFolders(ctx.user.id);
    }),

    // Get folder by ID
    getById: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getFolderById } = await import("./db");
        return await getFolderById(input.folderId, ctx.user.id);
      }),

    // Update folder
    update: protectedProcedure
      .input(
        z.object({
          folderId: z.number(),
          name: z.string().min(1).max(100).optional(),
          description: z.string().optional(),
          icon: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { folderId, ...updates } = input;
        const { updateFolder } = await import("./db");
        await updateFolder(folderId, ctx.user.id, updates);
        return { success: true };
      }),

    // Delete folder
    delete: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteFolder } = await import("./db");
        await deleteFolder(input.folderId, ctx.user.id);
        return { success: true };
      }),

    // Add news to folder
    addNews: protectedProcedure
      .input(
        z.object({
          folderId: z.number(),
          newsId: z.number(),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { addNewsToFolder } = await import("./db");
        return await addNewsToFolder(input.folderId, input.newsId, input.note);
      }),

    // Remove news from folder
    removeNews: protectedProcedure
      .input(
        z.object({
          folderId: z.number(),
          newsId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const { removeNewsFromFolder } = await import("./db");
        await removeNewsFromFolder(input.folderId, input.newsId);
        return { success: true };
      }),

    // Get all news in a folder
    getNews: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .query(async ({ input }) => {
        const { getFolderNews } = await import("./db");
        return await getFolderNews(input.folderId);
      }),

    // Move news between folders
    moveNews: protectedProcedure
      .input(
        z.object({
          newsId: z.number(),
          fromFolderId: z.number(),
          toFolderId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const { moveNewsBetweenFolders } = await import("./db");
        await moveNewsBetweenFolders(input.newsId, input.fromFolderId, input.toFolderId);
        return { success: true };
      }),

    // Get folder count
    count: protectedProcedure.query(async ({ ctx }) => {
      const { getUserFolderCount } = await import("./db");
      return await getUserFolderCount(ctx.user.id);
    }),

    // Get news count in folder
    newsCount: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .query(async ({ input }) => {
        const { getFolderNewsCount } = await import("./db");
        return await getFolderNewsCount(input.folderId);
      }),
  }),

  // Daily Summary router
  dailySummary: router({
    generate: protectedProcedure
      .input(z.object({
        date: z.string().optional(), // ISO date string
        language: z.enum(["ar", "sv", "en"]).optional(),
      }).optional())
      .mutation(async ({ input }) => {
        const { generateDailySummary } = await import("./dailySummary");
        const { upsertDailySummary } = await import("./db");

        const date = input?.date ? new Date(input.date) : new Date();
        const language = input?.language || "ar";

        // Generate summary
        const summaryData = await generateDailySummary(date, language);

        // Save to database
        const summaryId = await upsertDailySummary({
          date,
          summary: summaryData.summary,
          topNews: JSON.stringify(summaryData.topNews),
          trendingTopics: JSON.stringify(summaryData.trendingTopics),
          statistics: JSON.stringify(summaryData.statistics),
          language,
        });

        return {
          id: summaryId,
          ...summaryData,
        };
      }),

    getToday: publicProcedure
      .input(z.object({
        language: z.enum(["ar", "sv", "en"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getDailySummaryByDate } = await import("./db");
        
        const today = new Date();
        const summary = await getDailySummaryByDate(today);

        if (!summary) {
          return null;
        }

        // Parse JSON fields
        return {
          ...summary,
          topNews: summary.topNews ? JSON.parse(summary.topNews) : [],
          trendingTopics: summary.trendingTopics ? JSON.parse(summary.trendingTopics) : [],
          statistics: summary.statistics ? JSON.parse(summary.statistics) : {},
        };
      }),

    getLatest: publicProcedure
      .query(async () => {
        const { getLatestDailySummary } = await import("./db");
        
        const summary = await getLatestDailySummary();

        if (!summary) {
          return null;
        }

        // Parse JSON fields
        return {
          ...summary,
          topNews: summary.topNews ? JSON.parse(summary.topNews) : [],
          trendingTopics: summary.trendingTopics ? JSON.parse(summary.trendingTopics) : [],
          statistics: summary.statistics ? JSON.parse(summary.statistics) : {},
        };
      }),

    list: publicProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getDailySummaries } = await import("./db");
        
        const summaries = await getDailySummaries(
          input?.limit || 10,
          input?.offset || 0
        );

        // Parse JSON fields for each summary
        return summaries.map(summary => ({
          ...summary,
          topNews: summary.topNews ? JSON.parse(summary.topNews) : [],
          trendingTopics: summary.trendingTopics ? JSON.parse(summary.trendingTopics) : [],
          statistics: summary.statistics ? JSON.parse(summary.statistics) : {},
        }));
      }),
  }),

  // Archive router
  archive: router({
    toggle: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { isNewsArchived, archiveNews, unarchiveNews } = await import("./db");
        
        const isArchived = await isNewsArchived(ctx.user.id, input.newsId);
        
        if (isArchived) {
          await unarchiveNews(ctx.user.id, input.newsId);
          return { archived: false };
        } else {
          await archiveNews(ctx.user.id, input.newsId);
          return { archived: true };
        }
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const { getArchivedNews } = await import("./db");
        return await getArchivedNews(ctx.user.id);
      }),

    check: protectedProcedure
      .input(z.object({ newsId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { isNewsArchived } = await import("./db");
        return await isNewsArchived(ctx.user.id, input.newsId);
      }),
  }),

  // Breaking News - Fetch RSS immediately
  breakingNews: router({
    fetchNow: publicProcedure
      .mutation(async () => {
        const { fetchAllRSS } = await import("./rssFetcher");
        
        try {
          // Trigger RSS fetch immediately
          await fetchAllRSS();
          
          return {
            success: true,
            message: "تم جلب الأخبار بنجاح",
          };
        } catch (error) {
          console.error("[Breaking News] Error fetching RSS:", error);
          return {
            success: false,
            message: "فشل جلب الأخبار",
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
