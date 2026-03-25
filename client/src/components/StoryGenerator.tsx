import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

interface StoryGeneratorProps {
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

// Helper: load an image as HTMLImageElement (with CORS proxy fallback)
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Try without crossOrigin as fallback
      const img2 = new Image();
      img2.onload = () => resolve(img2);
      img2.onerror = reject;
      img2.src = src;
    };
    img.src = src;
  });
}

// Wrap text to fit within maxWidth, returns array of lines
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function StoryGenerator({
  title,
  description,
  source,
  publishedAt,
  imageUrl,
}: StoryGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Canvas dimensions: 9:16 Story format
  const W = 540;
  const H = 960;

  const drawStory = async (): Promise<string> => {
    const canvas = canvasRef.current!;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // ── Background gradient ──────────────────────────────────────────────────
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#1e40af");   // blue-800
    grad.addColorStop(0.5, "#1d4ed8"); // blue-700
    grad.addColorStop(1, "#1e3a8a");   // blue-900
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── Subtle decorative circles ────────────────────────────────────────────
    const drawCircle = (x: number, y: number, r: number, alpha: number) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(255,255,255,${alpha})`);
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCircle(W - 80, 80, 180, 0.08);
    drawCircle(80, H - 80, 200, 0.06);

    // ── News image (if available) ────────────────────────────────────────────
    let imgLoaded = false;
    if (imageUrl) {
      try {
        const img = await loadImage(imageUrl);
        const imgH = 280;
        const imgY = 120;
        // Draw with rounded corners
        ctx.save();
        const radius = 16;
        const ix = 24, iy = imgY, iw = W - 48, ih = imgH;
        ctx.beginPath();
        ctx.moveTo(ix + radius, iy);
        ctx.lineTo(ix + iw - radius, iy);
        ctx.quadraticCurveTo(ix + iw, iy, ix + iw, iy + radius);
        ctx.lineTo(ix + iw, iy + ih - radius);
        ctx.quadraticCurveTo(ix + iw, iy + ih, ix + iw - radius, iy + ih);
        ctx.lineTo(ix + radius, iy + ih);
        ctx.quadraticCurveTo(ix, iy + ih, ix, iy + ih - radius);
        ctx.lineTo(ix, iy + radius);
        ctx.quadraticCurveTo(ix, iy, ix + radius, iy);
        ctx.closePath();
        ctx.clip();

        // Cover-fit the image
        const scale = Math.max(iw / img.width, ih / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        const sx = ix + (iw - sw) / 2;
        const sy = iy + (ih - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh);

        // Gradient overlay on image bottom
        const imgGrad = ctx.createLinearGradient(0, iy + ih * 0.5, 0, iy + ih);
        imgGrad.addColorStop(0, "rgba(30,64,175,0)");
        imgGrad.addColorStop(1, "rgba(30,64,175,0.7)");
        ctx.fillStyle = imgGrad;
        ctx.fillRect(ix, iy, iw, ih);

        ctx.restore();
        imgLoaded = true;
      } catch {
        // Image failed to load — proceed without it
      }
    }

    // ── Layout Y positions depending on whether image loaded ─────────────────
    const contentStartY = imgLoaded ? 430 : 160;

    // ── Header (logo + site name) ────────────────────────────────────────────
    const headerY = 44;
    // Logo circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(44, headerY + 20, 22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Globe emoji in circle
    ctx.font = "22px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.fillText("🌐", 44, headerY + 27);

    // Site name
    ctx.textAlign = "right";
    ctx.font = "bold 22px 'Cairo', 'Arial', sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("ArabiSmart News", W - 24, headerY + 16);

    ctx.font = "14px 'Cairo', 'Arial', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("تغطية بلا حدود", W - 24, headerY + 36);

    // ── Divider under header ─────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, 90);
    ctx.lineTo(W - 24, 90);
    ctx.stroke();

    // ── Title ────────────────────────────────────────────────────────────────
    const titleFont = imgLoaded ? "bold 26px" : "bold 30px";
    ctx.font = `${titleFont} 'Cairo', 'Arial', sans-serif`;
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.direction = "rtl";

    const titleMaxWidth = W - 48;
    const titleLines = wrapText(ctx, title, titleMaxWidth);
    const maxTitleLines = imgLoaded ? 4 : 5;
    const titleLineHeight = imgLoaded ? 38 : 44;
    let ty = contentStartY;

    for (let i = 0; i < Math.min(titleLines.length, maxTitleLines); i++) {
      let line = titleLines[i];
      if (i === maxTitleLines - 1 && titleLines.length > maxTitleLines) {
        // Truncate last line with ellipsis
        while (ctx.measureText(line + "...").width > titleMaxWidth && line.length > 0) {
          line = line.slice(0, -1);
        }
        line += "...";
      }
      ctx.fillText(line, W - 24, ty);
      ty += titleLineHeight;
    }

    // ── Description ──────────────────────────────────────────────────────────
    if (description) {
      ty += 12;
      const descFont = imgLoaded ? "16px" : "18px";
      ctx.font = `${descFont} 'Cairo', 'Arial', sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      const descLines = wrapText(ctx, description, titleMaxWidth);
      const maxDescLines = imgLoaded ? 3 : 4;
      const descLineHeight = imgLoaded ? 26 : 30;

      for (let i = 0; i < Math.min(descLines.length, maxDescLines); i++) {
        let line = descLines[i];
        if (i === maxDescLines - 1 && descLines.length > maxDescLines) {
          while (ctx.measureText(line + "...").width > titleMaxWidth && line.length > 0) {
            line = line.slice(0, -1);
          }
          line += "...";
        }
        ctx.fillText(line, W - 24, ty);
        ty += descLineHeight;
      }
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = H - 80;

    // Divider above footer
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, footerY - 16);
    ctx.lineTo(W - 24, footerY - 16);
    ctx.stroke();

    // Source + date
    ctx.font = "15px 'Cairo', 'Arial', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "right";
    ctx.fillText(source, W - 24, footerY + 4);

    const dateStr = new Date(publishedAt).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    ctx.textAlign = "left";
    ctx.fillText(dateStr, 24, footerY + 4);

    // Website URL
    ctx.font = "13px 'Cairo', 'Arial', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "center";
    ctx.direction = "ltr";
    ctx.fillText("arabismart.vip", W / 2, footerY + 28);

    return canvas.toDataURL("image/png", 1.0);
  };

  // Generate preview on mount/prop change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = await drawStory();
        if (!cancelled) setPreviewUrl(url);
      } catch {
        // ignore preview errors
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, source, publishedAt, imageUrl]);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      toast.info("جاري إنشاء الصورة...");
      const dataUrl = await drawStory();

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `arabismart-story-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("تم تحميل صورة Story بنجاح!");
    } catch (error) {
      console.error("Story generation error:", error);
      toast.error("فشل إنشاء الصورة");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <h3 className="text-lg font-semibold w-full">إنشاء صورة Story</h3>

      {/* Hidden canvas used for drawing */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Live preview */}
      <div className="w-full max-w-[270px] mx-auto">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="معاينة Story"
            className="w-full rounded-2xl shadow-2xl border border-white/10"
            style={{ aspectRatio: "9/16", objectFit: "cover" }}
          />
        ) : (
          <div
            className="w-full rounded-2xl shadow-2xl flex items-center justify-center bg-blue-800"
            style={{ aspectRatio: "9/16" }}
          >
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Download button */}
      <Button
        onClick={handleDownload}
        disabled={generating}
        size="lg"
        className="w-full max-w-[270px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {generating ? (
          <Loader2 className="h-5 w-5 ml-2 animate-spin" />
        ) : (
          <Download className="h-5 w-5 ml-2" />
        )}
        تحميل صورة Story
      </Button>

      <p className="text-sm text-muted-foreground text-center max-w-[270px]">
        شارك هذه الصورة على Instagram Stories أو WhatsApp Status
      </p>
    </div>
  );
}
