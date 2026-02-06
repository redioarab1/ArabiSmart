import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Filter, 
  Globe, 
  Calendar, 
  ExternalLink, 
  Languages, 
  Loader2,
  Heart,
  Share2,
  Copy,
  Moon,
  Sun,
  Bell,
  User,
  Archive,
  Settings as SettingsIcon,
  LogIn,
  Zap,
  Sparkles,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { AddToFolderButton } from "@/components/AddToFolderButton";
import { getLoginUrl } from "@/const";
import ScrollToTop from "@/components/ScrollToTop";
import { calculateReadingTime, detectLanguage } from "@/lib/readingTime";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NewsCategory = "all" | "arabic" | "swedish" | "international";

export default function Home() {
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("all");
  const [source, setSource] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [translations, setTranslations] = useState<Record<number, { title: string; description: string }>>({});
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [isTabsVisible, setIsTabsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isFetchingBreakingNews, setIsFetchingBreakingNews] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();

  // Set RTL direction for Arabic content
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  // Handle scroll to hide/show tabs
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 100) {
        // Always show tabs at the top
        setIsTabsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide tabs
        setIsTabsVisible(false);
      } else {
        // Scrolling up - show tabs
        setIsTabsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Load favorites from localStorage for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      const stored = localStorage.getItem("favorites");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFavorites(new Set(parsed));
        } catch (e) {
          console.error("Failed to parse favorites:", e);
        }
      }
    }
  }, [isAuthenticated]);

  // Determine filter based on active category
  const getCategoryFilter = () => {
    switch (activeCategory) {
      case "arabic":
        return { category: "عربية" as const };
      case "swedish":
        return { category: "SE" as const };
      case "international":
        return { language: "en" as const };
      default:
        return {};
    }
  };

  // Filter news by time
  const filterNewsByTime = (news: any[]) => {
    if (timeFilter === 'all') return news;
    
    const now = new Date();
    const filterDate = new Date();
    
    switch (timeFilter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    return news.filter(item => new Date(item.publishedAt) >= filterDate);
  };

  const { data: newsData, isLoading } = trpc.news.list.useQuery({
    page,
    limit: 12,
    ...getCategoryFilter(),
    source,
    search: search || undefined,
  });

  // Apply time filter to news
  const filteredNews = newsData?.items ? filterNewsByTime(newsData.items) : [];
  const displayNewsData = newsData ? { ...newsData, items: filteredNews } : undefined;

  const { data: sources } = trpc.rssSources.list.useQuery();
  const { data: stats } = trpc.news.stats.useQuery();
  const { data: categories } = (trpc as any).categories?.list?.useQuery() || { data: undefined };

  const translateMutation = trpc.translate.text.useMutation();
  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة الخبر إلى المفضلة");
      utils.favorites.list.invalidate();
    },
  });
  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("تمت إزالة الخبر من المفضلة");
      utils.favorites.list.invalidate();
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSourceChange = (value: string) => {
    setSource(value === "all" ? undefined : value);
    setPage(1);
  };

  const handleCategoryChange = (value: NewsCategory) => {
    setActiveCategory(value);
    setPage(1);
  };

  const handleTranslate = async (newsId: number, title: string, description: string, currentLang: string) => {
    setTranslatingId(newsId);
    
    try {
      const titleResult = await translateMutation.mutateAsync({
        text: title,
        targetLang: "ar",
        sourceLang: currentLang as "ar" | "sv" | "en",
      });

      let descResult = { translated: "" };
      if (description) {
        descResult = await translateMutation.mutateAsync({
          text: description,
          targetLang: "ar",
          sourceLang: currentLang as "ar" | "sv" | "en",
        });
      }

      setTranslations((prev) => ({
        ...prev,
        [newsId]: {
          title: titleResult.translated,
          description: descResult.translated,
        },
      }));
      
      toast.success("تمت الترجمة بنجاح");
    } catch (error) {
      toast.error("فشلت الترجمة");
    } finally {
      setTranslatingId(null);
    }
  };

  const handleToggleFavorite = async (newsId: number) => {
    if (!isAuthenticated) {
      // Handle localStorage for non-authenticated users
      const newFavorites = new Set(favorites);
      if (newFavorites.has(newsId)) {
        newFavorites.delete(newsId);
        toast.success("تمت إزالة الخبر من المفضلة");
      } else {
        newFavorites.add(newsId);
        toast.success("تمت إضافة الخبر إلى المفضلة");
      }
      setFavorites(newFavorites);
      localStorage.setItem("favorites", JSON.stringify(Array.from(newFavorites)));
      return;
    }

    // Handle database for authenticated users
    if (favorites.has(newsId)) {
      setFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(newsId);
        return newSet;
      });
      await removeFavoriteMutation.mutateAsync({ newsId });
    } else {
      setFavorites((prev) => new Set(prev).add(newsId));
      await addFavoriteMutation.mutateAsync({ newsId });
    }
  };

  const handleShare = (newsItem: any, platform: string) => {
    const title = encodeURIComponent(newsItem.title);
    const url = encodeURIComponent(newsItem.link);
    
    let shareUrl = "";
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${title}%20${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "copy":
        navigator.clipboard.writeText(newsItem.link);
        toast.success("تم نسخ الرابط");
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const getCategoryLabel = (cat: NewsCategory) => {
    switch (cat) {
      case "arabic":
        return "الأخبار العربية";
      case "swedish":
        return "الأخبار السويدية";
      case "international":
        return "الأخبار العالمية";
      default:
        return "جميع الأخبار";
    }
  };

  const getCategoryDescription = (cat: NewsCategory) => {
    switch (cat) {
      case "arabic":
        return "أخبار من العالم العربي";
      case "swedish":
        return "أخبار السويد بالعربية والسويدية";
      case "international":
        return "أخبار عالمية بلغات متعددة";
      default:
        return "جميع الأخبار من كل المصادر";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Globe className="h-10 w-10 text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent arabic-text">
                  ArabiSmart News
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground arabic-text">تغطية بلا حدود، اجتمعت لتكون بين يديك في مكان واحد</p>
              </div>
            </div>
            
            {/* SEO Content Section */}
            <div className="hidden">
              <h2>أخبار عربية وسويدية وعالمية في مكان واحد</h2>
              <p>
                موقع ArabiSmart News يجمع آخر الأخبار العربية والسويدية والعالمية من أكثر من 25 مصدر موثوق.
                تابع أخبار الجزيرة نت، بي بي سي عربي، سكاي نيوز عربية، الشرق الأوسط، روسيا اليوم، الحرة،
                الكومبس، أخبار السويد، أخبار العرب في السويد، Expressen، Svenska Dagbladet، Sydsvenskan.
                أخبار عاجلة، أخبار اليوم، breaking news، Swedish news، Arabic news.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {stats && (
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
                    <p className="font-bold text-xl text-primary">{stats.totalNews}</p>
                    <p className="text-muted-foreground arabic-text">خبر</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
                    <p className="font-bold text-xl text-primary">{stats.activeSources}</p>
                    <p className="text-muted-foreground arabic-text">مصدر</p>
                  </div>
                </div>
              )}
              
              {/* Advanced Search Link */}
              <Link href="/search">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
              
              {/* Notifications Link */}
              <Link href="/notifications">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Bell className="h-5 w-5" />
                </Button>
              </Link>
              
              {/* Favorites Link */}
              <Link href="/favorites">
                <Button variant="outline" size="icon" className="rounded-full relative">
                  <Heart className="h-5 w-5" />
                  {favorites.size > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {favorites.size}
                    </span>
                  )}
                </Button>
              </Link>
              
              {/* Archive Link */}
              {isAuthenticated && (
                <Link href="/archive">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Archive className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              
              {/* Profile Link */}
              {isAuthenticated && (
                <Link href="/profile">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              
              {/* Settings Link */}
              {isAuthenticated && (
                <Link href="/settings">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <SettingsIcon className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              
              {/* Login/Signup Button */}
              {!isAuthenticated && (
                <a href={getLoginUrl()}>
                  <Button className="gap-2 rounded-full">
                    <LogIn className="h-5 w-5" />
                    <span className="arabic-text hidden md:inline">تسجيل الدخول</span>
                  </Button>
                </a>
              )}
              
              {/* Font Size Controls */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <span className="text-lg font-bold">A</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setFontSize('small')} className="arabic-text">
                    <span className={fontSize === 'small' ? 'font-bold' : ''}>خط صغير</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFontSize('medium')} className="arabic-text">
                    <span className={fontSize === 'medium' ? 'font-bold' : ''}>خط متوسط</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFontSize('large')} className="arabic-text">
                    <span className={fontSize === 'large' ? 'font-bold' : ''}>خط كبير</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Tabs - Sliding Navigation */}
      <section 
        className={`border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 sticky top-[73px] z-40 shadow-sm transition-transform duration-300 ${
          isTabsVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="container py-4">
          <Tabs value={activeCategory} onValueChange={(v) => handleCategoryChange(v as NewsCategory)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-background/50 backdrop-blur">
              <TabsTrigger 
                value="all" 
                className="arabic-text data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-4"
              >
                <Globe className="h-4 w-4 ml-2" />
                <div className="text-right">
                  <div className="font-bold">جميع الأخبار</div>
                  <div className="text-xs opacity-80">All News</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="arabic" 
                className="arabic-text data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-4"
              >
                <span className="text-2xl ml-2">🌍</span>
                <div className="text-right">
                  <div className="font-bold">الأخبار العربية</div>
                  <div className="text-xs opacity-80">Arabic News</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="swedish" 
                className="arabic-text data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-4"
              >
                <span className="text-2xl ml-2">🇸🇪</span>
                <div className="text-right">
                  <div className="font-bold">الأخبار السويدية</div>
                  <div className="text-xs opacity-80">Swedish News</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="international" 
                className="arabic-text data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3 px-4"
              >
                <span className="text-2xl ml-2">🌐</span>
                <div className="text-right">
                  <div className="font-bold">الأخبار العالمية</div>
                  <div className="text-xs opacity-80">World News</div>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <p className="text-center text-sm text-muted-foreground mt-3 arabic-text">
            {getCategoryDescription(activeCategory)}
          </p>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold arabic-text bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {getCategoryLabel(activeCategory)}
            </h2>
            
            {/* Search Bar */}
            <div className="flex gap-2 max-w-xl mx-auto">
              <Input
                placeholder="ابحث في الأخبار..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 arabic-text h-12 text-base"
              />
              <Button onClick={handleSearch} size="lg" className="h-12 px-6">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 border-y bg-muted/30">
        <div className="container">
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium arabic-text">تصفية:</span>
            </div>
            
            <Select value={source || "all"} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-[200px] arabic-text">
                <SelectValue placeholder="جميع المصادر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المصادر</SelectItem>
                {sources?.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={timeFilter} onValueChange={(value: any) => { setTimeFilter(value); setPage(1); }}>
                <SelectTrigger className="w-[200px] arabic-text">
                  <SelectValue placeholder="الفترة الزمنية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📅 كل الأوقات</SelectItem>
                  <SelectItem value="today">🔥 أخبار اليوم</SelectItem>
                  <SelectItem value="week">📆 هذا الأسبوع</SelectItem>
                  <SelectItem value="month">📊 هذا الشهر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(source || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSource(undefined);
                  setSearch("");
                  setSearchInput("");
                  setPage(1);
                }}
                className="arabic-text"
              >
                إعادة تعيين
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Categories Slider */}
      {categories && categories.length > 0 && (
        <section className="py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-[120px] z-40">
          <div className="container">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={selectedCategoryId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId(null)}
                className="arabic-text whitespace-nowrap flex-shrink-0"
              >
                الكل
              </Button>
              {categories.map((category: any) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className="arabic-text whitespace-nowrap flex-shrink-0"
                  style={{
                    backgroundColor: selectedCategoryId === category.id ? category.color || undefined : undefined,
                    borderColor: category.color || undefined,
                  }}
                >
                  {category.icon && <span className="ml-1">{category.icon}</span>}
                  {category.nameAr}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* News Grid */}
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
          ) : displayNewsData && displayNewsData.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayNewsData.items.map((item) => {
                  const translation = translations[item.id];
                  const displayTitle = translation?.title || item.title;
                  const displayDescription = translation?.description || item.description;
                  const isTranslated = !!translation;
                  const isFav = favorites.has(item.id);

                  return (
                    <Card 
                      key={item.id} 
                      className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-2 hover:border-primary/50"
                    >
                      {item.image && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={item.image}
                            alt={displayTitle}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <Badge className="absolute top-3 right-3 arabic-text shadow-lg">
                            {item.category}
                          </Badge>
                          
                          {/* Action Buttons */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            <Button
                              size="sm"
                              variant={isFav ? "default" : "secondary"}
                              className="shadow-lg"
                              onClick={() => handleToggleFavorite(item.id)}
                            >
                              <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="secondary" className="shadow-lg">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="arabic-text">
                                <DropdownMenuItem onClick={() => handleShare(item, "whatsapp")}>
                                  <span className="text-lg ml-2">📱</span>
                                  واتساب
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(item, "twitter")}>
                                  <span className="text-lg ml-2">🐦</span>
                                  تويتر
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(item, "facebook")}>
                                  <span className="text-lg ml-2">📘</span>
                                  فيسبوك
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(item, "copy")}>
                                  <Copy className="h-4 w-4 ml-2" />
                                  نسخ الرابط
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {item.language !== "ar" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute bottom-3 right-3 shadow-lg"
                              onClick={() => handleTranslate(item.id, item.title, item.description || "", item.language)}
                              disabled={translatingId === item.id}
                            >
                              {translatingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              ) : (
                                <Languages className="h-4 w-4 ml-2" />
                              )}
                              <span className="arabic-text">{isTranslated ? "مترجم" : "ترجمة"}</span>
                            </Button>
                          )}
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <Badge variant="outline" className="arabic-text text-xs">
                            {item.source}
                          </Badge>
                          <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(item.publishedAt).toLocaleDateString("en-GB")}</span>
                            </div>
                            <span className="text-[10px] opacity-70">
                              {new Date(item.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="text-[10px] opacity-70 arabic-text">
                              ⏱ {calculateReadingTime(displayDescription || item.description || "", detectLanguage(displayTitle))}
                            </span>
                          </div>
                        </div>
                        <CardTitle className={`line-clamp-2 arabic-text text-right leading-relaxed group-hover:text-primary transition-colors ${
                          fontSize === 'small' ? 'text-base' : fontSize === 'large' ? 'text-2xl' : 'text-lg'
                        }`}>
                          {displayTitle}
                        </CardTitle>
                        {displayDescription && (
                          <CardDescription className={`line-clamp-3 arabic-text text-right leading-relaxed ${
                            fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'
                          }`}>
                            {displayDescription}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Link href={`/news/${item.id}`}>
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full arabic-text group-hover:bg-primary group-hover:scale-105 transition-all"
                          >
                            <span>قراءة المزيد</span>
                            <ExternalLink className="h-4 w-4 mr-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {displayNewsData?.totalPages && displayNewsData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="arabic-text"
                  >
                    السابق
                  </Button>
                  <span className="text-sm text-muted-foreground arabic-text px-4">
                    صفحة {page} من {displayNewsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(displayNewsData?.totalPages || 1, p + 1))}
                    disabled={page === displayNewsData.totalPages}
                    className="arabic-text"
                  >
                    التالي
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground arabic-text">
                لا توجد أخبار متاحة حالياً في هذا القسم
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30 mt-12">
        <div className="container text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium arabic-text">ArabiSmart News - تغطية بلا حدود</p>
          </div>
          <p className="text-sm text-muted-foreground arabic-text">
            © 2026 ArabiSmart News. جميع الحقوق محفوظة.
          </p>
          {stats?.lastUpdate && (
            <p className="text-xs text-muted-foreground arabic-text">
              آخر تحديث: {new Date(stats.lastUpdate).toLocaleString("ar-SA")}
            </p>
          )}
        </div>
      </footer>
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
