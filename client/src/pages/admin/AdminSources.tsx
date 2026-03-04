import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Rss, Plus, Edit2, Trash2, RefreshCw, Loader2,
  CheckCircle2, XCircle, Globe, AlertCircle, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSources() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    url: "",
    category: "عربية" as "SE" | "عربية",
    language: "ar" as "ar" | "sv" | "en",
  });

  const utils = trpc.useUtils();

  const { data: sources, isLoading } = trpc.admin.listSources.useQuery();

  const addMutation = trpc.admin.addSource.useMutation({
    onSuccess: () => {
      toast.success("✅ تمت إضافة المصدر بنجاح");
      setAddDialogOpen(false);
      resetForm();
      utils.admin.listSources.invalidate();
    },
    onError: (err: any) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const updateMutation = trpc.admin.updateSource.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تحديث المصدر بنجاح");
      setEditDialogOpen(false);
      utils.admin.listSources.invalidate();
    },
    onError: (err: any) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const deleteMutation = trpc.admin.deleteSource.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حذف المصدر بنجاح");
      setDeleteDialogOpen(false);
      utils.admin.listSources.invalidate();
    },
    onError: (err: any) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const toggleMutation = trpc.admin.toggleSource.useMutation({
    onSuccess: () => {
      utils.admin.listSources.invalidate();
    },
    onError: (err: any) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const fetchMutation = trpc.admin.fetchNews.useMutation({
    onSuccess: () => toast.success("✅ تم جلب الأخبار من جميع المصادر"),
    onError: (err: any) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const resetForm = () => {
    setForm({ name: "", url: "", category: "عربية", language: "ar" });
  };

  const openEdit = (source: any) => {
    setSelectedSource(source);
    setForm({
      name: source.name || "",
      url: source.url || "",
      category: source.category || "عربية",
      language: source.language || "ar",
    });
    setEditDialogOpen(true);
  };

  const activeCount = sources?.filter((s: any) => s.isActive).length ?? 0;
  const totalCount = sources?.length ?? 0;

  return (
    <AdminLayout
      title="مصادر RSS"
      subtitle={`${activeCount} مصدر نشط من أصل ${totalCount}`}
    >
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button
          className="bg-red-600 hover:bg-red-700 text-white gap-2"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span className="arabic-text">إضافة مصدر</span>
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
          <span className="arabic-text">جلب من جميع المصادر</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{totalCount}</p>
            <p className="text-xs text-slate-400 arabic-text mt-1">إجمالي المصادر</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-green-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{activeCount}</p>
            <p className="text-xs text-slate-400 arabic-text mt-1">مصادر نشطة</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-red-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{totalCount - activeCount}</p>
            <p className="text-xs text-slate-400 arabic-text mt-1">مصادر معطلة</p>
          </CardContent>
        </Card>
      </div>

      {/* Sources List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
            <Rss className="w-4 h-4 text-orange-400" />
            قائمة مصادر RSS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" />
              <p className="text-slate-400 arabic-text">جاري التحميل...</p>
            </div>
          ) : !sources || sources.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 arabic-text">لا توجد مصادر RSS</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {sources.map((source: any) => (
                <div key={source.id} className="px-4 py-3 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${source.isActive ? "bg-green-400" : "bg-slate-600"}`} />

                    {/* Source info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-white arabic-text font-medium">{source.name}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            source.category === "عربية"
                              ? "border-green-500/30 text-green-400"
                              : "border-blue-500/30 text-blue-400"
                          }`}
                        >
                          {source.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                          {source.language === "ar" ? "عربي" : source.language === "sv" ? "سويدي" : "إنجليزي"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate" dir="ltr">{source.url}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs gap-1 h-7 ${
                          source.isActive
                            ? "text-green-400 hover:text-red-400 hover:bg-red-500/10"
                            : "text-slate-500 hover:text-green-400 hover:bg-green-500/10"
                        }`}
                        onClick={() => toggleMutation.mutate({ id: source.id, isActive: !source.isActive })}
                        disabled={toggleMutation.isPending}
                      >
                        {source.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="arabic-text hidden sm:inline">نشط</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span className="arabic-text hidden sm:inline">معطل</span>
                          </>
                        )}
                      </Button>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-slate-400 hover:text-blue-400"
                          title="فتح الرابط"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-slate-400 hover:text-yellow-400"
                        onClick={() => openEdit(source)}
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-slate-400 hover:text-red-400"
                        onClick={() => {
                          setSelectedSource(source);
                          setDeleteDialogOpen(true);
                        }}
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Source Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="arabic-text text-white flex items-center gap-2">
              <Rss className="w-5 h-5 text-orange-400" />
              إضافة مصدر RSS جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">اسم المصدر *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white arabic-text"
                placeholder="مثال: قناة الجزيرة"
              />
            </div>
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">رابط RSS *</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="https://..."
                dir="ltr"
              />
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
              className="bg-orange-600 hover:bg-orange-700 text-white arabic-text"
              onClick={() => addMutation.mutate(form)}
              disabled={addMutation.isPending || !form.name || !form.url}
            >
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              إضافة المصدر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Source Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="arabic-text text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-yellow-400" />
              تعديل المصدر
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">اسم المصدر</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white arabic-text"
              />
            </div>
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">رابط RSS</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                dir="ltr"
              />
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
              className="bg-yellow-600 hover:bg-yellow-700 text-white arabic-text"
              onClick={() => updateMutation.mutate({ id: selectedSource?.id, ...form })}
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
              هل أنت متأكد من حذف مصدر "{selectedSource?.name}"؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 arabic-text">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white arabic-text"
              onClick={() => deleteMutation.mutate({ id: selectedSource?.id })}
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
