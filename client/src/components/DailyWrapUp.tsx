import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Sparkles, ChevronLeft, ExternalLink, RefreshCw, Clock, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
        <div className="flex items-center gap-2">
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
