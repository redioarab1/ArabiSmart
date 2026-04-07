import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, Plus, Trash2, Link as LinkIcon, AlignRight, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function AdminBreakingNews() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [newText, setNewText] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newOrder, setNewOrder] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const { data: items, isLoading } = trpc.breakingNews.listAll.useQuery();

  const addMutation = trpc.breakingNews.add.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة الخبر العاجل بنجاح");
      setNewText("");
      setNewUrl("");
      setNewOrder(0);
      setIsAdding(false);
      utils.breakingNews.listAll.invalidate();
      utils.breakingNews.list.invalidate();
    },
    onError: (e) => toast.error(e.message || "فشل الإضافة"),
  });

  const deleteMutation = trpc.breakingNews.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الخبر العاجل");
      utils.breakingNews.listAll.invalidate();
      utils.breakingNews.list.invalidate();
    },
    onError: (e) => toast.error(e.message || "فشل الحذف"),
  });

  const toggleMutation = trpc.breakingNews.toggle.useMutation({
    onSuccess: () => {
      utils.breakingNews.listAll.invalidate();
      utils.breakingNews.list.invalidate();
    },
    onError: (e) => toast.error(e.message || "فشل التحديث"),
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-destructive text-lg font-bold">غير مصرح لك بالوصول</p>
          <Link href="/admin">
            <Button variant="outline" className="mt-4">العودة للوحة التحكم</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    if (!newText.trim()) {
      toast.error("نص الخبر مطلوب");
      return;
    }
    addMutation.mutate({ text: newText.trim(), url: newUrl.trim() || undefined, sortOrder: newOrder });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top bar */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-40 px-6 py-3 flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            لوحة التحكم
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-red-500 fill-red-500" />
          <h1 className="font-bold text-lg">إدارة الأخبار العاجلة</h1>
        </div>
        <Badge variant="secondary" className="mr-auto">
          {items?.length ?? 0} خبر
        </Badge>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Preview */}
        {items && items.filter(i => i.isActive).length > 0 && (
          <div className="rounded-xl overflow-hidden border border-red-200 dark:border-red-900">
            <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1.5">
              <Zap className="h-3 w-3 fill-yellow-300 text-yellow-300" />
              معاينة الشريط الحالي
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-800 dark:text-red-200 overflow-hidden">
              <div className="flex gap-4 flex-wrap">
                {items.filter(i => i.isActive).map(i => (
                  <span key={i.id} className="flex items-center gap-1">
                    <span className="text-red-400">◆</span>
                    {i.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add new item */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              إضافة خبر عاجل جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-sm">
                <AlignRight className="h-3.5 w-3.5" />
                نص الخبر <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="أدخل نص الخبر العاجل هنا..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                maxLength={500}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground text-left">{newText.length}/500</p>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-sm">
                <LinkIcon className="h-3.5 w-3.5" />
                رابط الخبر (اختياري)
              </Label>
              <Input
                placeholder="https://example.com/news/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                type="url"
                className="text-sm"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">ترتيب العرض (رقم أصغر = يظهر أولاً)</Label>
              <Input
                type="number"
                min={0}
                value={newOrder}
                onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
                className="w-28 text-sm"
              />
            </div>

            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending || !newText.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {addMutation.isPending ? "جاري الإضافة..." : "إضافة الخبر"}
            </Button>
          </CardContent>
        </Card>

        {/* Existing items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">الأخبار العاجلة الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : !items || items.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">لا توجد أخبار عاجلة حتى الآن</p>
                <p className="text-xs mt-1">أضف خبراً عاجلاً أعلاه ليظهر في الشريط المتحرك</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      item.isActive
                        ? "bg-background border-border"
                        : "bg-muted/40 border-muted opacity-60"
                    }`}
                  >
                    {/* Toggle */}
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <Switch
                        checked={!!item.isActive}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: item.id, isActive: checked })
                        }
                        className="scale-90"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {item.isActive ? "نشط" : "مخفي"}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{item.text}</p>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 truncate"
                        >
                          <LinkIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{item.url}</span>
                        </a>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          ترتيب: {item.sortOrder}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={() => {
                        if (confirm("هل أنت متأكد من حذف هذا الخبر العاجل؟")) {
                          deleteMutation.mutate({ id: item.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
