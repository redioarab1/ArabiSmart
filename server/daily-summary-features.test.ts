/**
 * Tests for new dailySummary procedures: translate, generatePodcastScript
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    getDb: vi.fn().mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                date: new Date("2026-03-26"),
                summary: "هذا ملخص اختباري للأخبار اليومية.",
                topNews: JSON.stringify([1, 2, 3]),
                trendingTopics: JSON.stringify(["سياسة", "اقتصاد"]),
                statistics: JSON.stringify({ totalNews: 50 }),
                language: "ar",
                createdAt: new Date(),
              },
            ]),
          }),
        }),
      }),
    }),
  };
});

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "This is a translated or podcast text.",
        },
      },
    ],
  }),
}));

// ─── Mock drizzle schema ──────────────────────────────────────────────────────
vi.mock("../drizzle/schema", async () => {
  const actual = await vi.importActual<typeof import("../drizzle/schema")>("../drizzle/schema");
  return {
    ...actual,
    dailySummaries: actual.dailySummaries ?? {},
  };
});

// ─── Mock drizzle-orm ─────────────────────────────────────────────────────────
vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return {
    ...actual,
    eq: vi.fn().mockReturnValue({}),
  };
});

// ─── Context ──────────────────────────────────────────────────────────────────
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      headers: {},
      cookies: {},
    } as unknown as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("dailySummary.translate", () => {
  it("returns translated text for English", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dailySummary.translate({
      summaryId: 1,
      targetLanguage: "en",
    });
    expect(result).toHaveProperty("translatedText");
    expect(typeof result.translatedText).toBe("string");
    expect(result.translatedText.length).toBeGreaterThan(0);
    expect(result.language).toBe("en");
  });

  it("returns translated text for Swedish", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dailySummary.translate({
      summaryId: 1,
      targetLanguage: "sv",
    });
    expect(result.language).toBe("sv");
    expect(typeof result.translatedText).toBe("string");
  });
});

describe("dailySummary.generatePodcastScript", () => {
  it("returns a podcast script string", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dailySummary.generatePodcastScript({
      summaryId: 1,
    });
    expect(result).toHaveProperty("script");
    expect(typeof result.script).toBe("string");
    expect(result.script.length).toBeGreaterThan(0);
    expect(result).toHaveProperty("date");
  });

  it("script is a plain string (no arrays)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dailySummary.generatePodcastScript({
      summaryId: 1,
    });
    // Ensure it's not an array (the TypeScript fix we applied)
    expect(Array.isArray(result.script)).toBe(false);
  });
});
