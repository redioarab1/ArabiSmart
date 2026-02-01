import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CommentsSection from "@/components/CommentsSection";
import { WebSpeechPlayer } from "@/components/WebSpeechPlayer";
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  Globe,
  Heart,
  Share2,
  Copy,
  Languages,
  Loader2,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";
import { calculateReadingTime, detectLanguage } from "@/lib/readingTime";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NewsDetail() {
  const [, params] = useRoute("/news/:id");
  const newsId = params?.id ? parseInt(params.id) : null;
  const [isFavorite, setIsFavorite] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState<{ title: string; description: string } | null>(null);
  const [showPodcast, setShowPodcast] = useState(false);

  const { data: news, isLoading } = trpc.news.getById.useQuery(
    { id: newsId! },
    { enabled: !!newsId }
  );

  const translateMutation = trpc.translate.text.useMutation();

  // Set RTL direction
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  // Load favorite status from localStorage
  useEffect(() => {
    if (newsId) {
      const stored = localStorage.getItem("favorites");
      if (stored) {
        try {
          const favorites = JSON.parse(stored);
          setIsFavorite(favorites.includes(newsId));
        } catch (e) {
          console.error("Failed to parse favorites:", e);
        }
      }
    }
  }, [newsId]);

  const handleToggleFavorite = () => {
    if (!newsId) return;

    const stored = localStorage.getItem("favorites");
    let favorites: number[] = [];
    
    if (stored) {
      try {
        favorites = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse favorites:", e);
      }
    }

    if (isFavorite) {
      favorites = favorites.filter((id) => id !== newsId);
      toast.success("تمت إزالة الخبر من المفضلة");
    } else {
      favorites.push(newsId);
      toast.success("تمت إضافة الخبر إلى المفضلة");
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  const handleShare = (platform: string) => {
    if (!news) return;

    const url = window.location.href;
    const text = news.title;

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast.success("تم نسخ الرابط");
        break;
    }
  };

  const handleTranslate = async () => {
    if (!news || translating) return;

    setTranslating(true);
    try {
      const result = await translateMutation.mutateAsync({
        text: `${news.title}\n\n${news.description || ""}`,
        targetLang: "ar",
      });

      const [title, ...descParts] = result.translated.split("\n\n");
      setTranslation({
        title: title || result.translated,
        description: descParts.join("\n\n") || "",
      });
      toast.success("تمت الترجمة بنجاح");
    } catch (error) {
      toast.error("فشلت الترجمة");
      console.error("Translation error:", error);
    } finally {
      setTranslating(false);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
          <div className="container py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <section className="py-8">
          <div className="container max-w-4xl">
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </section>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="arabic-text text-center">الخبر غير موجود</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button className="arabic-text">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayTitle = translation?.title || news.title;
  const displayDescription = translation?.description || news.description || "";
  const isTranslated = !!translation;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" className="arabic-text">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <Button
                variant={isFavorite ? "default" : "outline"}
                size="icon"
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="arabic-text">
                  <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
                    <span className="text-lg ml-2">📱</span>
                    واتساب
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("twitter")}>
                    <span className="text-lg ml-2">🐦</span>
                    تويتر
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("facebook")}>
                    <span className="text-lg ml-2">📘</span>
                    فيسبوك
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("copy")}>
                    <Copy className="h-4 w-4 ml-2" />
                    نسخ الرابط
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="container max-w-4xl mt-6">
        <Breadcrumbs items={[
          { label: news?.title || "تفاصيل الخبر" }
        ]} />
      </div>

      {/* Content */}
      <section className="py-8">
        <div className="container max-w-4xl">
          <Card className="overflow-hidden">
            {news.image && (
              <div className="relative h-96 overflow-hidden">
                <img
                  src={news.image}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <Badge className="absolute top-4 right-4 arabic-text shadow-lg text-base px-4 py-2">
                  {news.category}
                </Badge>
                
                {news.language !== "ar" && (
                  <Button
                    variant="secondary"
                    className="absolute bottom-4 right-4 shadow-lg"
                    onClick={handleTranslate}
                    disabled={translating}
                  >
                    {translating ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Languages className="h-4 w-4 ml-2" />
                    )}
                    <span className="arabic-text">{isTranslated ? "مترجم" : "ترجمة"}</span>
                  </Button>
                )}
              </div>
            )}
            
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Badge variant="outline" className="arabic-text">
                  <Globe className="h-3 w-3 ml-1" />
                  {news.source}
                </Badge>
                
                <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(news.publishedAt).toLocaleDateString("en-GB")}</span>
                  </div>
                  <span className="text-xs opacity-70">
                    استورد: {new Date(news.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              
              <CardTitle className="text-3xl arabic-text text-right leading-relaxed">
                {displayTitle}
              </CardTitle>
              
              {displayDescription && (
                <p className="text-lg text-muted-foreground arabic-text text-right leading-relaxed whitespace-pre-wrap">
                  {displayDescription}
                </p>
              )}
              
              <Button asChild variant="outline" className="w-full arabic-text">
                <a href={news.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 ml-2" />
                  قراءة الخبر الكامل من المصدر
                </a>
              </Button>

              {/* Podcast Section */}
              <div className="mt-4 space-y-3">
                {showPodcast ? (
                  <WebSpeechPlayer
                    text={`${news.title}. ${news.description || ""}. ${news.content || ""}`}
                    title={news.title}
                    language={news.language}
                  />
                ) : (
                  <Button
                    variant="outline"
                    className="w-full arabic-text"
                    onClick={() => setShowPodcast(true)}
                  >
                    <Headphones className="h-4 w-4 ml-2" />
                    استماع للبودكاست الصوتي
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Comments Section */}
          <div className="mt-8">
            <CommentsSection newsId={news.id} />
          </div>
        </div>
      </section>
    </div>
  );
}
