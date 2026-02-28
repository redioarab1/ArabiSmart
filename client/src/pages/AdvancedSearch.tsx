import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowRight,
  Calendar,
  ExternalLink,
  Heart,
  Star,
  MessageCircle,
  Bookmark,
  X,
} from "lucide-react";
import { toast } from "sonner";

type SortBy = "date_desc" | "date_asc" | "rating_desc" | "comments_desc";

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  source?: string;
  sortBy: SortBy;
}

export default function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<SortBy>("date_desc");
  const [page, setPage] = useState(1);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchName, setSearchName] = useState("");

  // Set RTL direction
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  // Load saved searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("saved_searches");
    if (stored) {
      try {
        setSavedSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved searches:", e);
      }
    }
  }, []);

  const { data: sources } = trpc.rssSources.list.useQuery();

  const { data: newsData, isLoading } = trpc.news.list.useQuery({
    page,
    limit: 12,
    category,
    source,
    search: searchQuery || undefined,
  });

  // Sort news based on sortBy
  const sortedNews = newsData?.items ? [...newsData.items].sort((a, b) => {
    switch (sortBy) {
      case "date_desc":
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      case "date_asc":
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      case "rating_desc":
        // Assuming we'll add rating data later
        return 0;
      case "comments_desc":
        // Assuming we'll add comments count later
        return 0;
      default:
        return 0;
    }
  }) : [];

  // Filter by date range
  const filteredNews = sortedNews.filter((item) => {
    const itemDate = new Date(item.publishedAt);
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (itemDate < fromDate) return false;
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (itemDate > toDate) return false;
    }
    
    return true;
  });

  const handleSearch = () => {
    setPage(1);
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast.error("الرجاء إدخال اسم للبحث");
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      query: searchQuery,
      dateFrom,
      dateTo,
      category,
      source,
      sortBy,
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem("saved_searches", JSON.stringify(updated));
    setSearchName("");
    toast.success("تم حفظ البحث بنجاح");
  };

  const handleLoadSearch = (search: SavedSearch) => {
    setSearchQuery(search.query);
    setDateFrom(search.dateFrom || "");
    setDateTo(search.dateTo || "");
    setCategory(search.category);
    setSource(search.source);
    setSortBy(search.sortBy);
    setPage(1);
    toast.success(`تم تحميل البحث: ${search.name}`);
  };

  const handleDeleteSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem("saved_searches", JSON.stringify(updated));
    toast.success("تم حذف البحث");
  };

  const handleReset = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setCategory(undefined);
    setSource(undefined);
    setSortBy("date_desc");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold arabic-text">البحث المتقدم</h1>
                <p className="text-sm text-muted-foreground arabic-text">
                  ابحث في الأخبار مع فلاتر متقدمة
                </p>
              </div>
            </div>
            
            <Link href="/">
              <Button variant="outline" className="arabic-text">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8">
        <div className="container max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text">الفلاتر</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Query */}
                  <div className="space-y-2">
                    <Label className="arabic-text">كلمة البحث</Label>
                    <Input
                      placeholder="ابحث..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="arabic-text text-right"
                    />
                  </div>

                  {/* Date From */}
                  <div className="space-y-2">
                    <Label className="arabic-text">من تاريخ</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <Label className="arabic-text">إلى تاريخ</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="arabic-text">الفئة</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="arabic-text">
                        <SelectValue placeholder="جميع الفئات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفئات</SelectItem>
                        <SelectItem value="عربية">عربية</SelectItem>
                        <SelectItem value="SE">سويدية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Source */}
                  <div className="space-y-2">
                    <Label className="arabic-text">المصدر</Label>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger className="arabic-text">
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
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label className="arabic-text">الترتيب حسب</Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                      <SelectTrigger className="arabic-text">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date_desc">الأحدث أولاً</SelectItem>
                        <SelectItem value="date_asc">الأقدم أولاً</SelectItem>
                        <SelectItem value="rating_desc">الأعلى تقييماً</SelectItem>
                        <SelectItem value="comments_desc">الأكثر تعليقاً</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSearch} className="flex-1 arabic-text">
                      <Search className="h-4 w-4 ml-2" />
                      بحث
                    </Button>
                    <Button onClick={handleReset} variant="outline" className="arabic-text">
                      إعادة تعيين
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Save Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text flex items-center gap-2">
                    <Bookmark className="h-5 w-5" />
                    حفظ البحث
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="اسم البحث..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="arabic-text text-right"
                  />
                  <Button onClick={handleSaveSearch} className="w-full arabic-text">
                    حفظ
                  </Button>
                </CardContent>
              </Card>

              {/* Saved Searches */}
              {savedSearches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="arabic-text">عمليات البحث المحفوظة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {savedSearches.map((search) => (
                      <div
                        key={search.id}
                        className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <button
                          onClick={() => handleLoadSearch(search)}
                          className="flex-1 text-right arabic-text text-sm"
                        >
                          {search.name}
                        </button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteSearch(search.id)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h2 className="text-xl font-bold arabic-text">
                  النتائج ({filteredNews.length})
                </h2>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <Skeleton className="h-48 w-full" />
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : filteredNews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium arabic-text">لا توجد نتائج</p>
                    <p className="text-sm text-muted-foreground arabic-text mt-2">
                      جرب تعديل معايير البحث
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredNews.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all">
                      {item.image && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <Badge className="absolute top-3 right-3 arabic-text">
                            {item.category}
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="arabic-text text-xs">
                            {item.source}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(item.publishedAt).toLocaleDateString("en-GB")}</span>
                          </div>
                        </div>
                        <CardTitle className="line-clamp-2 arabic-text text-right leading-relaxed">
                          {item.title}
                        </CardTitle>
                        {item.description && (
                          <CardDescription className="line-clamp-3 arabic-text text-right">
                            {item.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Link href={`/news/${item.id}`}>
                          <Button variant="default" size="sm" className="w-full arabic-text">
                            قراءة المزيد
                            <ExternalLink className="h-4 w-4 mr-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
