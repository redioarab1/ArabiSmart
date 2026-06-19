/**
 * notebook.ts — NotebookLM-style AI chat router
 * ─────────────────────────────────────────────
 * Provides RAG (Retrieval-Augmented Generation) over the site's news articles.
 * Users can ask questions and get AI answers grounded in real news from the DB.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { notebookSessions, notebookMessages, news } from "../../drizzle/schema";
import { eq, desc, like, or, sql } from "drizzle-orm";
import { invokeLLM, DEFAULT_MODELS, type GroqModel } from "../_core/llm";
import crypto from "crypto";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSessionKey(): string {
  return crypto.randomBytes(16).toString("hex");
}

/** Simple keyword-based search in news (no vector DB needed) */
async function searchRelevantNews(
  query: string,
  limit = 5
): Promise<Array<{ id: number; title: string; description: string | null; source: string; publishedAt: Date }>> {
  const db = await getDb();
  if (!db) return [];

  // Extract keywords (split on spaces, filter short words)
  const keywords = query
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 5);

  if (keywords.length === 0) {
    // Return latest news if no keywords
    return db
      .select({ id: news.id, title: news.title, description: news.description, source: news.source, publishedAt: news.publishedAt })
      .from(news)
      .orderBy(desc(news.publishedAt))
      .limit(limit);
  }

  // Build OR conditions for each keyword
  const conditions = keywords.map((kw) =>
    or(
      like(news.title, `%${kw}%`),
      like(news.description, `%${kw}%`)
    )
  );

  const results = await db
    .select({ id: news.id, title: news.title, description: news.description, source: news.source, publishedAt: news.publishedAt })
    .from(news)
    .where(or(...conditions))
    .orderBy(desc(news.publishedAt))
    .limit(limit * 2);

  // Score by keyword match count
  const scored = results.map((item) => {
    const text = `${item.title} ${item.description || ""}`.toLowerCase();
    const score = keywords.filter((kw) => text.includes(kw.toLowerCase())).length;
    return { ...item, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _s, ...rest }) => rest);
}

