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
import { toast } from "sonner";
import { Plus, Edit, Trash2, BarChart3, Globe, RefreshCw } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function AdminDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);

  const { data: newsData, refetch } = trpc.news.list.useQuery({ page, limit: 20 });
  const { data: stats } = trpc.news.stats.useQuery();

  const addNewsMutation = trpc.admin.addNews.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الخبر بنجاح");
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const updateNewsMutation = trpc.admin.updateNews.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الخبر بنجاح");
      setEditingNews(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const deleteNewsMutation = trpc.admin.deleteNews.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الخبر بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl arabic-text">لوحة التحكم الإدارية</CardTitle>
            <CardDescription className="arabic-text">
              يجب تسجيل الدخول للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full arabic-text">
              <a href={getLoginUrl()}>تسجيل الدخول</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddNews = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addNewsMutation.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      content: formData.get("content") as string,
      link: formData.get("link") as string,
      image: formData.get("image") as string,
      source: formData.get("source") as string,
      category: formData.get("category") as "SE" | "عربية",
      language: formData.get("language") as "ar" | "sv" | "en",
    });
  };

  const handleUpdateNews = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateNewsMutation.mutate({
      id: editingNews.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      content: formData.get("content") as string,
      image: formData.get("image") as string,
      source: formData.get("source") as string,
      category: formData.get("category") as "SE" | "عربية",
      language: formData.get("language") as "ar" | "sv" | "en",
    });
  };

  const handleDeleteNews = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الخبر؟")) {
      deleteNewsMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20" dir="rtl">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-primary arabic-text">لوحة التحكم</h1>
                <p className="text-sm text-muted-foreground arabic-text">إدارة الأخبار</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm arabic-text">مرحباً، {user?.name}</span>
              <Button variant="outline" size="sm" asChild>
                <a href="/">الصفحة الرئيسية</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="py-8 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium arabic-text">إجمالي الأخبار</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalNews || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium arabic-text">المصادر النشطة</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeSources || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium arabic-text">آخر تحديث</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {stats?.lastUpdate
                    ? new Date(stats.lastUpdate).toLocaleString("ar-SA")
                    : "لا يوجد"}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* News Management */}
      <section className="py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold arabic-text">إدارة الأخبار</h2>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="arabic-text">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة خبر جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="arabic-text">إضافة خبر جديد</DialogTitle>
                  <DialogDescription className="arabic-text">
                    أدخل تفاصيل الخبر الجديد
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddNews} className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="arabic-text">العنوان *</Label>
                    <Input id="title" name="title" required className="arabic-text" />
                  </div>
                  <div>
                    <Label htmlFor="description" className="arabic-text">الوصف</Label>
                    <Textarea id="description" name="description" className="arabic-text" />
                  </div>
                  <div>
                    <Label htmlFor="content" className="arabic-text">المحتوى</Label>
                    <Textarea id="content" name="content" rows={5} className="arabic-text" />
                  </div>
                  <div>
                    <Label htmlFor="link" className="arabic-text">الرابط *</Label>
                    <Input id="link" name="link" type="url" required />
                  </div>
                  <div>
                    <Label htmlFor="image" className="arabic-text">رابط الصورة</Label>
                    <Input id="image" name="image" type="url" />
                  </div>
                  <div>
                    <Label htmlFor="source" className="arabic-text">المصدر *</Label>
                    <Input id="source" name="source" required className="arabic-text" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="arabic-text">الفئة *</Label>
                      <Select name="category" required>
                        <SelectTrigger className="arabic-text">
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SE">أخبار السويد</SelectItem>
                          <SelectItem value="عربية">أخبار عربية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language" className="arabic-text">اللغة *</Label>
                      <Select name="language" required>
                        <SelectTrigger className="arabic-text">
                          <SelectValue placeholder="اختر اللغة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">عربي</SelectItem>
                          <SelectItem value="sv">سويدي</SelectItem>
                          <SelectItem value="en">إنجليزي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={addNewsMutation.isPending} className="arabic-text">
                      {addNewsMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* News List */}
          <div className="space-y-4">
            {newsData?.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{item.category}</Badge>
                        <Badge variant="outline">{item.source}</Badge>
                        {item.isManual === 1 && (
                          <Badge variant="secondary" className="arabic-text">يدوي</Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-2 arabic-text">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2 arabic-text">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.publishedAt).toLocaleString("ar-SA")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingNews(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteNews(item.id)}
                        disabled={deleteNewsMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {newsData && newsData.totalPages && newsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
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
        </div>
      </section>

      {/* Edit Dialog */}
      {editingNews && (
        <Dialog open={!!editingNews} onOpenChange={() => setEditingNews(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="arabic-text">تعديل الخبر</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateNews} className="space-y-4">
              <div>
                <Label htmlFor="edit-title" className="arabic-text">العنوان</Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={editingNews.title}
                  className="arabic-text"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="arabic-text">الوصف</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingNews.description || ""}
                  className="arabic-text"
                />
              </div>
              <div>
                <Label htmlFor="edit-content" className="arabic-text">المحتوى</Label>
                <Textarea
                  id="edit-content"
                  name="content"
                  defaultValue={editingNews.content || ""}
                  rows={5}
                  className="arabic-text"
                />
              </div>
              <div>
                <Label htmlFor="edit-image" className="arabic-text">رابط الصورة</Label>
                <Input
                  id="edit-image"
                  name="image"
                  type="url"
                  defaultValue={editingNews.image || ""}
                />
              </div>
              <div>
                <Label htmlFor="edit-source" className="arabic-text">المصدر</Label>
                <Input
                  id="edit-source"
                  name="source"
                  defaultValue={editingNews.source}
                  className="arabic-text"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category" className="arabic-text">الفئة</Label>
                  <Select name="category" defaultValue={editingNews.category}>
                    <SelectTrigger className="arabic-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SE">أخبار السويد</SelectItem>
                      <SelectItem value="عربية">أخبار عربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-language" className="arabic-text">اللغة</Label>
                  <Select name="language" defaultValue={editingNews.language}>
                    <SelectTrigger className="arabic-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">عربي</SelectItem>
                      <SelectItem value="sv">سويدي</SelectItem>
                      <SelectItem value="en">إنجليزي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateNewsMutation.isPending} className="arabic-text">
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
