import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Heart, 
  Calendar, 
  ExternalLink, 
  Trash2,
  Filter,
  ArrowRight,
  HeartOff
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Favorites() {
  const [category, setCategory] = useState<string>("all");
  const [localFavorites, setLocalFavorites] = useState<number[]>([]);
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { t, lang } = useLanguage();

  // Load favorites from localStorage for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      const stored = localStorage.getItem("favorites");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setLocalFavorites(parsed);
        } catch (e) {
          console.error("Failed to parse favorites:", e);
        }
      }
    }
  }, [isAuthenticated]);

  const { data: favoritesData, isLoading } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: allNews } = trpc.news.list.useQuery({
    limit: 1000,
  }, {
    enabled: !isAuthenticated && localFavorites.length > 0,
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success(lang === "ar" ? "تمت إزالة الخبر من المفضلة" : lang === "sv" ? "Nyhet borttagen från favoriter" : "News removed from favorites");
      utils.favorites.list.invalidate();
    },
  });

  const handleRemoveFavorite = async (newsId: number) => {
    if (!isAuthenticated) {
      // Handle localStorage for non-authenticated users
      const newFavorites = localFavorites.filter(id => id !== newsId);
      setLocalFavorites(newFavorites);
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      toast.success(lang === "ar" ? "تمت إزالة الخبر من المفضلة" : lang === "sv" ? "Nyhet borttagen från favoriter" : "News removed from favorites");
      return;
    }

    // Handle database for authenticated users
    await removeFavoriteMutation.mutateAsync({ newsId });
  };

  const handleClearAll = () => {
    if (!isAuthenticated) {
      setLocalFavorites([]);
      localStorage.removeItem("favorites");
      toast.success(lang === "ar" ? "تم مسح جميع المفضلة" : lang === "sv" ? "Alla favoriter rensade" : "All favorites cleared");
      return;
    }

    // For authenticated users, remove each favorite
    if (favoritesData) {
      favoritesData.forEach(fav => {
        removeFavoriteMutation.mutate({ newsId: fav.newsId });
      });
    }
  };

  // Get favorites list based on authentication
  const getFavoritesList = () => {
    if (isAuthenticated) {
      return favoritesData || [];
    }

    // For non-authenticated users, filter news by local favorites
    if (allNews && allNews.items) {
      return allNews.items
        .filter(item => localFavorites.includes(item.id))
        .map(item => ({
          id: 0,
          newsId: item.id,
          createdAt: new Date(),
          news: item,
        }));
    }

    return [];
  };

  const favoritesList = getFavoritesList();

  // Filter by category
  const filteredFavorites = category === "all" 
    ? favoritesList 
    : favoritesList.filter(fav => fav.news.category === category);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500 fill-current" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{lang === "ar" ? "المفضلة" : lang === "sv" ? "Favoriter" : "Favorites"}</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredFavorites.length} {lang === "ar" ? "خبر محفوظ" : lang === "sv" ? "sparade nyheter" : "saved news"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link href="/">
                <Button variant="outline">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  {t.home}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      {favoritesList.length > 0 && (
        <section className="py-4 border-b bg-muted/30">
          <div className="container">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{lang === "ar" ? "تصفية:" : lang === "sv" ? "Filtrera:" : "Filter:"}</span>
                </div>
                
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={lang === "ar" ? "جميع الفئات" : lang === "sv" ? "Alla kategorier" : "All Categories"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{lang === "ar" ? "جميع الفئات" : lang === "sv" ? "Alla kategorier" : "All Categories"}</SelectItem>
                    <SelectItem value="عربية">{lang === "ar" ? "عربية" : lang === "sv" ? "Arabiska" : "Arabic"}</SelectItem>
                    <SelectItem value="SE">{lang === "ar" ? "سويدية" : lang === "sv" ? "Svenska" : "Swedish"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                {lang === "ar" ? "مسح الكل" : lang === "sv" ? "Rensa alla" : "Clear All"}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Favorites Grid */}
      <section className="py-8 md:py-12">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredFavorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((fav) => {
                const item = fav.news;
                const isSwedishOrEnglish = item.language === 'sv' || item.language === 'en';
                const displayTitle = (isSwedishOrEnglish && (item as any).translatedTitle) ? (item as any).translatedTitle : item.title;
                const displayDescription = (isSwedishOrEnglish && (item as any).translatedDescription) ? (item as any).translatedDescription : item.description;
                
                return (
                  <Card 
                    key={fav.newsId} 
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-2 hover:border-primary/50"
                  >
                    {item.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <Badge className="absolute top-3 right-3 arabic-text shadow-lg">
                          {item.category}
                        </Badge>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-3 left-3 shadow-lg"
                          onClick={() => handleRemoveFavorite(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <Badge variant="outline" className="arabic-text text-xs">
                          {item.source}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(item.publishedAt).toLocaleDateString("en-GB")}</span>
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2 arabic-text text-right leading-relaxed group-hover:text-primary transition-colors">
                        {displayTitle}
                      </CardTitle>
                      {displayDescription && (
                        <CardDescription className="line-clamp-3 arabic-text text-right leading-relaxed">
                          {displayDescription}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="w-full arabic-text group-hover:bg-primary group-hover:scale-105 transition-all"
                      >
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          <span>{lang === "ar" ? "قراءة المزيد" : lang === "sv" ? "Läs mer" : "Read More"}</span>
                          <ExternalLink className="h-4 w-4 mr-2" />
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleRemoveFavorite(item.id)}
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        {lang === "ar" ? "إزالة من المفضلة" : lang === "sv" ? "Ta bort från favoriter" : "Remove from Favorites"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <HeartOff className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">{lang === "ar" ? "لا توجد أخبار في المفضلة" : lang === "sv" ? "Inga favoriter ännu" : "No favorites yet"}</h3>
              <p className="text-muted-foreground mb-6">
                {lang === "ar" ? "ابدأ بإضافة الأخبار المفضلة لديك من الصفحة الرئيسية" : lang === "sv" ? "Börja lägga till favoriter från startsidan" : "Start adding your favorite news from the home page"}
              </p>
              <Link href="/">
                <Button>
                  <ArrowRight className="h-4 w-4 ml-2" />
                  {lang === "ar" ? "تصفح الأخبار" : lang === "sv" ? "Bläddra nyheter" : "Browse News"}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
