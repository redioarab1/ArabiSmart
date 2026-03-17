/**
 * pdfService.ts
 * Generates a premium newspaper-style Arabic PDF for the daily summary.
 * Uses Python + WeasyPrint (via child_process) — works in ALL environments
 * (no Chrome/puppeteer needed, no shared library issues in production).
 */
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdtemp, rm } from "fs/promises";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { existsSync } from "fs";
// ESM-safe __dirname (using import.meta.dirname like vite.ts)
const __dirname = import.meta.dirname ?? dirname(new URL(import.meta.url).pathname);

const execFileAsync = promisify(execFile);

// ─── Types ────────────────────────────────────────────────────────────────────
type SummaryStats = {
  totalNews?: number;
  activeSources?: number;
  arabicNews?: number;
  swedishNews?: number;
  englishNews?: number;
};

type NewsItem = {
  id?: number;
  title: string;
  source?: string;
  category?: string;
  imageUrl?: string;
  description?: string;
};

type SummaryData = {
  date: Date | string;
  summary: string;
  trendingTopics?: string[];
  statistics?: SummaryStats;
  topNewsItems?: NewsItem[];
};

// ─── Locate Python script ─────────────────────────────────────────────────────
function getPythonScriptPath(): string {
  // Try relative to this file (server/generate_pdf.py)
  const candidates = [
    join(__dirname, "generate_pdf.py"),
    join(__dirname, "..", "server", "generate_pdf.py"),
    join(process.cwd(), "server", "generate_pdf.py"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  // Fallback — will fail with a clear error
  return join(__dirname, "generate_pdf.py");
}

// ─── Locate Python executable ─────────────────────────────────────────────────
async function findPython(): Promise<string> {
  // Use full paths to avoid PYTHONPATH conflicts with uv/python3.13
  const candidates = [
    "/usr/bin/python3.11",
    "/usr/bin/python3",
    "python3.11",
    "python3",
    "python",
  ];
  for (const cmd of candidates) {
    try {
      const cleanEnv = { ...process.env };
      delete cleanEnv.PYTHONPATH;
      const { stdout } = await execFileAsync(cmd, ["--version"], { timeout: 5000, env: cleanEnv });
      if (stdout || true) return cmd;
    } catch {
      // try next
    }
  }
  return "/usr/bin/python3.11";
}

// Build a clean env without Python-related vars (prevents uv/python3.13 conflicts)
function cleanPythonEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.PYTHONPATH;
  delete env.PYTHONHOME;
  return env;
}

// ─── Main PDF Generator ───────────────────────────────────────────────────────
export async function generateNewspaperPDF(data: SummaryData): Promise<Buffer> {
  const tmpDir = await mkdtemp(join(tmpdir(), "arabismart-pdf-"));

  try {
    const inputPath = join(tmpDir, "input.json");
    const outputPath = join(tmpDir, "output.pdf");
    const scriptPath = getPythonScriptPath();

    // Serialize data to JSON (handle Date objects)
    const jsonData = JSON.stringify(data, (_key, value) => {
      if (value instanceof Date) return value.toISOString();
      return value;
    });

    await writeFile(inputPath, jsonData, "utf-8");

    const python = await findPython();

    // Run Python script with clean env (no PYTHONPATH to avoid uv/3.13 conflicts)
    const { stdout, stderr } = await execFileAsync(
      python,
      [scriptPath, inputPath, outputPath],
      {
        timeout: 120000, // 2 minutes
        env: { ...cleanPythonEnv(), PYTHONIOENCODING: "utf-8" },
      }
    );

    if (stderr && !stdout.startsWith("OK:")) {
      console.error("[PDF Python] stderr:", stderr.slice(0, 500));
    }

    if (!stdout.startsWith("OK:")) {
      throw new Error(`Python PDF script failed: ${stdout || stderr}`);
    }

    const pdfBuffer = await readFile(outputPath);
    return pdfBuffer;
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
