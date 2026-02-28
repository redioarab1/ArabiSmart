import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("news.list", () => {
  it("should return paginated news list", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.list({
      page: 1,
      limit: 10,
    });

    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("limit");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("should filter news by category", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.list({
      page: 1,
      limit: 10,
      category: "عربية",
    });

    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
  });
});

describe("news.stats", () => {
  it("should return news statistics", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.news.stats();

    expect(result).toHaveProperty("totalNews");
    expect(result).toHaveProperty("activeSources");
    expect(result).toHaveProperty("lastUpdate");
    expect(typeof result.totalNews).toBe("number");
    expect(typeof result.activeSources).toBe("number");
  });
});

describe("rssSources.list", () => {
  it("should return list of RSS sources", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.rssSources.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    if (result.length > 0) {
      const source = result[0];
      expect(source).toHaveProperty("id");
      expect(source).toHaveProperty("name");
      expect(source).toHaveProperty("url");
      expect(source).toHaveProperty("category");
      expect(source).toHaveProperty("language");
    }
  });
});
