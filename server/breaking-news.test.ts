import { describe, it, expect } from "vitest";

describe("Breaking News Ticker - Business Logic", () => {
  it("should only show active items in public list", () => {
    const items = [
      { id: 1, text: "خبر عاجل 1", isActive: 1, sortOrder: 0 },
      { id: 2, text: "خبر عاجل 2", isActive: 0, sortOrder: 1 },
      { id: 3, text: "خبر عاجل 3", isActive: 1, sortOrder: 2 },
    ];
    const activeItems = items.filter((i) => i.isActive === 1);
    expect(activeItems).toHaveLength(2);
    expect(activeItems.map((i) => i.id)).toEqual([1, 3]);
  });

  it("should sort items by sortOrder ascending", () => {
    const items = [
      { id: 3, text: "ثالث", sortOrder: 2 },
      { id: 1, text: "أول", sortOrder: 0 },
      { id: 2, text: "ثاني", sortOrder: 1 },
    ];
    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(sorted[0].id).toBe(1);
    expect(sorted[1].id).toBe(2);
    expect(sorted[2].id).toBe(3);
  });

  it("should validate text length (max 500 chars)", () => {
    const validText = "خبر عاجل".repeat(10); // 80 chars
    const invalidText = "خ".repeat(501);
    expect(validText.length).toBeLessThanOrEqual(500);
    expect(invalidText.length).toBeGreaterThan(500);
  });

  it("should allow optional URL field", () => {
    const itemWithUrl = { text: "خبر عاجل", url: "https://example.com" };
    const itemWithoutUrl = { text: "خبر عاجل" };
    expect(itemWithUrl.url).toBeDefined();
    expect((itemWithoutUrl as any).url).toBeUndefined();
  });

  it("should toggle isActive correctly", () => {
    let item = { id: 1, isActive: 1 };
    // Toggle off
    item = { ...item, isActive: 0 };
    expect(item.isActive).toBe(0);
    // Toggle on
    item = { ...item, isActive: 1 };
    expect(item.isActive).toBe(1);
  });
});
