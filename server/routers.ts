import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { notebookRouter } from "./routers/notebook";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  notebook: notebookRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      const user = opts.ctx.user;
      if (!user) return null;
      // إرجاع بيانات المستخدم مع استبعاد الحقول الحساسة صراحةً
      const { passwordHash: _ph, resetToken: _rt, resetTokenExpires: _rte, openId: _oi, ...safeUser } = user as any;
      return {
        ...safeUser,
        isLocalAuth: user.isLocalAuth === 1 ? 1 : 0,
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // ─── Local Auth procedures ────────────────────────────────────────────────────────────
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_؀-ۿ]+$/, "اسم المستخدم يجب أن يحتوي على حروف وأرقام فقط"),
        email: z.string().email("بريد إلكتروني غير صالح"),
        password: z.string().min(8, "كلمة السر يجب أن تكون 8 أحرف على الأقل"),
        name: z.string().min(1).max(64).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { registerLocalUser } = await import("./localAuth");
        const { sdk } = await import("./_core/sdk");
        const { getSessionCookieOptions } = await import("./_core/cookies");
        const { COOKIE_NAME } = await import("@shared/const");
        const result = await registerLocalUser(input);
        if (!result.success) {
          const { TRPCError } = await import("@trpc/server");
          throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
        }
        // Auto-login after registration
        const { loginLocalUser } = await import("./localAuth");
        const loginResult = await loginLocalUser({ identifier: input.username, password: input.password });
        if (loginResult.user) {
          const token = await sdk.createSessionToken(loginResult.user.openId, { name: loginResult.user.name || input.username });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        }
        return { success: true };
      }),

    localLogin: publicProcedure
      .input(z.object({
        identifier: z.string().min(1, "اسم المستخدم أو البريد مطلوب"),
        password: z.string().min(1, "كلمة السر مطلوبة"),
      }))
      .mutation(async ({ input, ctx }) => {
        const { loginLocalUser } = await import("./localAuth");
        const { sdk } = await import("./_core/sdk");
        const { getSessionCookieOptions } = await import("./_core/cookies");
        const { COOKIE_NAME, SESSION_DURATION_MS } = await import("@shared/const");
        const { TRPCError } = await import("@trpc/server");
        const result = await loginLocalUser(input);
        if (!result.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: result.error || "بيانات الدخول غير صحيحة" });
        }
        // منع مستخدمي OAuth من الدخول إلى لوحة التحكم - يجب أن يكون isLocalAuth=1
        if (!result.user.isLocalAuth) {
          throw new TRPCError({ code: "FORBIDDEN", message: "هذا الحساب مسجّل عبر خدمة خارجية. لوحة التحكم تتطلب حساباً محلياً فقط." });
        }
        // التحقق من صلاحية admin
        if (result.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "ليس لديك صلاحية الوصول إلى لوحة التحكم." });
        }
        // مدة جلسة آمنة: 30 يوماً
        const token = await sdk.createSessionToken(result.user.openId, { name: result.user.name || result.user.username || "", expiresInMs: SESSION_DURATION_MS });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_DURATION_MS });
        // تسجيل عملية تسجيل الدخول في سجل النشاط
        if (result.user.role === "admin") {
          const { logActivity } = await import("./activityLogger");
          await logActivity({
            userId: result.user.id,
            userName: result.user.name ?? result.user.username ?? null,
            action: "admin_login",
            entity: "user",
            entityId: result.user.id,
            details: JSON.stringify({ username: result.user.username, role: result.user.role }),
            ip: ctx.req?.ip ?? null,
          });
        }
        return { success: true, user: { id: result.user.id, name: result.user.name, username: result.user.username, email: result.user.email, role: result.user.role } };
      }),

    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email("بريد إلكتروني غير صالح") }))
      .mutation(async ({ input }) => {
        const { forgotPassword } = await import("./localAuth");
        return await forgotPassword(input.email);
      }),

    validateResetToken: publicProcedure
      .input(z.object({ token: z.string().min(1) }))
      .query(async ({ input }) => {
        const { getUserByResetToken } = await import("./localAuth");
        const user = await getUserByResetToken(input.token);
        if (!user || !user.resetTokenExpires) return { valid: false };
        if (new Date() > user.resetTokenExpires) return { valid: false };
        return { valid: true, name: user.name };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8, "كلمة السر يجب أن تكون 8 أحرف على الأقل"),
      }))
      .mutation(async ({ input }) => {
        const { resetPassword } = await import("./localAuth");
        const { TRPCError } = await import("@trpc/server");
        const result = await resetPassword(input);
        if (!result.success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
        }
        return { success: true };
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
          categoryId: z.number().optional(),
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
      .mutation(async ({ ctx, input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { news } = await import("../drizzle/schema");
        
        const result = await db.insert(news).values({
          ...input,
          publishedAt: input.publishedAt || new Date(),
          isManual: 1,
        });
        
        const { logActivity } = await import("./activityLogger");
        await logActivity({
          userId: ctx.user?.id ?? null,
          userName: ctx.user?.name ?? ctx.user?.username ?? null,
          action: "create_news",
          entity: "news",
          entityId: (result as any).insertId ?? null,
          details: JSON.stringify({ title: input.title, source: input.source, category: input.category }),
          ip: ctx.req?.ip ?? null,
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
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "يتطلب صلاحية مسؤول" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { news } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const { id, ...updateData } = input;
        await db.update(news).set(updateData).where(eq(news.id, id));
        
        // Invalidate cache
        const { invalidateNewsItem } = await import("./cache");
        await invalidateNewsItem(id);
        
        const { logActivity } = await import("./activityLogger");
        await logActivity({
          userId: ctx.user?.id ?? null,
          userName: ctx.user?.name ?? ctx.user?.username ?? null,
          action: "update_news",
          entity: "news",
          entityId: id,
          details: JSON.stringify(updateData),
          ip: ctx.req?.ip ?? null,
        });
        
        return { success: true };
      }),

    deleteNews: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "يتطلب صلاحية مسؤول" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { news } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // جلب عنوان الخبر قبل الحذف
        const [deletedItem] = await db.select({ title: news.title, source: news.source }).from(news).where(eq(news.id, input.id)).limit(1);
        await db.delete(news).where(eq(news.id, input.id));
        
        // Invalidate cache
        const { invalidateNewsItem } = await import("./cache");
        await invalidateNewsItem(input.id);
        
        const { logActivity } = await import("./activityLogger");
        await logActivity({
          userId: ctx.user?.id ?? null,
          userName: ctx.user?.name ?? ctx.user?.username ?? null,
          action: "delete_news",
          entity: "news",
          entityId: input.id,
          details: deletedItem ? JSON.stringify({ title: deletedItem.title, source: deletedItem.source }) : null,
          ip: ctx.req?.ip ?? null,
        });
        
        return { success: true };
      }),

    addManualNews: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string(),
          link: z.string(),
          source: z.string(),
          category: z.enum(["SE", "عربية"]),
          language: z.enum(["ar", "sv", "en"]),
          image: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "يتطلب صلاحية مسؤول" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { news } = await import("../drizzle/schema");
        
        const result = await db.insert(news).values({
          ...input,
          publishedAt: new Date(),
          isManual: 1,
        });
        
        // Invalidate news list cache so new article appears immediately
        const { invalidateNewsCache } = await import("./cache");
        await invalidateNewsCache();
        
        const { logActivity } = await import("./activityLogger");
        await logActivity({
          userId: ctx.user?.id ?? null,
          userName: ctx.user?.name ?? ctx.user?.username ?? null,
          action: "create_news_manual",
          entity: "news",
          entityId: (result as any).insertId ?? null,
          details: JSON.stringify({ title: input.title, source: input.source, category: input.category }),
          ip: ctx.req?.ip ?? null,
        });
        
        return { success: true };
      }),

    listSources: protectedProcedure.query(async () => {
      const db = await import("./db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");
      const { rssSources } = await import("../drizzle/schema");
      
      return await db.select().from(rssSources);
    }),

    newsGrowth: protectedProcedure.query(async () => {
      const db = await import("./db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");
      const { news } = await import("../drizzle/schema");
      const { sql, gte } = await import("drizzle-orm");
      
      // Get news from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const results = await db
        .select({
          date: sql<string>`DATE(${news.createdAt})`,
          count: sql<number>`COUNT(*)`
        })
        .from(news)
        .where(gte(news.createdAt, sevenDaysAgo))
        .groupBy(sql`DATE(${news.createdAt})`)
        .orderBy(sql`DATE(${news.createdAt})`);
      
      return results;
    }),

    fetchNews: protectedProcedure.mutation(async ({ ctx }) => {
      const { fetchAllRSS } = await import("./rssFetcher");
      await fetchAllRSS();
      const { logActivity } = await import("./activityLogger");
      await logActivity({
        userId: ctx.user?.id ?? null,
        userName: ctx.user?.name ?? ctx.user?.username ?? null,
        action: "fetch_rss_manual",
        entity: "rssSource",
        details: "جلب يدوي للأخبار من جميع المصادر",
        ip: ctx.req?.ip ?? null,
      });
      return { success: true, newItemsCount: 0 };
    }),
    addSource: protectedProcedure
      .input(z.object({
        name: z.string(),
        url: z.string(),
        category: z.enum(["SE", "عربية"]),
        language: z.enum(["ar", "sv", "en"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { rssSources } = await import("../drizzle/schema");
        const result = await db.insert(rssSources).values({ ...input, isActive: 1 });
        const { logActivity } = await import("./activityLogger");
        await logActivity({
          userId: ctx.user?.id ?? null,
          userName: ctx.user?.name ?? ctx.user?.username ?? null,
          action: "create_rss_source",
          entity: "rssSource",
          entityId: (result as any).insertId ?? null,
          details: JSON.stringify({ name: input.name, url: input.url, category: input.category }),
          ip: ctx.req?.ip ?? null,
        });
        return { success: true };
      }),
    updateSource: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        url: z.string().optional(),
        category: z.enum(["SE", "عربية"]).optional(),
        language: z.enum(["ar", "sv", "en"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { rssSources } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, ...updateData } = input;
        await db.update(rssSources).set(updateData).where(eq(rssSources.id, id));
        return { success: true };
      }),
    deleteSource: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { rssSources } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        // جلب اسم المصدر قبل الحذف
        const [src] = await db.select({ name: rssSources.name, url: rssSources.url }).from(rssSources).where(eq(rssSources.id, input.id)).limit(1);
        await db.delete(rssSources).where(eq(rssSources.id, input.id));
        const { logActivity } = await import("./activityLogger");
        await logActivity({
          userId: ctx.user?.id ?? null,
          userName: ctx.user?.name ?? ctx.user?.username ?? null,
          action: "delete_rss_source",
          entity: "rssSource",
          entityId: input.id,
          details: src ? JSON.stringify({ name: src.name, url: src.url }) : null,
          ip: ctx.req?.ip ?? null,
        });
        return { success: true };
      }),
    toggleSource: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { rssSources } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(rssSources).set({ isActive: input.isActive ? 1 : 0 }).where(eq(rssSources.id, input.id));
        return { success: true };
      }),
    deleteVideo: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { videos } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(videos).where(eq(videos.id, input.id));
        return { success: true };
      }),
    getStats: protectedProcedure.query(async () => {
      const db = await import("./db").then((m) => m.getDb());
      if (!db) return { totalNews: 0, totalVideos: 0, totalUsers: 0, activeSources: 0 };
      const { news, videos, users, rssSources } = await import("../drizzle/schema");
      const { sql, eq } = await import("drizzle-orm");
      const [newsCount] = await db.select({ count: sql<number>`count(*)` }).from(news);
      const [videosCount] = await db.select({ count: sql<number>`count(*)` }).from(videos);
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [sourcesCount] = await db.select({ count: sql<number>`count(*)` }).from(rssSources).where(eq(rssSources.isActive, 1));
      return {
        totalNews: Number(newsCount?.count || 0),
        totalVideos: Number(videosCount?.count || 0),
        totalUsers: Number(usersCount?.count || 0),
        activeSources: Number(sourcesCount?.count || 0),
      };
    }),
    listUsers: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) return [];
        const { users } = await import("../drizzle/schema");
        const { like, or } = await import("drizzle-orm");
        if (input?.search) {
          return await db.select().from(users).where(
            or(like(users.name, `%${input.search}%`), like(users.openId, `%${input.search}%`))
          );
        }
        return await db.select().from(users);
      }),
    promoteUser: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "user"]) }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
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
    getByDate: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }) => {
        const { getDailySummaryByDate } = await import("./db");
        const date = new Date(input.date);
        const summary = await getDailySummaryByDate(date);
        if (!summary) return null;
        return {
          ...summary,
          topNews: summary.topNews ? JSON.parse(summary.topNews) : [],
          trendingTopics: summary.trendingTopics ? JSON.parse(summary.trendingTopics) : [],
          statistics: summary.statistics ? JSON.parse(summary.statistics) : {},
        };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { dailySummaries } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(dailySummaries).where(eq(dailySummaries.id, input.id));
        return { success: true };
      }),
    // Get top news details (titles) for a summary
    getTopNewsDetails: publicProcedure
      .input(z.object({ newsIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        if (!input.newsIds || input.newsIds.length === 0) return [];
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return [];
        const { news } = await import("../drizzle/schema");
        const { inArray } = await import("drizzle-orm");
        const ids = input.newsIds.slice(0, 5);
        const items = await db
          .select({ id: news.id, title: news.title, source: news.source, category: news.category, publishedAt: news.publishedAt })
          .from(news)
          .where(inArray(news.id, ids));
        return items;
      }),
    // Generate PDF content (returns structured data for client-side PDF generation)
    getPdfData: publicProcedure
      .input(z.object({ id: z.number().optional() }))
      .query(async ({ input }) => {
        const { getLatestDailySummary } = await import("./db");
        const summary = await getLatestDailySummary();
        if (!summary) return null;
        return {
          ...summary,
          topNews: summary.topNews ? JSON.parse(summary.topNews) : [],
          trendingTopics: summary.trendingTopics ? JSON.parse(summary.trendingTopics) : [],
          statistics: summary.statistics ? JSON.parse(summary.statistics) : {},
        };
      }),

    // Translate daily summary to another language using LLM
    translate: publicProcedure
      .input(z.object({
        summaryId: z.number(),
        targetLanguage: z.enum(["en", "sv"]),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { dailySummaries } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(dailySummaries).where(eq(dailySummaries.id, input.summaryId)).limit(1);
        if (!row) throw new Error("Summary not found");

        const { invokeLLM } = await import("./_core/llm");
        const langName = input.targetLanguage === "en" ? "English" : "Swedish";
        const result = await invokeLLM({
          model: "llama-3.3-70b-versatile", // جودة عالية للترجمة
          messages: [
            {
              role: "system",
              content: `You are a professional news translator. Translate the following Arabic daily news summary to ${langName}. Keep the same structure and tone. Return only the translated text without any additional commentary.`,
            },
            {
              role: "user",
              content: row.summary || "",
            },
          ],
        });
        const translatedText = result.choices?.[0]?.message?.content || "";
        return { translatedText, language: input.targetLanguage };
      }),

    // Generate podcast script (text-optimized for TTS) from daily summary
    generatePodcastScript: publicProcedure
      .input(z.object({ summaryId: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { dailySummaries } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db.select().from(dailySummaries).where(eq(dailySummaries.id, input.summaryId)).limit(1);
        if (!row) throw new Error("Summary not found");

        const { invokeLLM } = await import("./_core/llm");
        const dateStr = new Date(row.date).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const result = await invokeLLM({
          model: "llama-3.3-70b-versatile", // جودة عالية لسكريبت البودكاست
          messages: [
            {
              role: "system",
              content: `أنت مذيع أخبار محترف. حوّل ملخص الأخبار التالي إلى نص بودكاست صوتي بأسلوب إذاعي احترافي باللغة العربية. ابدأ بتحية المستمعين وذكر التاريخ، ثم قدم الأخبار بأسلوب سلس ومناسب للاستماع. لا تستخدم رموزاً أو تنسيقاً خاصاً، فقط نص عادي مناسب للقراءة الصوتية. الحد الأقصى 500 كلمة.`,
            },
            {
              role: "user",
              content: `التاريخ: ${dateStr}\n\n${row.summary || ""}`,
            },
          ],
        });
        const rawContent = result.choices?.[0]?.message?.content;
        const script = typeof rawContent === "string" ? rawContent : "";
        return { script, date: row.date };
      }),

    // Generate daily video (admin only) using FFmpeg
    generateVideo: protectedProcedure
      .input(z.object({
        summaryId: z.number(),
        language: z.enum(["ar", "sv", "en"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { generateVideoFromDailySummary } = await import("./videoGenerator");
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { dailySummaries } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [summary] = await db.select().from(dailySummaries).where(eq(dailySummaries.id, input.summaryId)).limit(1);
        if (!summary) throw new Error("Summary not found");
        const lang = (input.language || summary.language || "ar") as "ar" | "sv" | "en";
        const result = await generateVideoFromDailySummary(new Date(summary.date), lang);
        if (result.success && result.videoUrl && result.videoKey) {
          await db.update(dailySummaries)
            .set({ videoUrl: result.videoUrl, videoKey: result.videoKey, videoGeneratedAt: new Date() })
            .where(eq(dailySummaries.id, input.summaryId));
        }
        return result;
      }),

    // Get video status for a summary
    getVideoStatus: publicProcedure
      .input(z.object({ summaryId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return null;
        const { dailySummaries } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [row] = await db
          .select({ videoUrl: dailySummaries.videoUrl, videoGeneratedAt: dailySummaries.videoGeneratedAt })
          .from(dailySummaries)
          .where(eq(dailySummaries.id, input.summaryId))
          .limit(1);
        return row || null;
      }),
  }),
  // Archive routerr
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

  // Categories router
  categories: router({
    list: publicProcedure.query(async () => {
      const { getAllCategories } = await import("./db");
      return await getAllCategories();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getCategoryById } = await import("./db");
        return await getCategoryById(input.id);
      }),
  }),

  // Videos router
  videos: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          channelName: z.string().nullable().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) return { videos: [], total: 0 };
        const { videos } = await import("../drizzle/schema");
        const { desc, like, and, isNotNull } = await import("drizzle-orm");
        
        const page = input?.page || 1;
        const limit = input?.limit || 20;
        const offset = (page - 1) * limit;
        
        const conditions = [];
        if (input?.channelName) {
          conditions.push(like(videos.channelName, `%${input.channelName}%`));
        }
        
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        
        const items = await db.select().from(videos)
            .where(where)
            .orderBy(desc(videos.publishedAt))
            .limit(limit)
            .offset(offset);
        
        return { videos: items, total: items.length };
      }),

    channels: publicProcedure.query(async () => {
      const db = await import("./db").then((m) => m.getDb());
      if (!db) return [];
      const { youtubeChannels } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      return await db.select().from(youtubeChannels).where(eq(youtubeChannels.isActive, 1));
    }),

    fetchYouTube: protectedProcedure.mutation(async () => {
      const { fetchYouTubeVideos } = await import("./youtubeFetcher");
      const count = await fetchYouTubeVideos();
      return { success: true, count };
    }),

    getLiveVideoId: publicProcedure
      .input(z.object({ channelId: z.string() }))
      .query(async ({ input }) => {
        try {
          const res = await fetch(
            `https://www.youtube.com/feeds/videos.xml?channel_id=${input.channelId}`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (!res.ok) return { videoId: null };
          const xml = await res.text();
          const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
          const videoId = match ? match[1].trim() : null;
          return { videoId };
        } catch {
          return { videoId: null };
        }
      }),

    addManual: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          videoId: z.string(),
          channelName: z.string().optional(),
          thumbnail: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { videos } = await import("../drizzle/schema");
        
        await db.insert(videos).values({
          ...input,
          language: "ar",
          publishedAt: new Date(),
          isManual: 1,
        });
        
        return { success: true };
      }),
  }),

  // News Translation router - translate news to EN/SV and cache in DB
  newsTranslation: router({
    // Translate a specific news article to EN or SV - available to all visitors
    translate: publicProcedure
      .input(z.object({
        newsId: z.number(),
        language: z.enum(["en", "sv", "ar"]),
      }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { news, newsTranslations } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");

        // Check if translation already exists
        const existing = await db
          .select()
          .from(newsTranslations)
          .where(and(eq(newsTranslations.newsId, input.newsId), eq(newsTranslations.language, input.language)))
          .limit(1);

        if (existing.length > 0) {
          return existing[0];
        }

        // Get the news article
        const [article] = await db.select().from(news).where(eq(news.id, input.newsId)).limit(1);
        if (!article) throw new Error("News article not found");

        // Translate using LLM for better quality
        const { invokeLLM } = await import("./_core/llm");
        const langName = input.language === "en" ? "English" : input.language === "sv" ? "Swedish" : "Arabic";
        const textToTranslate = `Title: ${article.title}\n\nDescription: ${article.description || ""}`;

        const llmResponse = await invokeLLM({
          model: "llama-3.1-8b-instant", // سريع وكافي لترجمة الأخبار
          messages: [
            {
              role: "system",
              content: `You are a professional news translator. Translate the following news article to ${langName}. Keep the translation natural, accurate, and suitable for news media. Return ONLY a JSON object with keys: title, description.`,
            },
            { role: "user", content: textToTranslate },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "translation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                },
                required: ["title", "description"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = llmResponse.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
        const parsed = JSON.parse(content || "{}");

        // Save translation to DB
        await db.insert(newsTranslations).values({
          newsId: input.newsId,
          language: input.language,
          title: parsed.title || article.title,
          description: parsed.description || article.description || "",
        });

        const [saved] = await db
          .select()
          .from(newsTranslations)
          .where(and(eq(newsTranslations.newsId, input.newsId), eq(newsTranslations.language, input.language)))
          .limit(1);

        return saved;
      }),

    // Get cached translation for a news article
    get: publicProcedure
      .input(z.object({ newsId: z.number(), language: z.enum(["en", "sv"]) }))
      .query(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) return null;
        const { newsTranslations } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [result] = await db
          .select()
          .from(newsTranslations)
          .where(and(eq(newsTranslations.newsId, input.newsId), eq(newsTranslations.language, input.language)))
          .limit(1);
        return result || null;
      }),

    // Batch translate multiple news articles (admin only)
    batchTranslate: protectedProcedure
      .input(z.object({
        newsIds: z.array(z.number()),
        language: z.enum(["en", "sv"]),
      }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { news, newsTranslations } = await import("../drizzle/schema");
        const { eq, and, inArray } = await import("drizzle-orm");
        const { invokeLLM } = await import("./_core/llm");

        let translated = 0;
        let skipped = 0;

        for (const newsId of input.newsIds.slice(0, 20)) { // limit to 20 per batch
          // Check if already translated
          const existing = await db
            .select({ id: newsTranslations.id })
            .from(newsTranslations)
            .where(and(eq(newsTranslations.newsId, newsId), eq(newsTranslations.language, input.language)))
            .limit(1);

          if (existing.length > 0) { skipped++; continue; }

          const [article] = await db.select().from(news).where(eq(news.id, newsId)).limit(1);
          if (!article) continue;

          try {
            const langName = input.language === "en" ? "English" : "Swedish";
            const llmResponse = await invokeLLM({
              model: "llama-3.1-8b-instant", // سريع وكافي للترجمة الجماعية
              messages: [
                { role: "system", content: `Translate this Arabic news to ${langName}. Return JSON: {title, description}` },
                { role: "user", content: `Title: ${article.title}\nDescription: ${article.description || ""}` },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "translation",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: { title: { type: "string" }, description: { type: "string" } },
                    required: ["title", "description"],
                    additionalProperties: false,
                  },
                },
              },
            });
            const rawMsg = llmResponse.choices?.[0]?.message?.content;
            const parsed = JSON.parse(typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg || "{}"));
            await db.insert(newsTranslations).values({
              newsId,
              language: input.language,
              title: parsed.title || article.title,
              description: parsed.description || "",
            });
            translated++;
          } catch (e) {
            console.error(`[BatchTranslate] Error translating newsId ${newsId}:`, e);
          }
        }

        return { translated, skipped, total: input.newsIds.length };
      }),
  }),

  // Auto-Archive management router
  autoArchive: router({
    // Run auto-archive manually (admin)
    runNow: protectedProcedure
      .input(z.object({ olderThanDays: z.number().min(1).max(365).default(7) }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { news, archivedNews, autoArchiveLogs } = await import("../drizzle/schema");
        const { lt, sql } = await import("drizzle-orm");

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.olderThanDays);

        try {
          // Get IDs already archived
          const alreadyArchived = await db.select({ newsId: archivedNews.newsId }).from(archivedNews);
          const archivedIds = new Set(alreadyArchived.map((a: any) => a.newsId));

          // Get old news not yet archived
          const oldNews = await db
            .select({ id: news.id })
            .from(news)
            .where(lt(news.publishedAt, cutoffDate))
            .limit(500);

          const toArchive = oldNews.filter((n: any) => !archivedIds.has(n.id));

          if (toArchive.length > 0) {
            await db
              .insert(archivedNews)
              .values(toArchive.map((n: any) => ({ userId: 0, newsId: n.id })))
              .onDuplicateKeyUpdate({ set: { newsId: sql`newsId` } });
          }

          // Log the operation
          await db.insert(autoArchiveLogs).values({
            archivedCount: toArchive.length,
            olderThanDays: input.olderThanDays,
            status: "success",
          });

          return { success: true, archivedCount: toArchive.length, olderThanDays: input.olderThanDays };
        } catch (error: any) {
          await db.insert(autoArchiveLogs).values({
            archivedCount: 0,
            olderThanDays: input.olderThanDays,
            status: "error",
            errorMessage: error.message,
          });
          throw error;
        }
      }),

    // Get archive statistics
    stats: protectedProcedure.query(async () => {
      const db = await import("./db").then((m) => m.getDb());
      if (!db) return { totalArchived: 0, systemArchived: 0, logs: [] };
      const { archivedNews, autoArchiveLogs, news } = await import("../drizzle/schema");
      const { eq, sql, desc } = await import("drizzle-orm");

      const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(archivedNews);
      const [systemResult] = await db.select({ count: sql<number>`count(*)` }).from(archivedNews).where(eq(archivedNews.userId, 0));
      const [totalNewsResult] = await db.select({ count: sql<number>`count(*)` }).from(news);
      const logs = await db.select().from(autoArchiveLogs).orderBy(desc(autoArchiveLogs.createdAt)).limit(10);

      return {
        totalArchived: Number(totalResult?.count || 0),
        systemArchived: Number(systemResult?.count || 0),
        totalNews: Number(totalNewsResult?.count || 0),
        logs,
      };
    }),
  }),

  // Breaking News Ticker - managed manually from admin panel
  breakingNews: router({
    // Public: get all active breaking news items for the ticker
    list: publicProcedure.query(async () => {
      const db = await import("./db").then((m) => m.getDb());
      if (!db) return [];
      const { breakingNews } = await import("../drizzle/schema");
      const { eq, asc } = await import("drizzle-orm");
      return await db
        .select()
        .from(breakingNews)
        .where(eq(breakingNews.isActive, 1))
        .orderBy(asc(breakingNews.sortOrder), asc(breakingNews.createdAt));
    }),

    // Admin: get all breaking news items (active + inactive)
    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await import("./db").then((m) => m.getDb());
      if (!db) return [];
      const { breakingNews } = await import("../drizzle/schema");
      const { asc } = await import("drizzle-orm");
      return await db
        .select()
        .from(breakingNews)
        .orderBy(asc(breakingNews.sortOrder), asc(breakingNews.createdAt));
    }),

    // Admin: add a new breaking news item
    add: protectedProcedure
      .input(z.object({
        text: z.string().min(1).max(500),
        url: z.string().optional(),
        sortOrder: z.number().int().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { breakingNews } = await import("../drizzle/schema");
        await db.insert(breakingNews).values({
          text: input.text,
          url: input.url || null,
          sortOrder: input.sortOrder,
          isActive: 1,
        });
        return { success: true };
      }),

    // Admin: delete a breaking news item
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { breakingNews } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(breakingNews).where(eq(breakingNews.id, input.id));
        return { success: true };
      }),

    // Admin: toggle active/inactive
    toggle: protectedProcedure
      .input(z.object({ id: z.number().int(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { breakingNews } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(breakingNews)
          .set({ isActive: input.isActive ? 1 : 0 })
          .where(eq(breakingNews.id, input.id));
        return { success: true };
      }),

    // Keep fetchNow for manual RSS trigger
    fetchNow: publicProcedure
      .mutation(async () => {
        const { fetchAllRSS } = await import("./rssFetcher");
        try {
          await fetchAllRSS();
          return { success: true, message: "تم جلب الأخبار بنجاح" };
        } catch (error) {
          console.error("[Breaking News] Error fetching RSS:", error);
          return { success: false, message: "فشل جلب الأخبار" };
        }
      }),
  }),
  // Live TV Channels router
  liveTV: router({
    list: publicProcedure.query(async () => {
      const db = await import("./db").then((m) => m.getDb());
      if (!db) return [];
      const { liveChannels } = await import("../drizzle/schema");
      const { eq, asc } = await import("drizzle-orm");
      return await db
        .select()
        .from(liveChannels)
        .where(eq(liveChannels.isActive, 1))
        .orderBy(asc(liveChannels.sortOrder));
    }),
    listAll: protectedProcedure.query(async () => {
      const db = await import("./db").then((m) => m.getDb());
      if (!db) return [];
      const { liveChannels } = await import("../drizzle/schema");
      const { asc } = await import("drizzle-orm");
      return await db.select().from(liveChannels).orderBy(asc(liveChannels.sortOrder));
    }),
    add: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        nameEn: z.string().optional(),
        streamType: z.enum(["youtube", "m3u8"]).default("youtube"),
        channelId: z.string().optional(),
        youtubeUrl: z.string().optional(),
        fallbackVideoId: z.string().optional(),
        m3u8Url: z.string().optional(),
        logo: z.string().optional(),
        logoUrl: z.string().optional(),
        color: z.string().optional(),
        description: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { liveChannels } = await import("../drizzle/schema");
        await db.insert(liveChannels).values({
          name: input.name,
          nameEn: input.nameEn,
          streamType: input.streamType || "youtube",
          channelId: input.channelId || "",
          youtubeUrl: input.youtubeUrl || "",
          fallbackVideoId: input.fallbackVideoId,
          m3u8Url: input.m3u8Url,
          logo: input.logo || "📺",
          logoUrl: input.logoUrl,
          color: input.color || "#ef4444",
          description: input.description,
          sortOrder: input.sortOrder ?? 0,
          isActive: 1,
        });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nameEn: z.string().optional(),
        streamType: z.enum(["youtube", "m3u8"]).optional(),
        channelId: z.string().optional(),
        youtubeUrl: z.string().optional(),
        fallbackVideoId: z.string().nullable().optional(),
        m3u8Url: z.string().nullable().optional(),
        logo: z.string().optional(),
        logoUrl: z.string().optional(),
        color: z.string().optional(),
        description: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { liveChannels } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, isActive, ...rest } = input;
        const updateData: Record<string, unknown> = { ...rest };
        if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;
        await db.update(liveChannels).set(updateData).where(eq(liveChannels.id, id));
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { liveChannels } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(liveChannels).where(eq(liveChannels.id, input.id));
        return { success: true };
      }),
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");
        const { liveChannels } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(liveChannels).set({ isActive: input.isActive ? 1 : 0 }).where(eq(liveChannels.id, input.id));
        return { success: true };
      }),
  }),

  // ─── Analytics Router ────────────────────────────────────────────────────────
  analytics: router({
    // Track a page view (called from frontend on each page load)
    trackPageView: publicProcedure
      .input(z.object({
        page: z.string(),
        referrer: z.string().optional(),
        sessionId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) return { success: false };
        const { pageViews } = await import("../drizzle/schema");
        const ip = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          ctx.req.socket?.remoteAddress || null;
        const userAgent = ctx.req.headers["user-agent"] || null;
        await db.insert(pageViews).values({
          page: input.page,
          referrer: input.referrer || null,
          sessionId: input.sessionId || null,
          userId: ctx.user?.id || null,
          ip: ip ? ip.substring(0, 64) : null,
          userAgent: userAgent ? userAgent.substring(0, 512) : null,
        });
        return { success: true };
      }),

    // Get visitor stats (admin only)
    getStats: protectedProcedure
      .input(z.object({ days: z.number().min(1).max(90).default(30) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) return { totalViews: 0, uniqueSessions: 0, topPages: [], dailyViews: [], trafficSources: [] };
        const { pageViews } = await import("../drizzle/schema");
        const { sql, gte, desc } = await import("drizzle-orm");

        const days = input?.days ?? 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        // Total views
        const [totalResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(pageViews)
          .where(gte(pageViews.createdAt, since));

        // Unique sessions
        const [uniqueResult] = await db
          .select({ count: sql<number>`COUNT(DISTINCT COALESCE(sessionId, ip, 'anon'))` })
          .from(pageViews)
          .where(gte(pageViews.createdAt, since));

        // Top pages
        const topPages = await db
          .select({
            page: pageViews.page,
            count: sql<number>`COUNT(*) as count`,
          })
          .from(pageViews)
          .where(gte(pageViews.createdAt, since))
          .groupBy(pageViews.page)
          .orderBy(desc(sql`count`))
          .limit(10);

        // Daily views (last N days)
        const dailyViews = await db
          .select({
            date: sql<string>`DATE(createdAt)`,
            count: sql<number>`COUNT(*) as count`,
          })
          .from(pageViews)
          .where(gte(pageViews.createdAt, since))
          .groupBy(sql`DATE(createdAt)`)
          .orderBy(sql`DATE(createdAt)`);

        // Traffic sources (referrer domains)
        const trafficSources = await db
          .select({
            source: sql<string>`COALESCE(
              CASE
                WHEN referrer IS NULL OR referrer = '' THEN 'مباشر'
                WHEN referrer LIKE '%google%' THEN 'Google'
                WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter/X'
                WHEN referrer LIKE '%whatsapp%' THEN 'WhatsApp'
                WHEN referrer LIKE '%telegram%' THEN 'Telegram'
                ELSE 'أخرى'
              END, 'مباشر'
            )`,
            count: sql<number>`COUNT(*) as count`,
          })
          .from(pageViews)
          .where(gte(pageViews.createdAt, since))
          .groupBy(sql`COALESCE(
              CASE
                WHEN referrer IS NULL OR referrer = '' THEN 'مباشر'
                WHEN referrer LIKE '%google%' THEN 'Google'
                WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter/X'
                WHEN referrer LIKE '%whatsapp%' THEN 'WhatsApp'
                WHEN referrer LIKE '%telegram%' THEN 'Telegram'
                ELSE 'أخرى'
              END, 'مباشر'
            )`)
          .orderBy(desc(sql`count`));

        return {
          totalViews: Number(totalResult?.count || 0),
          uniqueSessions: Number(uniqueResult?.count || 0),
          topPages,
          dailyViews,
          trafficSources,
        };
      }),

    // Get most viewed news (public)
    getMostViewed: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).default(10) }).optional())
      .query(async ({ input }) => {
        const { getMostViewedNews } = await import("./db");
        return getMostViewedNews(input?.limit ?? 10);
      }),

    // New vs returning visitors
    visitorTypes: protectedProcedure
      .input(z.object({ days: z.number().min(1).max(90).default(30) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) return { newVisitors: 0, returningVisitors: 0 };
        const { pageViews } = await import("../drizzle/schema");
        const { sql, gte, lt } = await import("drizzle-orm");

        const days = input?.days ?? 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        const prevPeriod = new Date();
        prevPeriod.setDate(prevPeriod.getDate() - days * 2);

        // Sessions in current period
        const currentSessions = await db
          .select({ sessionId: sql<string>`COALESCE(sessionId, ip, 'anon')` })
          .from(pageViews)
          .where(gte(pageViews.createdAt, since));

        // Sessions that also appeared in previous period (returning)
        const prevSessions = await db
          .select({ sessionId: sql<string>`COALESCE(sessionId, ip, 'anon')` })
          .from(pageViews)
          .where(sql`createdAt >= ${prevPeriod} AND createdAt < ${since}`);

        const prevSet = new Set(prevSessions.map((s: any) => s.sessionId));
        const currentSet = new Set(currentSessions.map((s: any) => s.sessionId));

        let returning = 0;
        currentSet.forEach(id => { if (prevSet.has(id)) returning++; });
        const newVisitors = currentSet.size - returning;

        return { newVisitors, returningVisitors: returning };
      }),
  }),

  // ─── Activity Log Router ─────────────────────────────────────────────────────
  activityLog: router({
    // Log an action (internal use from other procedures)
    log: protectedProcedure
      .input(z.object({
        action: z.string(),
        entity: z.string().optional(),
        entityId: z.number().optional(),
        details: z.string().optional(),
        status: z.enum(["success", "error"]).default("success"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await import("./db").then((m) => m.getDb());
        if (!db) return { success: false };
        const { activityLogs } = await import("../drizzle/schema");
        const ip = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          ctx.req.socket?.remoteAddress || null;
        await db.insert(activityLogs).values({
          userId: ctx.user.id,
          userName: ctx.user.name || ctx.user.username || "مستخدم",
          action: input.action,
          entity: input.entity || null,
          entityId: input.entityId || null,
          details: input.details || null,
          ip: ip ? ip.substring(0, 64) : null,
          status: input.status,
        });
        return { success: true };
      }),

    // Get activity logs (admin only)
    list: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        action: z.string().optional(),
        userId: z.number().optional(),
        entity: z.string().optional(),
        days: z.number().min(1).max(365).default(30),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) return { logs: [], total: 0 };
        const { activityLogs } = await import("../drizzle/schema");
        const { sql, gte, eq, and, desc } = await import("drizzle-orm");

        const page = input?.page ?? 1;
        const limit = input?.limit ?? 50;
        const offset = (page - 1) * limit;
        const days = input?.days ?? 30;

        const since = new Date();
        since.setDate(since.getDate() - days);

        const conditions: any[] = [gte(activityLogs.createdAt, since)];
        if (input?.action) conditions.push(eq(activityLogs.action, input.action));
        if (input?.userId) conditions.push(eq(activityLogs.userId, input.userId));
        if (input?.entity) conditions.push(eq(activityLogs.entity, input.entity));

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const [countResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(activityLogs)
          .where(where);

        const logs = await db
          .select()
          .from(activityLogs)
          .where(where)
          .orderBy(desc(activityLogs.createdAt))
          .limit(limit)
          .offset(offset);

        return {
          logs,
          total: Number(countResult?.count || 0),
        };
      }),

    // Get summary stats for activity log
    summary: protectedProcedure
      .input(z.object({ days: z.number().min(1).max(90).default(7) }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) return { topActions: [], topUsers: [], errorRate: 0 };
        const { activityLogs } = await import("../drizzle/schema");
        const { sql, gte, desc } = await import("drizzle-orm");

        const days = input?.days ?? 7;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const topActions = await db
          .select({
            action: activityLogs.action,
            count: sql<number>`COUNT(*) as count`,
          })
          .from(activityLogs)
          .where(gte(activityLogs.createdAt, since))
          .groupBy(activityLogs.action)
          .orderBy(desc(sql`count`))
          .limit(10);

        const topUsers = await db
          .select({
            userName: activityLogs.userName,
            count: sql<number>`COUNT(*) as count`,
          })
          .from(activityLogs)
          .where(gte(activityLogs.createdAt, since))
          .groupBy(activityLogs.userName)
          .orderBy(desc(sql`count`))
          .limit(5);

        const [totalResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(activityLogs)
          .where(gte(activityLogs.createdAt, since));

        const [errorResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(activityLogs)
          .where(sql`createdAt >= ${since} AND status = 'error'`);

        const total = Number(totalResult?.count || 0);
        const errors = Number(errorResult?.count || 0);

        return {
          topActions,
          topUsers,
          errorRate: total > 0 ? Math.round((errors / total) * 100) : 0,
          total,
          errors,
        };
      }),
  }),
});
export type AppRouter = typeof appRouter;
