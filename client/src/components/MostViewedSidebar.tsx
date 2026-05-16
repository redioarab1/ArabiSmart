import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Eye, Rss } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MostViewedSidebar() {
  const { lang } = useLanguage();
  const { data: mostViewed, isLoading } = (trpc as any).analytics?.getMostViewed?.useQuery?.({ limit: 8 }) || { data: undefined, isLoading: false };

  const title = lang === "ar" ? "الأكثر قراءة" : lang === "sv" ? "Mest läst" : "Most Read";
  const rssLabel = lang === "ar" ? "اشترك في RSS" : lang === "sv" ? "Prenumerera RSS" : "Subscribe RSS";

  return (
    <aside className="space-y-4">
      {/* Most Viewed */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base arabic-text">
            <TrendingUp className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Skeleton className="h-12 w-12 rounded flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))
          ) : mostViewed && mostViewed.length > 0 ? (
            mostViewed.map((item: any, index: number) => (
              <Link key={item.id} href={`/news/${item.id}`}>
                <div className="flex gap-3 items-start group cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors">
                  <span className="text-2xl font-bold text-primary/30 w-8 flex-shrink-0 text-center leading-tight mt-1">
                    {index + 1}
                  </span>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-14 w-14 object-cover rounded flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-14 w-14 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium arabic-text line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs arabic-text px-1.5 py-0">
                        {item.category}
                      </Badge>
                      {item.viewCount > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {item.viewCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground arabic-text text-center py-4">
              {lang === "ar" ? "لا توجد بيانات بعد" : lang === "sv" ? "Inga data ännu" : "No data yet"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* RSS Subscribe */}
      <Card className="border border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Rss className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold arabic-text text-orange-700 dark:text-orange-400">
                {rssLabel}
              </p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <a
                  href="/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium"
                >
                  RSS 2.0
                </a>
                <span className="text-muted-foreground text-xs">•</span>
                <a
                  href="/atom.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium"
                >
                  Atom
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
