import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Globe, Calendar, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Set RTL direction for Arabic content
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  const { data: newsData, isLoading } = trpc.news.list.useQuery({
    page,
    limit: 12,
    category,
    source,
    search: search || undefined,
  });

  const { data: sources } = trpc.rssSources.list.useQuery();
  const { data: stats } = trpc.news.stats.useQuery();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value === "all" ? undefined : value);
    setPage(1);
  };

  const handleSourceChange = (value: string) => {
    setSource(value === "all" ? undefined : value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-primary arabic-text">ArabiSmart News</h1>
                <p className="text-sm text-muted-foreground arabic-text">موقع الأخبار الذكي</p>
              </div>
            </div>
            
            {stats && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-lg text-primary">{stats.totalNews}</p>
                  <p className="text-muted-foreground arabic-text">خبر</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-primary">{stats.activeSources}</p>
                  <p className="text-muted-foreground arabic-text">مصدر نشط</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold arabic-text">
              أحدث الأخبار من السويد والعالم العربي
            </h2>
            <p className="text-lg text-muted-foreground arabic-text">
              تحديث تلقائي كل 10 دقائق من 17 مصدر إخباري موثوق
            </p>
            
            {/* Search Bar */}
            <div className="flex gap-2 max-w-xl mx-auto">
              <Input
                placeholder="ابحث في الأخبار..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 arabic-text"
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b bg-background/50">
        <div className="container">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium arabic-text">تصفية:</span>
            </div>
            
            <Select value={category || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px] arabic-text">
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="SE">أخبار السويد</SelectItem>
                <SelectItem value="عربية">أخبار عربية</SelectItem>
              </SelectContent>
            </Select>

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

            {(category || source || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategory(undefined);
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

      {/* News Grid */}
      <section className="py-12">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full rounded-t-lg" />
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
          ) : newsData && newsData.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsData.items.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    {item.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                          <span>{new Date(item.publishedAt).toLocaleDateString("ar-SA")}</span>
                        </div>
                      </div>
                      <CardTitle className="line-clamp-2 arabic-text text-right">
                        {item.title}
                      </CardTitle>
                      {item.description && (
                        <CardDescription className="line-clamp-3 arabic-text text-right">
                          {item.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full arabic-text"
                      >
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          <span>قراءة المزيد</span>
                          <ExternalLink className="h-4 w-4 mr-2" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {newsData.totalPages && newsData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="arabic-text"
                  >
                    السابق
                  </Button>
                  <span className="text-sm text-muted-foreground arabic-text">
                    صفحة {page} من {newsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(newsData.totalPages || 1, p + 1))}
                    disabled={page === newsData.totalPages}
                    className="arabic-text"
                  >
                    التالي
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground arabic-text">
                لا توجد أخبار متاحة حالياً
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground arabic-text">
            © 2026 ArabiSmart News. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs text-muted-foreground mt-2 arabic-text">
            {stats?.lastUpdate && (
              <>آخر تحديث: {new Date(stats.lastUpdate).toLocaleString("ar-SA")}</>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
