import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CommentsSection from "@/components/CommentsSection";
import { WebSpeechPlayer } from "@/components/WebSpeechPlayer";
import { ShareButtons } from "@/components/ShareButtons";
import { StoryGenerator } from "@/components/StoryGenerator";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslationTargets, langNames } from "@/lib/translations";
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
import SEOHead from "@/components/SEOHead";
import { Helmet } from "react-helmet-async";
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
  // translations: { en?: {...}, sv?: {...}, ar?: {...} }
  const [newsTranslations, setNewsTranslations] = useState<Record<string, { title: string; description: string }>>({});
  const [translatingLang, setTranslatingLang] = useState<string | null>(null);
  const [activeTranslation, setActiveTranslation] = useState<string | null>(null);
  const [showPodcast, setShowPodcast] = useState(false);
  const { t } = useLanguage();

  const { data: news, isLoading } = trpc.news.getById.useQuery(
    { id: newsId! },
    { enabled: !!newsId }
  );

  const newsTranslateMutation = (trpc as any).newsTranslation?.translate?.useMutation?.() || null;

  // dir/lang managed by LanguageContext

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

  const handleTranslateTo = async (targetLang: "ar" | "en" | "sv") => {
    if (!news || translatingLang) return;

    // If already translated, just toggle display
    if (newsTranslations[targetLang]) {
      setActiveTranslation(activeTranslation === targetLang ? null : targetLang);
      return;
    }

    setTranslatingLang(targetLang);
    try {
      if (newsTranslateMutation && newsId) {
        const result = await newsTranslateMutation.mutateAsync({ newsId, language: targetLang });
        if (result) {
          setNewsTranslations(prev => ({ ...prev, [targetLang]: { title: result.title, description: result.description || "" } }));
          setActiveTranslation(targetLang);
          toast.success(t.translated);
        }
      }
    } catch (error) {
      toast.error(t.failed);
      console.error("Translation error:", error);
    } finally {
      setTranslatingLang(null);
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

  // Determine which translation to show (active one or original)
  const activeTransData = activeTranslation ? newsTranslations[activeTranslation] : null;
  const displayTitle = activeTransData?.title || news.title;
  const displayDescription = activeTransData?.description || news.description || "";
  const isTranslated = !!activeTransData;
  // Get the two target languages for this article based on its original language
  const newsLang = (news.language || "ar") as "ar" | "en" | "sv";
  const translationTargets = getTranslationTargets(newsLang);

  // Build clean description for meta (strip HTML, limit to 160 chars)
  const metaDescription = (news.description || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const newsUrl = `/news/${news.id}`;
  const publishedISO = news.publishedAt
    ? new Date(news.publishedAt).toISOString()
    : new Date(news.createdAt).toISOString();

  // NewsArticle JSON-LD structured data
  const newsArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    description: metaDescription,
    image: news.image
      ? [news.image]
      : ["https://arabismart.vip/icon-512x512.png"],
    datePublished: publishedISO,
    dateModified: publishedISO,
    author: {
      "@type": "Organization",
      name: news.source || "ArabiSmart News",
    },
    publisher: {
      "@type": "Organization",
      name: "ArabiSmart News",
      logo: {
        "@type": "ImageObject",
        url: "https://arabismart.vip/icon-512x512.png",
      },
    },
    url: `https://arabismart.vip/news/${news.id}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://arabismart.vip/news/${news.id}`,
    },
    inLanguage: "ar",
    articleSection: news.category || "أخبار",
    keywords: [news.source, news.category, "أخبار عربية", "ArabiSmart"]
      .filter(Boolean)
      .join(", "),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* SEO Meta Tags */}
      <SEOHead
        title={news.title}
        description={metaDescription || undefined}
        image={news.image || undefined}
        url={newsUrl}
        type="article"
        publishedTime={publishedISO}
        author={news.source || undefined}
        section={news.category || undefined}
      />
      {/* NewsArticle JSON-LD */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(newsArticleJsonLd)}
        </script>
      </Helmet>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" className="arabic-text">
                <ArrowRight className="h-4 w-4 ml-2" />
                {t.backToHome}
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
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
                
                {/* Translation buttons - show for all articles */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {translationTargets.map((tLang) => (
                    <Button
                      key={tLang}
                      variant={activeTranslation === tLang ? "default" : "secondary"}
                      size="sm"
                      className="shadow-lg text-xs"
                      onClick={() => handleTranslateTo(tLang)}
                      disabled={!!translatingLang}
                    >
                      {translatingLang === tLang ? (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      ) : (
                        <Languages className="h-3 w-3 ml-1" />
                      )}
                      {langNames[tLang].flag} {langNames[tLang].native}
                    </Button>
                  ))}
                  {isTranslated && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-lg text-xs bg-background/80"
                      onClick={() => setActiveTranslation(null)}
                    >
                      {t.originalText}
                    </Button>
                  )}
                </div>
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
              
              {/* Translation Buttons - shown when no image (otherwise shown on image) */}
              {!news.image && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><Languages className="h-4 w-4" /> {t.translateTo}:</span>
                  {translationTargets.map((tLang) => (
                    <Button
                      key={tLang}
                      variant={activeTranslation === tLang ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => handleTranslateTo(tLang)}
                      disabled={!!translatingLang}
                    >
                      {translatingLang === tLang ? (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      ) : null}
                      {langNames[tLang].flag} {langNames[tLang].native}
                    </Button>
                  ))}
                  {isTranslated && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTranslation(null)}>
                      {t.originalText}
                    </Button>
                  )}
                </div>
              )}

              <Button asChild variant="outline" className="w-full arabic-text">
                <a href={news.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 ml-2" />
                  {t.readFull}
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

          {/* نظام المشاركة الاجتماعية */}
          <Card className="mt-8">
            <CardContent className="pt-6">
              <ShareButtons
                title={news.title}
                description={news.description || ""}
                url={window.location.href}
              />
            </CardContent>
          </Card>

          {/* توليد صورة Story */}
          <Card className="mt-8">
            <CardContent className="pt-6">
              <StoryGenerator
                title={news.title}
                description={news.description || ""}
                source={news.source}
                publishedAt={news.publishedAt.toISOString()}
                imageUrl={news.image || undefined}
              />
            </CardContent>
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
