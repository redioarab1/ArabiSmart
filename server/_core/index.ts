import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { generateSitemap } from "../sitemap";
import { serveStatic, setupVite } from "./vite";
import { initializeCronJobs } from "../cronJobs";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Sitemap
  app.get("/sitemap.xml", generateSitemap);

  // ── Newspaper PDF Generator ──
  app.get("/api/daily-summary/pdf", async (req, res) => {
    try {
      const { getLatestDailySummary, getDailySummaryByDate } = await import("../db");
      const { generateNewspaperPDF } = await import("../pdfService");

      const dateParam = req.query.date as string | undefined;
      let summaryRaw: any = null;

      if (dateParam) {
        summaryRaw = await getDailySummaryByDate(new Date(dateParam));
        // If no summary found for the requested date, fall back to the latest available
        if (!summaryRaw) {
          summaryRaw = await getLatestDailySummary();
        }
      } else {
        summaryRaw = await getLatestDailySummary();
      }

      if (!summaryRaw) {
        res.status(404).json({ error: "No summary found. Please generate a daily summary first." });
        return;
      }

      const summary = {
        ...summaryRaw,
        topNews: summaryRaw.topNews ? JSON.parse(summaryRaw.topNews) : [],
        trendingTopics: summaryRaw.trendingTopics ? JSON.parse(summaryRaw.trendingTopics) : [],
        statistics: summaryRaw.statistics ? JSON.parse(summaryRaw.statistics) : {},
        topNewsItems: [] as any[],
      };

      // Fetch top news titles if IDs are available
      if (summary.topNews && summary.topNews.length > 0) {
        try {
          const { getDb } = await import("../db");
          const db = await getDb();
          if (!db) throw new Error("DB not available");
          const { news } = await import("../../drizzle/schema");
          const { inArray } = await import("drizzle-orm");
          const ids = summary.topNews.slice(0, 5);
          const newsItems = await db.select({
            id: news.id,
            title: news.title,
            source: news.source,
            category: news.category,
            imageUrl: news.image,
          })
            .from(news)
            .where(inArray(news.id, ids));
          summary.topNewsItems = newsItems;
        } catch {
          summary.topNewsItems = [];
        }
      }

      const pdfBuffer = await generateNewspaperPDF(summary);
      const dateStr = new Date(summary.date).toISOString().split("T")[0];

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="arabismart-${dateStr}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error("[PDF] Error generating PDF:", err?.message);
      res.status(500).json({ error: "Failed to generate PDF", details: err?.message });
    }
  });

  // ── Channel Logo Upload ──
  app.post("/api/live-channel/upload-logo", async (req, res) => {
    try {
      const contentType = req.headers["content-type"] || "";
      if (!contentType.includes("multipart/form-data")) {
        res.status(400).json({ error: "Expected multipart/form-data" });
        return;
      }
      const busboy = (await import("busboy")).default;
      const bb = busboy({ headers: req.headers, limits: { fileSize: 5 * 1024 * 1024 } });
      let fileBuffer: Buffer | null = null;
      let mimeType = "image/jpeg";
      let channelId = "unknown";
      bb.on("file", (_field: string, file: any, info: any) => {
        mimeType = info.mimeType || "image/jpeg";
        const chunks: Buffer[] = [];
        file.on("data", (chunk: Buffer) => chunks.push(chunk));
        file.on("end", () => { fileBuffer = Buffer.concat(chunks); });
      });
      bb.on("field", (name: string, val: string) => {
        if (name === "channelId") channelId = val;
      });
      await new Promise<void>((resolve, reject) => {
        bb.on("finish", resolve);
        bb.on("error", reject);
        req.pipe(bb);
      });
      if (!fileBuffer) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      const ext = mimeType.includes("png") ? "png" : "jpg";
      const key = `live-channels/logos/channel-${channelId}-${Date.now()}.${ext}`;
      const { storagePut } = await import("../storage");
      const { url } = await storagePut(key, fileBuffer, mimeType);
      res.json({ success: true, url });
    } catch (err: any) {
      console.error("[Logo Upload] Error:", err?.message);
      res.status(500).json({ error: "Upload failed", details: err?.message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Initialize cron jobs for RSS fetching
    initializeCronJobs();
  });
}

startServer().catch(console.error);
