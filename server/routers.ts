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
});

export type AppRouter = typeof appRouter;
