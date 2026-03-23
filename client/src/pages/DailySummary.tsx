import { useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  TrendingUp,
  Newspaper,
  BarChart3,
  Calendar,
  Loader2,
  RefreshCw,
  Globe,
  Download,
  Share2,
  Mail,
  MessageCircle,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Clock,
  BookOpen,
  Zap,
  ArrowLeft,
  FileText,
  Hash,
  Send,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// ─── Types ────────────────────────────────────────────────────────────────────
type SummaryStats = {
  totalNews?: number;
  activeSources?: number;
  arabicNews?: number;
  swedishNews?: number;
  englishNews?: number;
};
type Summary = {
  id: number;
  date: Date | string;
  summary: string;
  topNews: number[];
  trendingTopics: string[];
  statistics: SummaryStats;
  language: string;
  createdAt: Date | string;
};
type NewsItem = {
  id: number;
  title: string;
  source: string | null;
  category: string | null;
  publishedAt: Date | string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    calendar: "gregory",
  }).format(new Date(date));
}
function formatDateShort(date: Date | string) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric", month: "short", day: "numeric",
    calendar: "gregory",
  }).format(new Date(date));
}
function toISODate(date: Date | string) {
  return new Date(date).toISOString().split("T")[0];
}
function buildShareText(summary: Summary, topNewsItems?: NewsItem[]) {
  const dateStr = formatDate(summary.date);
  const topics = summary.trendingTopics?.slice(0, 4).join(" • ") || "";
  const headlinesText = topNewsItems && topNewsItems.length > 0
    ? "\n\n📌 أبرز العناوين:\n" + topNewsItems.slice(0, 5).map((n, i) => `${i + 1}. ${n.title}`).join("\n")
    : "";
  return `📰 ملخص أخبار اليوم - ${dateStr}\n\n${summary.summary?.slice(0, 280)}...${headlinesText}\n\n🔥 الأبرز: ${topics}\n\n🌐 www.arabismart.vip`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SummaryPageSkeleton() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DailySummary() {
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isPngLoading, setIsPngLoading] = useState(false);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [pngCopied, setPngCopied] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  // Fetch latest
  const { data: latestSummary, isLoading: isLoadingLatest, refetch: refetchLatest } =
    trpc.dailySummary.getLatest.useQuery(undefined, { retry: 1 });

  // Fetch by date
  const { data: summaryByDate, isLoading: isLoadingByDate, refetch: refetchByDate } =
    trpc.dailySummary.getByDate.useQuery({ date: selectedDate }, { retry: 1 });

  // Archive list
  const { data: summaryList } = trpc.dailySummary.list.useQuery({ limit: 30 });

  // When isToday: prefer summaryByDate if found, otherwise fall back to latestSummary
  // summaryByDate can be null (not found) or undefined (loading) - only fallback if null/undefined
  const activeSummary: Summary | null | undefined = isToday
    ? (summaryByDate || latestSummary)
    : summaryByDate;

  // Fetch top news details
  const topNewsIds = useMemo(() => activeSummary?.topNews?.slice(0, 5) ?? [], [activeSummary?.id]);
  const { data: topNewsItems } = trpc.dailySummary.getTopNewsDetails.useQuery(
    { newsIds: topNewsIds },
    { enabled: topNewsIds.length > 0 }
  );

  const isLoading = isToday ? isLoadingLatest : isLoadingByDate;

  // Generate mutation
  const generateMutation = trpc.dailySummary.generate.useMutation({
    onSuccess: () => {
      toast.success("تم توليد الملخص اليومي بنجاح!");
      refetchLatest();
      refetchByDate();
      setIsGenerating(false);
    },
    onError: (err) => {
      toast.error("فشل توليد الملخص: " + err.message);
      setIsGenerating(false);
    },
  });

  // ── Handlers ──
  const handleDownloadPDF = useCallback(async () => {
    if (!activeSummary) return;
    setIsPdfLoading(true);
    try {
      toast.info("جاري تحضير ملف PDF...");
      const dateStr = new Date(activeSummary.date).toISOString().split("T")[0];
      const url = `/api/daily-summary/pdf?date=${dateStr}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `arabismart-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success("تم تحميل ملف PDF بنجاح!");
    } catch (err: any) {
      toast.error("فشل تحميل PDF: " + (err?.message || "حاول مرة أخرى"));
    } finally {
      setIsPdfLoading(false);
    }
  }, [activeSummary]);

  // ── PNG Download Handler ──
  const handleDownloadPNG = useCallback(async () => {
    if (!activeSummary) return;
    setIsPngLoading(true);
    setPngUrl(null);
    try {
      toast.info("جاري تحضير صورة PNG... قد يستغرق ذلك 20-30 ثانية");
      const dateStr = new Date(activeSummary.date).toISOString().split("T")[0];
      const response = await fetch(`/api/daily-summary/png?date=${dateStr}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }
      const data = await response.json();
      setPngUrl(data.url);
      // Auto-download
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("تم تحضير صورة PNG بنجاح!");
    } catch (err: any) {
      toast.error("فشل تحضير PNG: " + (err?.message || "حاول مرة أخرى"));
    } finally {
      setIsPngLoading(false);
    }
  }, [activeSummary]);

  const handleCopyPngUrl = useCallback(async () => {
    if (!pngUrl) return;
    try {
      await navigator.clipboard.writeText(pngUrl);
      setPngCopied(true);
      toast.success("تم نسخ رابط الصورة!");
      setTimeout(() => setPngCopied(false), 3000);
    } catch {
      toast.error("فشل نسخ الرابط");
    }
  }, [pngUrl]);

  const handleShareWhatsApp = useCallback(() => {
    if (!activeSummary) return;
    const text = buildShareText(activeSummary, topNewsItems ?? []);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [activeSummary, topNewsItems]);

  const handleShareTelegram = useCallback(() => {
    if (!activeSummary) return;
    const text = buildShareText(activeSummary, topNewsItems ?? []);
    const url = `https://www.arabismart.vip/daily-summary`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
  }, [activeSummary, topNewsItems]);

  const handleShareFacebook = useCallback(() => {
    if (!activeSummary) return;
    const url = `https://www.arabismart.vip/daily-summary`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "width=600,height=400");
  }, [activeSummary]);

  const handleShareEmail = useCallback(() => {
    if (!activeSummary) return;
    const subject = `ملخص أخبار اليوم - ${formatDate(activeSummary.date)}`;
    const body = buildShareText(activeSummary, topNewsItems ?? []);
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [activeSummary, topNewsItems]);

  const handleCopy = useCallback(async () => {
    if (!activeSummary) return;
    const text = buildShareText(activeSummary, topNewsItems ?? []);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم نسخ الملخص مع العناوين!");
    setTimeout(() => setCopied(false), 2500);
  }, [activeSummary, topNewsItems]);

  const handleGenerate = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    setIsGenerating(true);
    generateMutation.mutate({ date: selectedDate, language: "ar" });
  };

  const navigateDate = (dir: "prev" | "next") => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (dir === "next" ? 1 : -1));
    const newDate = d.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    if (newDate <= today) setSelectedDate(newDate);
  };

  if (isLoading && !activeSummary) return <SummaryPageSkeleton />;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEOHead
        title="الملخص اليومي الذكي"
        description="ملخص يومي شامل لأبرز الأخبار العربية والسويدية والعالمية، مُولَّد بالذكاء الاصطناعي. تابع أهم أحداث اليوم في مكان واحد."
        url="/daily-summary"
      />

      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 arabic-text">
              <ArrowLeft className="h-4 w-4" />
              الرئيسية
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm arabic-text hidden sm:inline">ملخصات الأخبار اليومية</span>
          </div>
          {isAuthenticated && (
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2 arabic-text bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              <span className="hidden sm:inline">توليد ملخص</span>
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-4 right-4 w-40 h-40 rounded-full bg-blue-400 blur-3xl" />
            <div className="absolute bottom-4 left-4 w-28 h-28 rounded-full bg-indigo-400 blur-2xl" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold arabic-text">ملخص الأخبار اليومي</h1>
                <p className="text-blue-300 text-sm arabic-text">مُولَّد تلقائياً بالذكاء الاصطناعي كل صباح</p>
              </div>
            </div>

            {/* Date Navigator */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate("prev")}
                className="h-8 w-8 border-white/20 bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5">
                <Calendar className="h-4 w-4 text-blue-300 flex-shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none w-36 cursor-pointer"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate("next")}
                disabled={isToday}
                className="h-8 w-8 border-white/20 bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {!isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                  className="border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs arabic-text"
                >
                  اليوم
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── No Summary ── */}
        {!activeSummary && !isLoading && (
          <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold arabic-text">لا يوجد ملخص لهذا اليوم</h3>
              <p className="text-muted-foreground text-sm arabic-text mt-1">
                {isToday ? "لم يتم توليد ملخص اليوم بعد" : `لا يوجد ملخص بتاريخ ${formatDateShort(selectedDate)}`}
              </p>
            </div>
            {isAuthenticated ? (
              <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2 arabic-text">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                توليد ملخص الآن
              </Button>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="gap-2 arabic-text">تسجيل الدخول لتوليد الملخص</Button>
              </a>
            )}
          </div>
        )}

        {/* ── Summary Content ── */}
        {activeSummary && (
          <>
            {/* Date & meta */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="font-semibold arabic-text text-sm">{formatDate(activeSummary.date)}</span>
                {isToday && (
                  <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs arabic-text">اليوم</Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="arabic-text">
                  آخر تحديث: {new Date(activeSummary.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", calendar: "gregory" })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => { refetchLatest(); refetchByDate(); }}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            {activeSummary.statistics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "إجمالي الأخبار", value: activeSummary.statistics.totalNews || 0, icon: Newspaper, cls: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
                  { label: "المصادر النشطة", value: activeSummary.statistics.activeSources || 0, icon: Globe, cls: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10" },
                  { label: "أخبار عربية", value: activeSummary.statistics.arabicNews || 0, icon: BookOpen, cls: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "أخبار سويدية", value: activeSummary.statistics.swedishNews || 0, icon: BarChart3, cls: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
                ].map((stat, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
                    <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                      <stat.icon className={`h-4 w-4 ${stat.cls}`} />
                    </div>
                    <p className={`text-2xl font-bold ${stat.cls}`}>{stat.value.toLocaleString("ar-EG")}</p>
                    <p className="text-xs text-muted-foreground arabic-text mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Summary Text Card */}
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-bold arabic-text">ملخص اليوم</h2>
                  <p className="text-xs text-muted-foreground arabic-text">مُولَّد بالذكاء الاصطناعي</p>
                </div>
              </div>
              <div className="px-5 py-5">
                <p className="text-base leading-8 arabic-text text-foreground/90 whitespace-pre-line">
                  {activeSummary.summary}
                </p>
              </div>
            </div>

            {/* ── أهم 5 عناوين ── */}
            {topNewsItems && topNewsItems.length > 0 && (
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="font-bold arabic-text">أبرز عناوين اليوم</h2>
                    <p className="text-xs text-muted-foreground arabic-text">أهم {topNewsItems.length} أخبار</p>
                  </div>
                </div>
                <div className="divide-y">
                  {topNewsItems.map((item, i) => (
                    <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                      {/* رقم الخبر */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${
                        i === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                        i === 1 ? "bg-gradient-to-br from-slate-400 to-slate-600" :
                        i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-800" :
                        "bg-gradient-to-br from-blue-500 to-indigo-600"
                      }`}>
                        {i + 1}
                      </div>
                      {/* محتوى الخبر */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm arabic-text leading-6 text-foreground">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {item.source && (
                            <span className="text-xs text-muted-foreground arabic-text bg-muted/50 px-2 py-0.5 rounded-full">
                              {item.source}
                            </span>
                          )}
                          {item.category && (
                            <Badge variant="outline" className="text-xs arabic-text py-0 h-5">
                              {item.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Topics */}
            {activeSummary.trendingTopics && activeSummary.trendingTopics.length > 0 && (
              <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h2 className="font-bold arabic-text">الموضوعات الرائجة</h2>
                </div>
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {activeSummary.trendingTopics.map((topic, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="arabic-text text-sm px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-default"
                    >
                      # {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ── Share & Export Bar ── */}
            <div className="rounded-2xl border bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-blue-500/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold arabic-text">مشاركة وتصدير الملخص</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">

                {/* PDF */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isPdfLoading}
                  className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 hover:border-red-400 transition-all duration-200 cursor-pointer disabled:opacity-60"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                    {isPdfLoading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Download className="h-5 w-5 text-white" />}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xs text-red-700 dark:text-red-400 arabic-text">PDF</p>
                    <p className="text-xs text-muted-foreground arabic-text hidden sm:block">تحميل</p>
                  </div>
                </button>

                {/* PNG */}
                <button
                  onClick={handleDownloadPNG}
                  disabled={isPngLoading}
                  className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:border-emerald-400 transition-all duration-200 cursor-pointer disabled:opacity-60"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                    {isPngLoading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <FileText className="h-5 w-5 text-white" />}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xs text-emerald-700 dark:text-emerald-400 arabic-text">PNG</p>
                    <p className="text-xs text-muted-foreground arabic-text hidden sm:block">صورة</p>
                  </div>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/40 hover:border-green-400 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xs text-green-700 dark:text-green-400 arabic-text">واتساب</p>
                    <p className="text-xs text-muted-foreground arabic-text hidden sm:block">مشاركة</p>
                  </div>
                </button>

                {/* Telegram */}
                <button
                  onClick={handleShareTelegram}
                  className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-sky-200 dark:border-sky-900/40 bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-950/40 hover:border-sky-400 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                    <Send className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xs text-sky-700 dark:text-sky-400 arabic-text">تيليجرام</p>
                    <p className="text-xs text-muted-foreground arabic-text hidden sm:block">مشاركة</p>
                  </div>
                </button>

                {/* Facebook */}
                <button
                  onClick={handleShareFacebook}
                  className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 hover:border-blue-400 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                    {/* Facebook icon SVG */}
                    <svg className="h-5 w-5 text-white fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xs text-blue-700 dark:text-blue-400 arabic-text">فيسبوك</p>
                    <p className="text-xs text-muted-foreground arabic-text hidden sm:block">نشر</p>
                  </div>
                </button>

                {/* Email */}
                <button
                  onClick={handleShareEmail}
                  className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 border-violet-200 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-950/20 hover:bg-violet-100 dark:hover:bg-violet-950/40 hover:border-violet-400 transition-all duration-200 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xs text-violet-700 dark:text-violet-400 arabic-text">إيميل</p>
                    <p className="text-xs text-muted-foreground arabic-text hidden sm:block">إرسال</p>
                  </div>
                </button>
              </div>

              {/* Copy text row */}
              <div className="mt-3 pt-3 border-t border-blue-500/10 space-y-2">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-all duration-200 cursor-pointer"
                >
                  {copied ? <Check className="h-4 w-4 text-purple-600" /> : <Copy className="h-4 w-4 text-purple-600" />}
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-400 arabic-text">
                    {copied ? "✓ تم نسخ الملخص مع العناوين!" : "نسخ الملخص الكامل مع العناوين"}
                  </span>
                </button>

                {/* PNG Direct Link Row - shows after PNG is generated */}
                {pngUrl && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium arabic-text mb-0.5">رابط مباشر للصورة PNG</p>
                      <p className="text-xs text-muted-foreground truncate font-mono" dir="ltr">{pngUrl}</p>
                    </div>
                    <button
                      onClick={handleCopyPngUrl}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
                    >
                      {pngCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span className="arabic-text">{pngCopied ? "تم!" : "نسخ"}</span>
                    </button>
                    <a
                      href={pngUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span className="arabic-text">فتح</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Archive ── */}
        {summaryList && summaryList.length > 1 && (
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <h2 className="font-bold arabic-text">أرشيف الملخصات السابقة</h2>
            </div>
            <div className="divide-y">
              {summaryList.slice(0, 10).map((s) => {
                const sDate = toISODate(s.date);
                const isSelected = sDate === selectedDate;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedDate(sDate)}
                    className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors text-right ${isSelected ? "bg-blue-500/5 border-r-2 border-blue-500" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? "bg-blue-500" : "bg-muted-foreground/30"}`} />
                      <div className="text-right">
                        <p className="font-medium text-sm arabic-text">{formatDateShort(s.date)}</p>
                        <p className="text-xs text-muted-foreground arabic-text line-clamp-1 max-w-xs">
                          {(s.summary || "").slice(0, 80)}...
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground flex-shrink-0 mr-2" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
