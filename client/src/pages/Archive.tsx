import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive, ArrowRight, Calendar, ExternalLink, Trash2, Home } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ArchivePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t, lang } = useLanguage();
  const { data: archivedNews, isLoading, refetch } = trpc.archive.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const unarchiveMutation = trpc.archive.toggle.useMutation({
    onSuccess: () => {
      toast.success(lang === "ar" ? "تمت إزالة الخبر من الأرشيف" : lang === "sv" ? "Nyhet borttagen från arkivet" : "News removed from archive");
      refetch();
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Archive className="h-8 w-8 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold">{lang === "ar" ? "الأرشيف" : lang === "sv" ? "Arkiv" : "Archive"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  <span>{t.home}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container py-8">
        {!archivedNews || archivedNews.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Archive className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">{lang === "ar" ? "لا توجد أخبار مؤرشفة" : lang === "sv" ? "Inga arkiverade nyheter" : "No archived news"}</h3>
                <p className="text-muted-foreground">
                  {lang === "ar" ? "يمكنك أرشفة الأخبار من الصفحة الرئيسية للوصول إليها لاحقاً" : lang === "sv" ? "Du kan arkivera nyheter från startsidan" : "You can archive news from the home page"}
                </p>
              </div>
              <Link href="/">
                <Button className="gap-2">
                  <span>{lang === "ar" ? "تصفح الأخبار" : lang === "sv" ? "Bläddra nyheter" : "Browse News"}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {archivedNews.length} {lang === "ar" ? "خبر مؤرشف" : lang === "sv" ? "arkiverade nyheter" : "archived news"}
              </p>
            </div>

            <div className="grid gap-6">
              {archivedNews.map((item: any) => {
                const newsItem = item.news;
                if (!newsItem) return null;

                return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="md:flex">
                      {newsItem.image && (
                        <div className="md:w-1/3">
                          <img
                            src={newsItem.image}
                            alt={newsItem.title}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        </div>
                      )}
                      <div className={newsItem.image ? "md:w-2/3" : "w-full"}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="arabic-text">
                                {newsItem.category}
                              </Badge>
                              <Badge variant="outline" className="arabic-text">
                                {newsItem.source}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => unarchiveMutation.mutate({ newsId: newsItem.id })}
                              disabled={unarchiveMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <CardTitle className="text-xl arabic-text leading-relaxed">
                            {newsItem.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {newsItem.description && (
                            <p className="text-muted-foreground arabic-text line-clamp-2">
                              {newsItem.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(newsItem.publishedAt).toLocaleDateString(lang === "ar" ? "en-GB" : lang === "sv" ? "sv-SE" : "en-US")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Archive className="h-4 w-4" />
                                <span>
                                  {new Date(item.archivedAt).toLocaleDateString(lang === "ar" ? "en-GB" : lang === "sv" ? "sv-SE" : "en-US")}
                                </span>
                              </div>
                            </div>
                            <Link href={`/news/${newsItem.id}`}>
                              <Button variant="outline" size="sm" className="gap-2">
                                <span>{lang === "ar" ? "قراءة المزيد" : lang === "sv" ? "Läs mer" : "Read More"}</span>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
