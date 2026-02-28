import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Languages
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function DailySummary() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch latest summary
  const { data: summary, isLoading, refetch } = trpc.dailySummary.getLatest.useQuery();
  
  // Generate summary mutation
  const generateMutation = trpc.dailySummary.generate.useMutation({
    onSuccess: () => {
      toast.success("تم توليد الملخص اليومي بنجاح!", { className: "arabic-text" });
      refetch();
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error(`فشل توليد الملخص: ${error.message}`, { className: "arabic-text" });
      setIsGenerating(false);
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate({ language: "ar" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="container py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <Button variant="ghost" className="gap-2 arabic-text">
              <Globe className="h-5 w-5" />
              العودة للرئيسية
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold arabic-text flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            الملخص اليومي الذكي
          </h1>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2 arabic-text"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التوليد...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                توليد ملخص جديد
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="container py-12">
        {summary ? (
          <>
            {/* Statistics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground arabic-text flex items-center gap-2">
                    <Newspaper className="h-4 w-4" />
                    إجمالي الأخبار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {summary.statistics.totalNews || 0}
                  </div>
                  <p className="text-xs text-muted-foreground arabic-text mt-1">
                    خبر منشور اليوم
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground arabic-text flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    المصادر النشطة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {summary.statistics.activeSources || 0}
                  </div>
                  <p className="text-xs text-muted-foreground arabic-text mt-1">
                    مصدر إخباري
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground arabic-text flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    أخبار عربية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {summary.statistics.arabicNews || 0}
                  </div>
                  <p className="text-xs text-muted-foreground arabic-text mt-1">
                    خبر باللغة العربية
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground arabic-text flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    تاريخ الملخص
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-primary">
                    {new Date(summary.date).toLocaleDateString("ar-SA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground arabic-text mt-1">
                    آخر تحديث: {new Date(summary.createdAt).toLocaleTimeString("ar-SA")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Summary */}
            <Card className="mb-8 border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl arabic-text flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  ملخص اليوم الشامل
                </CardTitle>
                <CardDescription className="arabic-text">
                  تحليل ذكي لأهم الأخبار والأحداث
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <p className="text-lg leading-relaxed arabic-text text-right whitespace-pre-wrap">
                    {summary.summary}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            {summary.trendingTopics && summary.trendingTopics.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="arabic-text flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    الموضوعات الرائجة
                  </CardTitle>
                  <CardDescription className="arabic-text">
                    أكثر المواضيع تداولاً اليوم
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {summary.trendingTopics.map((topic: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm py-2 px-4 arabic-text hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        <TrendingUp className="h-3 w-3 ml-1" />
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top News */}
            {summary.topNews && summary.topNews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    أهم الأخبار
                  </CardTitle>
                  <CardDescription className="arabic-text">
                    الأخبار الأكثر أهمية اليوم
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary.topNews.map((newsId: number, index: number) => (
                      <Link key={newsId} href={`/news/${newsId}`}>
                        <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground arabic-text">
                              خبر رقم {newsId}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="arabic-text">
                            قراءة المزيد
                          </Button>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold mb-2 arabic-text">لا يوجد ملخص يومي بعد</h2>
              <p className="text-muted-foreground arabic-text mb-6">
                قم بتوليد ملخص ذكي لأهم أخبار اليوم
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="gap-2 arabic-text"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    توليد الملخص اليومي
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
