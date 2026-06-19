import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Newspaper, Plus, Search, Edit2, Trash2, Eye, ExternalLink,
  RefreshCw, ChevronLeft, ChevronRight, Loader2, Filter,
  Globe, Calendar, Tag, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, string> = {
  "عربية": "bg-green-500/20 text-green-400 border-green-500/30",
  "SE": "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const LANG_LABELS: Record<string, string> = {
  ar: "عربي",
  sv: "سويدي",
  en: "إنجليزي",
};

export default function AdminNews() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    link: "",
    source: "",
    category: "عربية" as "SE" | "عربية",
    language: "ar" as "ar" | "sv" | "en",
    image: "",
  });

  const utils = trpc.useUtils();

  const { data: newsData, isLoading } = trpc.news.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    category: (categoryFilter !== "all" ? categoryFilter : undefined) as any,
    language: (langFilter !== "all" ? langFilter : undefined) as any,
  } as any);

  const addMutation = trpc.admin.addManualNews.useMutation({
    onSuccess: () => {
      toast.success("✅ تمت إضافة الخبر بنجاح");
      setAddDialogOpen(false);
      resetForm();
      utils.news.list.invalidate();
    },
    onError: (err) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const updateMutation = trpc.admin.updateNews.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث الخبر بنجاح");
      setEditDialogOpen(false);
      utils.news.list.invalidate();
    },
    onError: (err) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const deleteMutation = trpc.admin.deleteNews.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حذف الخبر بنجاح");
      setDeleteDialogOpen(false);
      utils.news.list.invalidate();
    },
    onError: (err) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const fetchMutation = trpc.admin.fetchNews.useMutation({
    onSuccess: () => {
      toast.success("✅ تم جلب الأخبار الجديدة");
      utils.news.list.invalidate();
    },
    onError: (err) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      link: "",
      source: "",
      category: "عربية",
      language: "ar",
      image: "",
    });
  };

  const openEdit = (item: any) => {
    setSelectedNews(item);
    setForm({
      title: item.title || "",
      description: item.description || "",
      link: item.link || "",
      source: item.source || "",
      category: item.category || "عربية",
      language: item.language || "ar",
      image: item.image || "",
    });
    setEditDialogOpen(true);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const items = (newsData as any)?.items ?? [];
  const total = (newsData as any)?.total ?? 0;
  const totalPages = (newsData as any)?.totalPages ?? 1;

  return (
    <AdminLayout title="إدارة الأخبار" subtitle={`إجمالي ${total.toLocaleString("ar-SA")} خبر`}>
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button
          className="bg-red-600 hover:bg-red-700 text-white gap-2"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span className="arabic-text">إضافة خبر</span>
        </Button>
        <Button
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
          onClick={() => fetchMutation.mutate()}
          disabled={fetchMutation.isPending}
        >
          {fetchMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="arabic-text">جلب أخبار جديدة</span>
        </Button>

        <div className="flex-1" />

        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="بحث في الأخبار..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 w-56 arabic-text"
          />
          <Button
            variant="outline"
            size="icon"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            onClick={handleSearch}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-600 text-white arabic-text">
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600 text-white">
            <SelectItem value="all" className="arabic-text">كل التصنيفات</SelectItem>
            <SelectItem value="عربية" className="arabic-text">عربية</SelectItem>
            <SelectItem value="SE" className="arabic-text">SE</SelectItem>
          </SelectContent>
        </Select>

        <Select value={langFilter} onValueChange={(v) => { setLangFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-600 text-white arabic-text">
            <SelectValue placeholder="اللغة" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600 text-white">
            <SelectItem value="all" className="arabic-text">كل اللغات</SelectItem>
            <SelectItem value="ar" className="arabic-text">عربي</SelectItem>
            <SelectItem value="sv" className="arabic-text">سويدي</SelectItem>
            <SelectItem value="en" className="arabic-text">إنجليزي</SelectItem>
          </SelectContent>
        </Select>

        {(search || categoryFilter !== "all" || langFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white gap-1"
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setCategoryFilter("all");
              setLangFilter("all");
              setPage(1);
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="arabic-text text-xs">مسح الفلاتر</span>
          </Button>
        )}
      </div>

      {/* News Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" />
              <p className="text-slate-400 arabic-text">جاري التحميل...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 arabic-text text-lg mb-1">لا توجد أخبار</p>
              <p className="text-slate-500 arabic-text text-sm">جرب تغيير الفلاتر أو إضافة خبر جديد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium arabic-text w-12">#</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium arabic-text">العنوان</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium arabic-text hidden md:table-cell">المصدر</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium arabic-text hidden sm:table-cell">التصنيف</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium arabic-text hidden lg:table-cell">التاريخ</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium arabic-text">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {(page - 1) * 20 + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {item.image && (
                            <img
                              src={item.image}
                              alt=""
                              className="w-10 h-10 rounded object-cover flex-shrink-0 hidden sm:block"
                              loading="lazy"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-white arabic-text line-clamp-2 font-medium leading-snug">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 arabic-text line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-400 arabic-text">{item.source}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-xs ${CATEGORY_COLORS[item.category] || "border-slate-600 text-slate-400"}`}
                        >
                          {item.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">
                          {item.publishedAt
                            ? new Date(item.publishedAt).toLocaleDateString("en-GB", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                            onClick={() => openEdit(item)}
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-slate-400 hover:text-green-400 hover:bg-green-500/10"
                              title="فتح الرابط"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => {
                              setSelectedNews(item);
                              setDeleteDialogOpen(true);
                            }}
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-400 arabic-text">
            صفحة {page} من {totalPages} ({total.toLocaleString("ar-SA")} خبر)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add News Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="arabic-text text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-400" />
              إضافة خبر جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">العنوان *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white arabic-text"
                placeholder="عنوان الخبر"
              />
            </div>
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">الوصف *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white arabic-text resize-none"
                placeholder="وصف مختصر للخبر"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">رابط الخبر *</Label>
              <Input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">المصدر *</Label>
                <Input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white arabic-text"
                  placeholder="اسم المصدر"
                />
              </div>
              <div>
                <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">رابط الصورة</Label>
                <Input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">التصنيف</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as any })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white arabic-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="عربية" className="arabic-text">عربية</SelectItem>
                    <SelectItem value="SE" className="arabic-text">SE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">اللغة</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) => setForm({ ...form, language: v as any })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white arabic-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="ar" className="arabic-text">عربي</SelectItem>
                    <SelectItem value="sv" className="arabic-text">سويدي</SelectItem>
                    <SelectItem value="en" className="arabic-text">إنجليزي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-white arabic-text"
              onClick={() => setAddDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white arabic-text"
              onClick={() => addMutation.mutate(form)}
              disabled={addMutation.isPending || !form.title || !form.description || !form.link || !form.source}
            >
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              إضافة الخبر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit News Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="arabic-text text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-400" />
              تعديل الخبر
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">العنوان</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white arabic-text"
              />
            </div>
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white arabic-text resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">المصدر</Label>
                <Input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white arabic-text"
                />
              </div>
              <div>
                <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">رابط الصورة</Label>
                <Input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">التصنيف</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as any })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white arabic-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="عربية" className="arabic-text">عربية</SelectItem>
                    <SelectItem value="SE" className="arabic-text">SE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">اللغة</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) => setForm({ ...form, language: v as any })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white arabic-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600 text-white">
                    <SelectItem value="ar" className="arabic-text">عربي</SelectItem>
                    <SelectItem value="sv" className="arabic-text">سويدي</SelectItem>
                    <SelectItem value="en" className="arabic-text">إنجليزي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-white arabic-text"
              onClick={() => setEditDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white arabic-text"
              onClick={() => updateMutation.mutate({ id: selectedNews?.id, ...form })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="arabic-text text-white">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="arabic-text text-slate-400">
              هل أنت متأكد من حذف الخبر "{selectedNews?.title?.slice(0, 50)}..."؟
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 arabic-text">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white arabic-text"
              onClick={() => deleteMutation.mutate({ id: selectedNews?.id })}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
