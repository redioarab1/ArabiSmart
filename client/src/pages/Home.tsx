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
  FolderOpen,
  Tv2
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { AddToFolderButton } from "@/components/AddToFolderButton";
import { getLoginUrl } from "@/const";
import ScrollToTop from "@/components/ScrollToTop";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const [archived, setArchived] = useState<Set<number>>(new Set());
  const [isTabsVisible, setIsTabsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isFetchingBreakingNews, setIsFetchingBreakingNews] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, lang } = useLanguage();
  const utils = trpc.useUtils();

  // dir/lang are managed by LanguageContext — no need to override here

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
    categoryId: selectedCategoryId || undefined,
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

  // ── Archive mutations ──
  const archiveMutation = trpc.archive.toggle.useMutation({
    onSuccess: (data, variables) => {
      if (data.archived) {
        setArchived((prev) => new Set(prev).add(variables.newsId));
        toast.success("تمت أرشفة الخبر بنجاح ✔️");
      } else {
        setArchived((prev) => { const s = new Set(prev); s.delete(variables.newsId); return s; });
        toast.info("تمت إزالة الخبر من الأرشيف");
      }
      utils.archive.list.invalidate();
    },
    onError: () => toast.error("يجب تسجيل الدخول لأرشفة الأخبار"),
  });

  // Load archived news IDs for authenticated users
  const { data: archivedList } = trpc.archive.list.useQuery(undefined, {
    enabled: isAuthenticated,
    onSuccess: (data: any[]) => {
      const ids = new Set(data.map((a: any) => a.news?.id).filter(Boolean) as number[]);
      setArchived(ids);
    },
  } as any);

  const handleToggleArchive = (newsId: number) => {
    if (!isAuthenticated) {
      toast.error("يجب تسجيل الدخول لأرشفة الأخبار");
      return;
    }
    archiveMutation.mutate({ newsId });
  };

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
      case "arabic": return t.catArabic;
      case "swedish": return t.catSwedish;
      case "international": return t.catInternational;
      default: return t.catAll;
    }
  };

  const getCategoryDescription = (_cat: NewsCategory) => getCategoryLabel(_cat);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      <SEOHead
        title="أخبار عربية وسويدية عاجلة"
        description="تابع آخر الأخبار العربية والسويدية والعالمية في مكان واحد. أخبار عاجلة من أكثر من 20 مصدراً موثوقاً مع ملخصات يومية بالذكاء الاصطناعي."
        url="/"
      />
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
                <p className="text-xs md:text-sm text-muted-foreground arabic-text">{t.siteSlogan}</p>
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
                    <p className="text-muted-foreground arabic-text">{t.news}</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
                    <p className="font-bold text-xl text-primary">{stats.activeSources}</p>
                    <p className="text-muted-foreground arabic-text">{t.source}</p>
                  </div>
                </div>
              )}
              
              {/* Advanced Search Link */}
              <Link href="/search">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
              
              {/* Daily Summary Icon - أيقونة الملخص اليومي */}
              <Link href="/daily-summary">
                <div className="relative group">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 hover:from-blue-500/25 hover:to-indigo-500/25 hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-blue-500/25 hover:shadow-lg"
                  >
                    <Sparkles className="h-[18px] w-[18px] text-blue-500" />
                  </Button>
                  {/* Tooltip */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 dark:bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-xl border border-slate-700/50 arabic-text z-50">
                    {t.dailySummary}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 border-l border-t border-slate-700/50" />
                  </div>
                  {/* Live pulse dot */}
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-background" />
                  </span>
                </div>
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
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative rounded-full border-2 border-amber-400/60 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-800/30 hover:border-amber-500 transition-all shadow-sm"
                    title="أرشيف الأخبار المحفوظة"
                  >
                    <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    {archived.size > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                        {archived.size > 9 ? "9+" : archived.size}
                      </span>
                    )}
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
                    <span className="arabic-text hidden md:inline">{t.login}</span>
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
                    <span className={fontSize === 'small' ? 'font-bold' : ''}>{t.fontSmall}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFontSize('medium')} className="arabic-text">
                    <span className={fontSize === 'medium' ? 'font-bold' : ''}>{t.fontMedium}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFontSize('large')} className="arabic-text">
                    <span className={fontSize === 'large' ? 'font-bold' : ''}>{t.fontLarge}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Language Switcher */}
              <LanguageSwitcher />

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
                className="arabic-text data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2 px-3"
              >
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663028696863/TREiIprHXGJofwwf.png" 
                  alt="ArabiSmart News"
                  loading="eager" 
                  className="h-16 w-auto object-contain"
                />
              </TabsTrigger>
              <TabsTrigger value="arabic" className="flex-1 arabic-text data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <span className="text-4xl">🇸🇦</span>
              </TabsTrigger>
              <TabsTrigger value="swedish" className="flex-1 arabic-text data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <span className="text-4xl">🇸🇪</span>
              </TabsTrigger>
              <TabsTrigger value="international" className="flex-1 arabic-text data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <span className="text-4xl">🌍</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          

        </div>
      </section>

      {/* Hero Section */}
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">

            {/* Search Bar */}
            <div className="flex gap-2 max-w-xl mx-auto">
              <Input
                placeholder={t.searchPlaceholder}
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
              <span className="text-sm font-medium arabic-text">{t.filter}:</span>
            </div>
            
            <Select value={source || "all"} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-[200px] arabic-text">
                <SelectValue placeholder="جميع المصادر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allSources}</SelectItem>
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
                  <SelectItem value="all">📅 {t.allTimes}</SelectItem>
                  <SelectItem value="today">🔥 {t.today}</SelectItem>
                  <SelectItem value="week">📆 {t.thisWeek}</SelectItem>
                  <SelectItem value="month">📊 {t.thisMonth}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(source || search || selectedCategoryId) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSource(undefined);
                  setSearch("");
                  setSearchInput("");
                  setSelectedCategoryId(null);
                  setPage(1);
                }}
                className="arabic-text"
              >
                {t.retry}
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
              {/* Video Link - في المقدمة */}
              <Link href="/videos">
                <Button
                  variant="outline"
                  size="sm"
                  className="arabic-text whitespace-nowrap flex-shrink-0 gap-1.5 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Tv2 className="w-4 h-4" />
                  <span>{t.catVideo}</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-border flex-shrink-0 mx-1" />
              <Button
                variant={selectedCategoryId === null ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectedCategoryId(null); setPage(1); }}
                className="arabic-text whitespace-nowrap flex-shrink-0"
              >
                {t.catAll}
              </Button>
              {categories.map((category: any) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedCategoryId(category.id); setPage(1); }}
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
                  const isArchived = archived.has(item.id);
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
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                              title={t.addToFavorites}
                            >
                              <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant={isArchived ? "default" : "secondary"}
                              className={`shadow-lg transition-all ${isArchived ? "bg-amber-500 hover:bg-amber-600 border-amber-500" : ""}`}
                              onClick={() => handleToggleArchive(item.id)}
                              title={isArchived ? t.unarchive : t.archiveNews}
                              disabled={archiveMutation.isPending}
                            >
                              <Archive className={`h-4 w-4 ${isArchived ? "fill-current" : ""}`} />
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
                                  {t.whatsapp}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(item, "twitter")}>
                                  <span className="text-lg ml-2">🐦</span>
                                  {t.twitter}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(item, "facebook")}>
                                  <span className="text-lg ml-2">📘</span>
                                  {t.facebook}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(item, "copy")}>
                                  <Copy className="h-4 w-4 ml-2" />
                                  {t.copyLink}
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
                              <span className="arabic-text">{isTranslated ? t.translated : t.translate}</span>
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
                            <span>{t.readMore}</span>
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
                    {lang === "ar" ? "السابق" : lang === "sv" ? "Föregående" : "Previous"}
                  </Button>
                  <span className="text-sm text-muted-foreground arabic-text px-4">
                    {lang === "ar" ? `صفحة ${page} من ${displayNewsData.totalPages}` : lang === "sv" ? `Sida ${page} av ${displayNewsData.totalPages}` : `Page ${page} of ${displayNewsData.totalPages}`}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(displayNewsData?.totalPages || 1, p + 1))}
                    disabled={page === displayNewsData.totalPages}
                    className="arabic-text"
                  >
                    {lang === "ar" ? "التالي" : lang === "sv" ? "Nästa" : "Next"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground arabic-text">
                {t.noNews}
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
            <p className="text-sm font-medium arabic-text">ArabiSmart News - {t.siteSlogan}</p>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-4 text-sm text-muted-foreground arabic-text">
            <Link href="/about"><span className="hover:text-foreground cursor-pointer transition-colors">{t.about}</span></Link>
            <span>•</span>
            <Link href="/contact"><span className="hover:text-foreground cursor-pointer transition-colors">{t.contact}</span></Link>
            <span>•</span>
            <Link href="/privacy"><span className="hover:text-foreground cursor-pointer transition-colors">{t.privacy}</span></Link>
            <span>•</span>
            <Link href="/daily-summary"><span className="hover:text-foreground cursor-pointer transition-colors">{t.dailySummary}</span></Link>
          </div>
          <p className="text-sm text-muted-foreground arabic-text">
            © 2026 ArabiSmart News. {t.allRightsReserved}.
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