/** Build system prompt with news context */
function buildSystemPrompt(
  contextNews: Array<{ id: number; title: string; description: string | null; source: string; publishedAt: Date }>,
  language: string
): string {
  const newsContext = contextNews
    .map((n, i) => {
      const date = new Date(n.publishedAt).toLocaleDateString("ar-SA");
      return `[${i + 1}] العنوان: ${n.title}\nالمصدر: ${n.source} | التاريخ: ${date}\n${n.description ? `الوصف: ${n.description.slice(0, 300)}` : ""}`;
    })
    .join("\n\n");

  const lang = language === "ar" ? "العربية" : language === "sv" ? "السويدية" : "الإنجليزية";

  return `أنت مساعد إخباري ذكي لموقع ArabiSmart News. مهمتك تحليل الأخبار والإجابة على أسئلة المستخدمين بناءً على الأخبار المتاحة.

**قواعد مهمة:**
1. أجب دائماً باللغة ${lang}
2. استند إلى الأخبار المقدمة لك فقط — لا تخترع معلومات
3. إذا لم تجد إجابة في الأخبار المتاحة، قل ذلك بوضوح
4. اذكر المصدر والتاريخ عند الاقتباس من خبر معين
5. كن موضوعياً ومحايداً في تحليلك
6. يمكنك تلخيص وتحليل ومقارنة الأخبار

**الأخبار المتاحة للرجوع إليها:**
${newsContext || "لا توجد أخبار متاحة حالياً."}

أجب على سؤال المستخدم بناءً على هذه الأخبار.`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const notebookRouter = router({
  /** Create or get a session */
  getOrCreateSession: publicProcedure
    .input(z.object({ sessionKey: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      if (input.sessionKey) {
        const [existing] = await db
          .select()
          .from(notebookSessions)
          .where(eq(notebookSessions.sessionKey, input.sessionKey))
          .limit(1);
        if (existing) return existing;
      }

      const sessionKey = generateSessionKey();
      const [session] = await db
        .insert(notebookSessions)
        .values({ sessionKey, title: "محادثة جديدة" })
        .$returningId();

      const [created] = await db
        .select()
        .from(notebookSessions)
        .where(eq(notebookSessions.id, session.id))
        .limit(1);
      return created;
    }),

  /** Get messages for a session */
  getMessages: publicProcedure
    .input(z.object({ sessionKey: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const [session] = await db
        .select()
        .from(notebookSessions)
        .where(eq(notebookSessions.sessionKey, input.sessionKey))
        .limit(1);
      if (!session) return [];

      return db
        .select()
        .from(notebookMessages)
        .where(eq(notebookMessages.sessionId, session.id))
        .orderBy(notebookMessages.createdAt);
    }),

  /** Send a message and get AI response */
  chat: publicProcedure
    .input(
      z.object({
        sessionKey: z.string(),
        message: z.string().min(1).max(1000),
        language: z.enum(["ar", "sv", "en"]).default("ar"),
        model: z.string().optional(), // اختيار النموذج اختياري
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Get or create session
      let [session] = await db
        .select()
        .from(notebookSessions)
        .where(eq(notebookSessions.sessionKey, input.sessionKey))
        .limit(1);

      if (!session) {
        const [newSession] = await db
          .insert(notebookSessions)
          .values({ sessionKey: input.sessionKey, title: input.message.slice(0, 60) })
          .$returningId();
        [session] = await db
          .select()
          .from(notebookSessions)
          .where(eq(notebookSessions.id, newSession.id))
          .limit(1);
      }

      // Save user message
      await db.insert(notebookMessages).values({
        sessionId: session.id,
        role: "user",
        content: input.message,
      });

      // Search relevant news
      const relevantNews = await searchRelevantNews(input.message, 5);
      const sourceIds = relevantNews.map((n) => n.id);

      // Get conversation history (last 6 messages)
      const history = await db
        .select()
        .from(notebookMessages)
        .where(eq(notebookMessages.sessionId, session.id))
        .orderBy(desc(notebookMessages.createdAt))
        .limit(7);

      const historyMessages = history
        .reverse()
        .slice(0, -1) // exclude the just-inserted user message
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      // Build LLM messages
      const systemPrompt = buildSystemPrompt(relevantNews, input.language);
      const llmMessages = [
        { role: "system" as const, content: systemPrompt },
        ...historyMessages,
        { role: "user" as const, content: input.message },
      ];

      // Call LLM - use selected model or default chat model
      const selectedModel = input.model || DEFAULT_MODELS.chat;
      let aiContent = "";
      try {
        const response = await invokeLLM({ messages: llmMessages, model: selectedModel });
        aiContent =
          (response as { choices?: Array<{ message?: { content?: string } }> })
            ?.choices?.[0]?.message?.content || "عذراً، لم أتمكن من الإجابة في الوقت الحالي.";
      } catch (err) {
        console.error("[Notebook] LLM error:", err);
        aiContent = "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.";
      }

      // Save assistant message
      await db.insert(notebookMessages).values({
        sessionId: session.id,
        role: "assistant",
        content: aiContent,
        sources: JSON.stringify(sourceIds),
      });

      // Update session title if first message
      const msgCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(notebookMessages)
        .where(eq(notebookMessages.sessionId, session.id));
      if (Number(msgCount[0]?.count) <= 2) {
        await db
          .update(notebookSessions)
          .set({ title: input.message.slice(0, 60) })
          .where(eq(notebookSessions.id, session.id));
      }

      return {
        content: aiContent,
        sources: relevantNews.map((n) => ({
          id: n.id,
          title: n.title,
          source: n.source,
          publishedAt: n.publishedAt,
        })),
      };
    }),

  /** Update session title */
  updateTitle: publicProcedure
    .input(z.object({ sessionKey: z.string(), title: z.string().min(1).max(100) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(notebookSessions)
        .set({ title: input.title })
        .where(eq(notebookSessions.sessionKey, input.sessionKey));
      return { success: true };
    }),

  /** Delete a session and its messages */
  deleteSession: publicProcedure
    .input(z.object({ sessionKey: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [session] = await db
        .select()
        .from(notebookSessions)
        .where(eq(notebookSessions.sessionKey, input.sessionKey))
        .limit(1);
      if (session) {
        await db.delete(notebookMessages).where(eq(notebookMessages.sessionId, session.id));
        await db.delete(notebookSessions).where(eq(notebookSessions.id, session.id));
      }
      return { success: true };
    }),
});
