import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Sparkles, ChevronLeft, ExternalLink, RefreshCw,
  Clock, Newspaper, Share2, Copy, Check,
  MessageCircle, Twitter, Facebook, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface WrapUpHeadline {
  id: number;
  title: string;
  summary: string;
  source: string;
  link: string;
  category: string;
  image?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "SE": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "عربية": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const CATEGORY_LABELS: Record<string, string> = {
  "SE": "سويدي",
  "عربية": "عربي",
};

function buildShareText(headlines: WrapUpHeadline[], today: string): string {
  const lines = headlines
    .slice(0, 8)
    .map((h, i) => `${i + 1}. ${h.title}\n   ${h.summary}`)
    .join("\n\n");
  return `📰 اليوم في سطور — ${today}\n\n${lines}\n\n🔗 arabismart.vip`;
}

interface ShareButtonsProps {
  headlines: WrapUpHeadline[];
  today: string;
}

function ShareButtons({ headlines, today }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = buildShareText(headlines, today);
  const siteUrl = "https://arabismart.vip";
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(siteUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("تم نسخ الملخص إلى الحافظة");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("فشل النسخ");
    }
  };

  const handleShare = (platform: string) => {
    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.slice(0, 240))}&url=${encodedUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(shareText.slice(0, 200))}`;
        break;
    }
    if (url) window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <Share2 className="w-3.5 h-3.5" />
          مشاركة
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => handleShare("whatsapp")}
          className="gap-2 cursor-pointer"
        >
          {/* WhatsApp icon */}
          <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          واتساب
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleShare("telegram")}
          className="gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4 text-blue-400" />
          تيليغرام
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleShare("twitter")}
          className="gap-2 cursor-pointer"
        >
          <Twitter className="w-4 h-4 text-sky-400" />
          تويتر / X
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleShare("facebook")}
          className="gap-2 cursor-pointer"
        >
          <Facebook className="w-4 h-4 text-blue-600" />
          فيسبوك
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleCopy}
          className="gap-2 cursor-pointer"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
          {copied ? "تم النسخ!" : "نسخ الملخص"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DailyWrapUp() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = trpc.wrapUp.getToday.useQuery(
    { lang: "ar" },
    { staleTime: 5 * 60 * 1000 }
  );

  const refreshMutation = trpc.wrapUp.refresh.useMutation({
    onSuccess: async () => {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
      toast.success("تم تحديث بطاقة اليوم بنجاح");
    },
    onError: () => {
      setIsRefreshing(false);
      toast.error("فشل تحديث البطاقة");
    },
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshMutation.mutate({ lang: "ar" });
  };

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (error) return null;

  return (
    <section className="w-full my-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">اليوم في سطور</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {today}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {data && data.headlines.length > 0 && (
            <ShareButtons headlines={data.headlines} today={today} />
          )}
          {data && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
              {data.headlines.length} أخبار
            </Badge>
          )}
          {user?.role === "admin" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || refreshMutation.isPending}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-3 h-3 ml-1 ${isRefreshing ? "animate-spin" : ""}`} />
              تحديث
            </Button>
          )}
        </div>
      </div>

      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
        {/* Gradient accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {isLoading || isRefreshing ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !data || data.headlines.length === 0 ? (
          <div className="p-8 text-center">
            <Newspaper className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد أخبار كافية لتوليد ملخص اليوم بعد.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">يتم التحديث تلقائياً مع وصول الأخبار الجديدة.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {data.headlines.map((item: WrapUpHeadline, index: number) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="group flex gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                {/* Number badge */}
                <div className="flex-shrink-0 flex items-start pt-0.5">
                  <span className={`
                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                    ${index === 0 ? "bg-amber-500 text-white" :
                      index === 1 ? "bg-slate-400 text-white" :
                      index === 2 ? "bg-amber-700 text-white" :
                      "bg-muted text-muted-foreground"}
                  `}>
                    {index + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 flex-shrink-0 mt-0.5 transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/60">{item.source}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 h-4 border ${CATEGORY_COLORS[item.category] || "bg-muted/50 text-muted-foreground"}`}
                    >
                      {CATEGORY_LABELS[item.category] || item.category}
                    </Badge>
                  </div>
                </div>

                {/* Thumbnail */}
                {item.image && (
                  <div className="flex-shrink-0 hidden sm:block">
                    <img
                      src={item.image}
                      alt=""
                      className="w-16 h-16 object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        {data && data.headlines.length > 0 && (
          <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between bg-muted/20">
            <p className="text-xs text-muted-foreground/50 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              مُولَّد بالذكاء الاصطناعي
              {data.cached && <span className="text-muted-foreground/30"> · مخزَّن مؤقتاً</span>}
            </p>
            <Link href="/news" className="text-xs text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
              عرض كل الأخبار
              <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
