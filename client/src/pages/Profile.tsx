import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowRight,
  User,
  MessageCircle,
  Star,
  Heart,
  BookOpen,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Set RTL direction
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  // Mock data for now - will be implemented when backend is ready
  const userComments: any[] = [];
  const commentsLoading = false;
  const userRatings: any[] = [];
  const ratingsLoading = false;

  const { data: favorites } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Calculate statistics
  const totalComments = userComments?.length || 0;
  const totalRatings = userRatings?.length || 0;
  const averageRating = totalRatings > 0
    ? (userRatings?.reduce((sum: number, r: any) => sum + r.rating, 0) || 0) / totalRatings
    : 0;
  const totalFavorites = favorites?.length || 0;

  // Get favorites from localStorage for non-authenticated users
  const localFavorites = (() => {
    try {
      const stored = localStorage.getItem("favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();

  const displayFavorites = isAuthenticated ? totalFavorites : localFavorites.length;

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
          <div className="container py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <section className="py-8">
          <div className="container max-w-4xl">
            <Skeleton className="h-32 w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold arabic-text">الملف الشخصي</h1>
                <p className="text-sm text-muted-foreground arabic-text">
                  إحصائياتك ونشاطك
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
        <div className="container max-w-4xl">
          {/* User Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-right">
                  <CardTitle className="text-2xl arabic-text">{user.name || "مستخدم"}</CardTitle>
                  <CardDescription className="arabic-text">{user.email}</CardDescription>
                  <div className="flex gap-2 mt-2 justify-end">
                    <Badge>{user.role === "admin" ? "مسؤول" : "مستخدم"}</Badge>
                    <Badge variant="outline">
                      انضم: {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium arabic-text flex items-center justify-between">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span>التعليقات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-right">{totalComments}</div>
                <p className="text-xs text-muted-foreground arabic-text text-right mt-1">
                  إجمالي التعليقات
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium arabic-text flex items-center justify-between">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>التقييمات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-right">{totalRatings}</div>
                <p className="text-xs text-muted-foreground arabic-text text-right mt-1">
                  متوسط: {averageRating.toFixed(1)} ⭐
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium arabic-text flex items-center justify-between">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>المفضلة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-right">{displayFavorites}</div>
                <p className="text-xs text-muted-foreground arabic-text text-right mt-1">
                  أخبار محفوظة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium arabic-text flex items-center justify-between">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>النشاط</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-right">
                  {totalComments + totalRatings}
                </div>
                <p className="text-xs text-muted-foreground arabic-text text-right mt-1">
                  إجمالي التفاعلات
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Comments */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="arabic-text flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                آخر التعليقات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {commentsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : userComments && userComments.length > 0 ? (
                <div className="space-y-4">
                  {userComments.slice(0, 5).map((comment: any) => (
                    <div key={comment.id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          خبر #{comment.newsId}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>
                      <p className="text-sm arabic-text text-right">{comment.content}</p>
                    </div>
                  ))}
                  {userComments.length > 5 && (
                    <p className="text-sm text-muted-foreground arabic-text text-center">
                      و {userComments.length - 5} تعليقات أخرى...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground arabic-text">
                    لم تقم بإضافة أي تعليقات بعد
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorites */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  الأخبار المفضلة
                </CardTitle>
                <Link href="/favorites">
                  <Button variant="outline" size="sm" className="arabic-text">
                    عرض الكل
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {displayFavorites > 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-red-500 mb-3" />
                  <p className="text-lg font-medium arabic-text">
                    لديك {displayFavorites} خبر في المفضلة
                  </p>
                  <Link href="/favorites">
                    <Button className="mt-4 arabic-text">
                      عرض المفضلة
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground arabic-text">
                    لم تقم بإضافة أي أخبار إلى المفضلة بعد
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
