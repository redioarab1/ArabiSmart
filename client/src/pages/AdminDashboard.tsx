import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Plus, Edit, Trash2, BarChart3, Globe, RefreshCw, 
  Newspaper, TrendingUp, Users, Activity,
  Calendar, Eye, FileText
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function AdminDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddManualNewsOpen, setIsAddManualNewsOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);

  // Form states for manual news
  const [manualNewsForm, setManualNewsForm] = useState({
    title: "",
    description: "",
    link: "",
    source: "",
    category: "عربية" as "عربية" | "SE",
    language: "ar" as "ar" | "sv" | "en",
    image: "",
  });

  const { data: newsData, refetch: refetchNews } = trpc.news.list.useQuery({ page, limit: 20 });
  const { data: stats } = trpc.news.stats.useQuery();
  const { data: sources } = trpc.admin.listSources.useQuery();
  const { data: growthData } = trpc.admin.newsGrowth.useQuery();

  const addManualNewsMutation = trpc.admin.addManualNews.useMutation({
    onSuccess: () => {
      toast.success("✅ تم إضافة الخبر بنجاح");
      setIsAddManualNewsOpen(false);
      setManualNewsForm({
        title: "",
        description: "",
        link: "",
        source: "",
        category: "عربية",
        language: "ar",
        image: "",
      });
      refetchNews();
    },
    onError: (error) => {
      toast.error(`❌ خطأ: ${error.message}`);
    },
  });

  const updateNewsMutation = trpc.admin.updateNews.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث الخبر بنجاح");
      setEditingNews(null);
      refetchNews();
    },
    onError: (error) => {
      toast.error(`❌ خطأ: ${error.message}`);
    },
  });

  const deleteNewsMutation = trpc.admin.deleteNews.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حذف الخبر بنجاح");
      refetchNews();
    },
    onError: (error) => {
      toast.error(`❌ خطأ: ${error.message}`);
    },
  });

  const fetchNewsMutation = trpc.admin.fetchNews.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ تم جلب ${data.newItemsCount} خبر جديد`);
      refetchNews();
    },
    onError: (error) => {
      toast.error(`❌ خطأ: ${error.message}`);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground arabic-text">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md shadow-2xl border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl arabic-text font-bold">لوحة التحكم الإدارية</CardTitle>
            <CardDescription className="arabic-text text-base">
              يجب تسجيل الدخول للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full arabic-text text-lg py-6">
              <a href={getLoginUrl()}>تسجيل الدخول</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddManualNews = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addManualNewsMutation.mutate(manualNewsForm);
  };

  const handleUpdateNews = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateNewsMutation.mutate({
      id: editingNews.id,
      category: formData.get("category") as "عربية" | "SE",
    });
  };

  const handleDeleteNews = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الخبر؟")) {
      deleteNewsMutation.mutate({ id });
    }
  };

  const handleFetchNews = () => {
    if (confirm("هل تريد جلب أخبار جديدة من جميع المصادر؟")) {
      fetchNewsMutation.mutate();
    }
  };

  // Prepare chart data
  const categoryData: any[] = [];
  const languageData: any[] = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold arabic-text bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              لوحة التحكم الإدارية
            </h1>
            <p className="text-muted-foreground arabic-text">
              إدارة شاملة لموقع ArabiSmart News
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleFetchNews}
              disabled={fetchNewsMutation.isPending}
              className="arabic-text gap-2"
              variant="outline"
            >
              {fetchNewsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              جلب أخبار جديدة
            </Button>
            <Button
              onClick={() => setIsAddManualNewsOpen(true)}
              className="arabic-text gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة خبر يدوياً
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium arabic-text">إجمالي الأخبار</CardTitle>
              <Newspaper className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalNews.toLocaleString('ar-EG') || 0}</div>
              <p className="text-xs text-muted-foreground arabic-text mt-1">
                جميع الأخبار في النظام
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium arabic-text">المصادر النشطة</CardTitle>
              <Globe className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{sources?.filter(s => s.isActive).length || 0}</div>
              <p className="text-xs text-muted-foreground arabic-text mt-1">
                من أصل {sources?.length || 0} مصدر
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium arabic-text">أخبار عربية</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground arabic-text mt-1">
                0% من الإجمالي
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium arabic-text">أخبار سويدية</CardTitle>
              <Activity className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground arabic-text mt-1">
                0% من الإجمالي
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview" className="arabic-text gap-2">
              <BarChart3 className="h-4 w-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="news" className="arabic-text gap-2">
              <Newspaper className="h-4 w-4" />
              الأخبار
            </TabsTrigger>
            <TabsTrigger value="sources" className="arabic-text gap-2">
              <Globe className="h-4 w-4" />
              المصادر
            </TabsTrigger>
            <TabsTrigger value="analytics" className="arabic-text gap-2">
              <TrendingUp className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* News Growth Chart */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="arabic-text flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    نمو الأخبار (آخر 7 أيام)
                  </CardTitle>
                  <CardDescription className="arabic-text">
                    عدد الأخبار المضافة يومياً
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {growthData && growthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground arabic-text">
                      لا توجد بيانات كافية
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="arabic-text flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    توزيع التصنيفات
                  </CardTitle>
                  <CardDescription className="arabic-text">
                    نسبة الأخبار حسب التصنيف
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground arabic-text">
                      لا توجد بيانات
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Language Distribution */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  توزيع اللغات
                </CardTitle>
                <CardDescription className="arabic-text">
                  عدد الأخبار حسب اللغة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {languageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={languageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {languageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground arabic-text">
                    لا توجد بيانات
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="arabic-text">إدارة الأخبار</CardTitle>
                <CardDescription className="arabic-text">
                  عرض وتعديل جميع الأخبار في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {newsData?.items.map((news: any) => (
                    <div
                      key={news.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold arabic-text">{news.title}</h3>
                          <Badge variant={news.category === "عربية" ? "default" : "secondary"}>
                            {news.category}
                          </Badge>
                          <Badge variant="outline">{news.language}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground arabic-text line-clamp-2">
                          {news.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="arabic-text">المصدر: {news.source}</span>
                          <span>{new Date(news.publishedAt).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingNews(news)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNews(news.id)}
                          disabled={deleteNewsMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {newsData && (newsData.totalPages ?? 0) > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="arabic-text"
                    >
                      السابق
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      صفحة {page} من {newsData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(newsData.totalPages ?? 1, p + 1))}
                      disabled={page === newsData.totalPages}
                      className="arabic-text"
                    >
                      التالي
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="arabic-text">مصادر RSS</CardTitle>
                <CardDescription className="arabic-text">
                  إدارة مصادر الأخبار
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sources?.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold arabic-text">{source.name}</h3>
                          <Badge variant={source.isActive ? "default" : "secondary"}>
                            {source.isActive ? "نشط" : "معطل"}
                          </Badge>
                          <Badge variant="outline">{source.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-md">
                          {source.url}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="arabic-text text-lg">أخبار اليوم</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {growthData && growthData.length > 0 ? growthData[growthData.length - 1].count : 0}
                  </div>
                  <p className="text-xs text-muted-foreground arabic-text mt-1">
                    خبر جديد اليوم
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="arabic-text text-lg">متوسط يومي</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">
                    {growthData && growthData.length > 0
                      ? Math.round(growthData.reduce((sum, d) => sum + d.count, 0) / growthData.length)
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground arabic-text mt-1">
                    خبر في اليوم
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="arabic-text text-lg">أكثر تصنيف</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">
                    {categoryData.length > 0
                      ? categoryData.reduce((max, cat) => cat.value > max.value ? cat : max, categoryData[0]).name
                      : "لا يوجد"}
                  </div>
                  <p className="text-xs text-muted-foreground arabic-text mt-1">
                    التصنيف الأكثر نشاطاً
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="arabic-text">إحصائيات مفصلة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-semibold arabic-text">حسب التصنيف:</h4>
                      {categoryData.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="arabic-text">{cat.name}</span>
                          <Badge style={{ backgroundColor: cat.color }}>
                            {cat.value.toLocaleString('ar-EG')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold arabic-text">حسب اللغة:</h4>
                      {languageData.map((lang) => (
                        <div key={lang.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="arabic-text">{lang.name}</span>
                          <Badge style={{ backgroundColor: lang.color }}>
                            {lang.value.toLocaleString('ar-EG')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Manual News Dialog */}
      <Dialog open={isAddManualNewsOpen} onOpenChange={setIsAddManualNewsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="arabic-text text-2xl">إضافة خبر يدوياً</DialogTitle>
            <DialogDescription className="arabic-text">
              أضف خبراً جديداً إلى النظام يدوياً
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddManualNews} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="arabic-text">عنوان الخبر *</Label>
              <Input
                id="title"
                value={manualNewsForm.title}
                onChange={(e) => setManualNewsForm({ ...manualNewsForm, title: e.target.value })}
                required
                className="arabic-text"
                placeholder="أدخل عنوان الخبر"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="arabic-text">الوصف *</Label>
              <Textarea
                id="description"
                value={manualNewsForm.description}
                onChange={(e) => setManualNewsForm({ ...manualNewsForm, description: e.target.value })}
                required
                className="arabic-text min-h-[100px]"
                placeholder="أدخل وصف الخبر"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source" className="arabic-text">المصدر *</Label>
                <Input
                  id="source"
                  value={manualNewsForm.source}
                  onChange={(e) => setManualNewsForm({ ...manualNewsForm, source: e.target.value })}
                  required
                  className="arabic-text"
                  placeholder="مثال: الجزيرة"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link" className="arabic-text">رابط الخبر *</Label>
                <Input
                  id="link"
                  type="url"
                  value={manualNewsForm.link}
                  onChange={(e) => setManualNewsForm({ ...manualNewsForm, link: e.target.value })}
                  required
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category" className="arabic-text">التصنيف *</Label>
                <Select
                  value={manualNewsForm.category}
                  onValueChange={(value: "عربية" | "SE") => setManualNewsForm({ ...manualNewsForm, category: value })}
                >
                  <SelectTrigger className="arabic-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="عربية" className="arabic-text">عربية</SelectItem>
                    <SelectItem value="SE" className="arabic-text">SE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="arabic-text">اللغة *</Label>
                <Select
                  value={manualNewsForm.language}
                  onValueChange={(value: "ar" | "sv" | "en") => setManualNewsForm({ ...manualNewsForm, language: value })}
                >
                  <SelectTrigger className="arabic-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar" className="arabic-text">عربي</SelectItem>
                    <SelectItem value="sv" className="arabic-text">سويدي</SelectItem>
                    <SelectItem value="en" className="arabic-text">إنجليزي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="arabic-text">رابط الصورة (اختياري)</Label>
              <Input
                id="image"
                type="url"
                value={manualNewsForm.image}
                onChange={(e) => setManualNewsForm({ ...manualNewsForm, image: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddManualNewsOpen(false)}
                className="arabic-text"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={addManualNewsMutation.isPending}
                className="arabic-text"
              >
                {addManualNewsMutation.isPending ? "جاري الإضافة..." : "إضافة الخبر"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit News Dialog */}
      {editingNews && (
        <Dialog open={!!editingNews} onOpenChange={() => setEditingNews(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="arabic-text">تعديل الخبر</DialogTitle>
              <DialogDescription className="arabic-text">
                تعديل تصنيف الخبر
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateNews} className="space-y-4">
              <div className="space-y-2">
                <Label className="arabic-text">العنوان</Label>
                <p className="text-sm text-muted-foreground arabic-text">{editingNews.title}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category" className="arabic-text">التصنيف</Label>
                <Select name="category" defaultValue={editingNews.category}>
                  <SelectTrigger className="arabic-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="عربية" className="arabic-text">عربية</SelectItem>
                    <SelectItem value="SE" className="arabic-text">SE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingNews(null)}
                  className="arabic-text"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={updateNewsMutation.isPending}
                  className="arabic-text"
                >
                  {updateNewsMutation.isPending ? "جاري التحديث..." : "تحديث"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
