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

  // ── Tools Check (temporary debug endpoint) ──
  app.get("/api/debug/tools", async (req, res) => {
    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(execFile);
    const results: Record<string, string> = {};
    const checks = [
      { name: "weasyprint", cmd: "weasyprint", args: ["--version"] },
      { name: "python3", cmd: "python3", args: ["-c", "import weasyprint; print(weasyprint.__version__)"] },
      { name: "pdftoppm", cmd: "pdftoppm", args: ["-v"] },
      { name: "chromium", cmd: "chromium-browser", args: ["--version"] },
      { name: "google-chrome", cmd: "google-chrome", args: ["--version"] },
    ];
    for (const c of checks) {
      try {
        const r = await execAsync(c.cmd, c.args, { timeout: 5000 });
        results[c.name] = (r.stdout || r.stderr || "ok").trim().slice(0, 100);
      } catch (e: any) {
        results[c.name] = "NOT FOUND: " + (e.message || "").slice(0, 80);
      }
    }
    res.json(results);
  });

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

  // ── Newspaper PNG Generator (PDF → PNG → S3) ──
  app.get("/api/daily-summary/png", async (req, res) => {
    try {
      const { getLatestDailySummary, getDailySummaryByDate } = await import("../db");
      const { generateNewspaperPDF } = await import("../pdfService");
      const { storagePut } = await import("../storage");
      const { execFile } = await import("child_process");
      const { promisify } = await import("util");
      const { mkdtemp, rm, readdir, readFile } = await import("fs/promises");
      const { tmpdir } = await import("os");
      const { join } = await import("path");
      const sharp = (await import("sharp")).default;
      const execFileAsync = promisify(execFile);

      const dateParam = req.query.date as string | undefined;
      let summaryRaw: any = null;

      if (dateParam) {
        summaryRaw = await getDailySummaryByDate(new Date(dateParam));
        if (!summaryRaw) summaryRaw = await getLatestDailySummary();
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

      // Fetch top news images
      if (summary.topNews && summary.topNews.length > 0) {
        try {
          const { getDb } = await import("../db");
          const db = await getDb();
          if (!db) throw new Error("DB not available");
          const { news } = await import("../../drizzle/schema");
          const { inArray } = await import("drizzle-orm");
          const ids = summary.topNews.slice(0, 5);
          const newsItems = await db.select({
            id: news.id, title: news.title, source: news.source,
            category: news.category, imageUrl: news.image,
          }).from(news).where(inArray(news.id, ids));
          summary.topNewsItems = newsItems;
        } catch { summary.topNewsItems = []; }
      }

      // Generate PDF buffer
      const pdfBuffer = await generateNewspaperPDF(summary);
      const dateStr = new Date(summary.date).toISOString().split("T")[0];

      // Convert PDF pages to PNG using pdftoppm
      const tmpDir = await mkdtemp(join(tmpdir(), "arabismart-png-"));
      try {
        const pdfPath = join(tmpDir, "summary.pdf");
        const { writeFile } = await import("fs/promises");
        await writeFile(pdfPath, pdfBuffer);

        // Convert all pages at 200 DPI
        await execFileAsync("pdftoppm", [
          "-r", "200",
          "-png",
          pdfPath,
          join(tmpDir, "page")
        ]);

        // Read generated PNG files
        const files = (await readdir(tmpDir))
          .filter(f => f.endsWith(".png"))
          .sort();

        if (files.length === 0) {
          throw new Error("No PNG pages generated from PDF");
        }

        // If multiple pages, stitch them vertically using sharp
        let finalPngBuffer: Buffer;
        if (files.length === 1) {
          finalPngBuffer = await readFile(join(tmpDir, files[0]));
        } else {
          // Load all pages
          const pageBuffers = await Promise.all(
            files.map(f => readFile(join(tmpDir, f)))
          );
          // Get dimensions of first page
          const firstMeta = await sharp(pageBuffers[0]).metadata();
          const pageWidth = firstMeta.width || 794;
          const pageHeight = firstMeta.height || 1123;
          const totalHeight = pageHeight * files.length;

          // Create composite
          const compositeInput = pageBuffers.map((buf, i) => ({
            input: buf,
            top: i * pageHeight,
            left: 0,
          }));

          finalPngBuffer = await sharp({
            create: {
              width: pageWidth,
              height: totalHeight,
              channels: 3,
              background: { r: 255, g: 255, b: 255 },
            },
          })
            .composite(compositeInput)
            .png({ quality: 95, compressionLevel: 6 })
            .toBuffer();
        }

        // Upload to S3
        const s3Key = `daily-summaries/png/arabismart-${dateStr}-${Date.now()}.png`;
        const { url: imageUrl } = await storagePut(s3Key, finalPngBuffer, "image/png");

        // Return JSON with download URL
        res.json({
          success: true,
          url: imageUrl,
          filename: `arabismart-${dateStr}.png`,
          date: dateStr,
          pages: files.length,
        });
      } finally {
        await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    } catch (err: any) {
      console.error("[PNG] Error generating PNG:", err?.message);
      res.status(500).json({ error: "Failed to generate PNG", details: err?.message });
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
