import { describe, it, expect } from "vitest";

// اختبار التحقق من مفاتيح SambaNova وCerebras
describe("AI Providers - API Keys Validation", () => {
  it("SambaNova API key is set", () => {
    expect(process.env.SAMBANOVA_API_KEY).toBeTruthy();
    expect(process.env.SAMBANOVA_API_KEY!.length).toBeGreaterThan(10);
  });

  it("Cerebras API key is set", () => {
    expect(process.env.CEREBRAS_API_KEY).toBeTruthy();
    expect(process.env.CEREBRAS_API_KEY!.length).toBeGreaterThan(10);
  });

  it("SambaNova API responds correctly", async () => {
    const response = await fetch("https://api.sambanova.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.SAMBANOVA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Meta-Llama-3.3-70B-Instruct",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      }),
    });
    expect(response.ok).toBe(true);
    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    expect(data.choices).toBeDefined();
    expect(data.choices.length).toBeGreaterThan(0);
  }, 20000);

  it("Cerebras API responds correctly", async () => {
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 5,
      }),
    });
    expect(response.ok).toBe(true);
    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    expect(data.choices).toBeDefined();
    expect(data.choices.length).toBeGreaterThan(0);
  }, 20000);
});
