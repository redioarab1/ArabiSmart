import { execSync } from "child_process";

const forgeKey = process.env.BUILT_IN_FORGE_API_KEY || "";
const forgeUrl = process.env.BUILT_IN_FORGE_API_URL || "";

console.log("Forge URL:", forgeUrl ? forgeUrl.substring(0, 40) + "..." : "NOT SET");
console.log("Key set:", !!forgeKey);

const baseUrl = forgeUrl.endsWith("/") ? forgeUrl.slice(0, -1) : forgeUrl;

// Test TTS endpoint
const ttsEndpoints = [
  baseUrl + "/v1/audio/speech",
  "https://forge.manus.im/v1/audio/speech",
  "https://api.openai.com/v1/audio/speech",
];

for (const url of ttsEndpoints) {
  console.log("\nTesting:", url);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + forgeKey,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: "مرحباً",
        voice: "alloy",
      }),
      signal: AbortSignal.timeout(8000),
    });
    console.log("Status:", res.status, res.statusText);
    const ct = res.headers.get("content-type");
    console.log("Content-Type:", ct);
    if (res.status === 200 && ct?.includes("audio")) {
      const buf = await res.arrayBuffer();
      console.log("✅ SUCCESS! Audio bytes:", buf.byteLength);
      break;
    } else {
      const text = await res.text();
      console.log("Response:", text.substring(0, 150));
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}
