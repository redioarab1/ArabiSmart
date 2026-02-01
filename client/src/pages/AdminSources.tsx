import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, TestTube2, Loader2 } from "lucide-react";

export default function AdminSources() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<any>(null);
  const [testingUrl, setTestingUrl] = useState("");
  const [isTestingFeed, setIsTestingFeed] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    category: "عربية" as "SE" | "عربية",
    language: "ar" as "ar" | "sv" | "en",
    isActive: true,
  });

  const { data: sources, isLoading, refetch } = trpc.rssSources.list.useQuery();
  const createMutation = trpc.rssSources.create.useMutation();
  const updateMutation = trpc.rssSources.update.useMutation();
  const deleteMutation = trpc.rssSources.delete.useMutation();
  const toggleActiveMutation = trpc.rssSources.toggleActive.useMutation();
  const testFeedMutation = trpc.rssSources.testFeed.useMutation();

  const handleTestFeed = async (url: string) => {
    setIsTestingFeed(true);
    setTestingUrl(url);
    try {
      const result = await testFeedMutation.mutateAsync({ url });
      if (result.success) {
        toast.success(`✅ RSS صالح`, {
          description: `العنوان: ${result.title}\nعدد الأخبار: ${result.itemCount}\nآخر خبر: ${result.latestItem}`,
        });
      } else {
        toast.error(`❌ RSS غير صالح`, {
          description: result.error,
        });
      }
    } catch (error: any) {
      toast.error("❌ فشل الاختبار", {
        description: error.message,
      });
    } finally {
      setIsTestingFeed(false);
      setTestingUrl("");
    }
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      toast.success("✅ تم إضافة المصدر بنجاح");
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        url: "",
        category: "عربية",
        language: "ar",
        isActive: true,
      });
      refetch();
    } catch (error: any) {
      toast.error("❌ فشل إضافة المصدر", {
        description: error.message,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingSource) return;
    try {
      await updateMutation.mutateAsync({
        id: editingSource.id,
        ...formData,
      });
      toast.success("✅ تم تحديث المصدر بنجاح");
      setIsEditDialogOpen(false);
      setEditingSource(null);
      refetch();
    } catch (error: any) {
      toast.error("❌ فشل تحديث المصدر", {
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المصدر "${name}"؟`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("✅ تم حذف المصدر بنجاح");
      refetch();
    } catch (error: any) {
      toast.error("❌ فشل حذف المصدر", {
        description: error.message,
      });
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await toggleActiveMutation.mutateAsync({ id, isActive: !isActive });
      toast.success(isActive ? "✅ تم تعطيل المصدر" : "✅ تم تفعيل المصدر");
      refetch();
    } catch (error: any) {
      toast.error("❌ فشل تغيير حالة المصدر", {
        description: error.message,
      });
    }
  };

  const openEditDialog = (source: any) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      url: source.url,
      category: source.category,
      language: source.language,
      isActive: source.isActive === 1,
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">إدارة مصادر RSS</h1>
          <p className="text-muted-foreground mt-1">
            إضافة وتعديل وحذف مصادر الأخبار
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة مصدر جديد
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الرابط</TableHead>
              <TableHead className="text-right">الفئة</TableHead>
              <TableHead className="text-right">اللغة</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources?.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="font-medium">{source.name}</TableCell>
                <TableCell className="max-w-xs truncate" title={source.url}>
                  {source.url}
                </TableCell>
                <TableCell>{source.category}</TableCell>
                <TableCell>{source.language}</TableCell>
                <TableCell>
                  <Switch
                    checked={source.isActive === 1}
                    onCheckedChange={() =>
                      handleToggleActive(source.id, source.isActive === 1)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestFeed(source.url)}
                      disabled={isTestingFeed && testingUrl === source.url}
                    >
                      {isTestingFeed && testingUrl === source.url ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube2 className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(source)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(source.id, source.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مصدر RSS جديد</DialogTitle>
            <DialogDescription>
              أدخل معلومات المصدر الجديد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">اسم المصدر</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="مثال: BBC Arabic"
              />
            </div>
            <div>
              <Label htmlFor="url">رابط RSS</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="https://example.com/feed"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => handleTestFeed(formData.url)}
                disabled={!formData.url || isTestingFeed}
              >
                {isTestingFeed ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <TestTube2 className="w-4 h-4 ml-2" />
                )}
                اختبار الرابط
              </Button>
            </div>
            <div>
              <Label htmlFor="category">الفئة</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="عربية">عربية</SelectItem>
                  <SelectItem value="SE">سويدية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">اللغة</Label>
              <Select
                value={formData.language}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, language: value })
                }
              >
                <SelectTrigger>
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
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : null}
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل مصدر RSS</DialogTitle>
            <DialogDescription>
              تحديث معلومات المصدر
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">اسم المصدر</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-url">رابط RSS</Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-category">الفئة</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="عربية">عربية</SelectItem>
                  <SelectItem value="SE">سويدية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-language">اللغة</Label>
              <Select
                value={formData.language}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, language: value })
                }
              >
                <SelectTrigger>
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
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : null}
              تحديث
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
