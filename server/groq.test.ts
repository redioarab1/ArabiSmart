/**
 * groq.test.ts — اختبار Groq API
 * يتحقق من صحة GROQ_API_KEY عبر طلب بسيط
 */
import { describe, it, expect } from "vitest";

describe("Groq API", () => {
  it("should respond to a simple Arabic message", async () => {
    // استخدام متغير البيئة فقط — لا تضع مفاتيح API في الكود
    const apiKey = process.env.GROQ_API_KEY;
    expect(apiKey, "GROQ_API_KEY must be set").toBeTruthy();

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "قل كلمة واحدة فقط: مرحبا" }],
          max_tokens: 20,
        }),
      }
    );

    const responseText = await response.text();
    expect(response.ok, `Groq API returned ${response.status}: ${responseText}`).toBe(true);

    const data = JSON.parse(responseText) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content;
    expect(content).toBeTruthy();
    console.log("[Groq Test] Response:", content);
  }, 30000);
});
