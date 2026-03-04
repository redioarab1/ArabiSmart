import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Radio,
  Youtube,
  Tv,
  GripVertical,
  Eye,
  EyeOff,
  AlertCircle,
  Link,
} from "lucide-react";

type Channel = {
  id: number;
  name: string;
  nameEn: string | null;
  streamType: string;
  channelId: string;
  youtubeUrl: string;
  fallbackVideoId: string | null;
  m3u8Url: string | null;
  logo: string;
  color: string;
  description: string | null;
  isActive: number;
  sortOrder: number;
};

const EMOJI_OPTIONS = ["📺", "🎙️", "📡", "🌐", "🔴", "🌙", "🗽", "🇫🇷", "🇩🇪", "🌍", "📻", "🎬", "🎥", "📹", "🔵", "🟢", "🟡", "🟠"];
const COLOR_OPTIONS = [
  "#ef4444", "#00A86B", "#C8102E", "#0057A8", "#BB1919",
  "#1A5276", "#2980B9", "#003189", "#C0392B", "#1ABC9C",
  "#004B7F", "#8B5CF6", "#F59E0B", "#10B981", "#6366F1",
];

const emptyForm = {
  name: "",
  nameEn: "",
  streamType: "youtube" as "youtube" | "m3u8",
  channelId: "",
  youtubeUrl: "",
  fallbackVideoId: "",
  m3u8Url: "",
  logo: "📺",
  color: "#ef4444",
  description: "",
  sortOrder: 0,
};

export default function AdminLiveTV() {
  const utils = trpc.useUtils();
  const { data: channels = [], isLoading } = trpc.liveTV.listAll.useQuery();

  const [showDialog, setShowDialog] = useState(false);
  const [editChannel, setEditChannel] = useState<Channel | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const addMutation = trpc.liveTV.add.useMutation({
    onSuccess: () => {
      utils.liveTV.listAll.invalidate();
      utils.liveTV.list.invalidate();
      toast.success("تمت إضافة القناة بنجاح");
      setShowDialog(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(`خطأ: ${e.message}`),
  });

  const updateMutation = trpc.liveTV.update.useMutation({
    onSuccess: () => {
      utils.liveTV.listAll.invalidate();
      utils.liveTV.list.invalidate();
      toast.success("تم تحديث القناة بنجاح");
      setShowDialog(false);
      setEditChannel(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(`خطأ: ${e.message}`),
  });

  const deleteMutation = trpc.liveTV.delete.useMutation({
    onSuccess: () => {
      utils.liveTV.listAll.invalidate();
      utils.liveTV.list.invalidate();
      toast.success("تم حذف القناة بنجاح");
      setDeleteId(null);
    },
    onError: (e) => toast.error(`خطأ: ${e.message}`),
  });

  const toggleMutation = trpc.liveTV.toggle.useMutation({
    onSuccess: () => {
      utils.liveTV.listAll.invalidate();
      utils.liveTV.list.invalidate();
    },
    onError: (e) => toast.error(`خطأ: ${e.message}`),
  });

  const openAdd = () => {
    setEditChannel(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (ch: Channel) => {
    setEditChannel(ch);
    setForm({
      name: ch.name,
      nameEn: ch.nameEn || "",
      streamType: (ch.streamType as "youtube" | "m3u8") || "youtube",
      channelId: ch.channelId || "",
      youtubeUrl: ch.youtubeUrl || "",
      fallbackVideoId: ch.fallbackVideoId || "",
      m3u8Url: ch.m3u8Url || "",
      logo: ch.logo || "📺",
      color: ch.color || "#ef4444",
      description: ch.description || "",
      sortOrder: ch.sortOrder || 0,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("اسم القناة مطلوب");
      return;
    }
    if (form.streamType === "youtube" && !form.youtubeUrl.trim()) {
      toast.error("رابط YouTube مطلوب لقنوات YouTube");
      return;
    }
    if (form.streamType === "m3u8" && !form.m3u8Url.trim()) {
      toast.error("رابط M3U8 مطلوب لقنوات البث المباشر");
      return;
    }

    if (editChannel) {
      updateMutation.mutate({
        id: editChannel.id,
        name: form.name,
        nameEn: form.nameEn || undefined,
        streamType: form.streamType,
        channelId: form.channelId || undefined,
        youtubeUrl: form.youtubeUrl || undefined,
        fallbackVideoId: form.fallbackVideoId || null,
        m3u8Url: form.m3u8Url || null,
        logo: form.logo,
        color: form.color,
        description: form.description || undefined,
        sortOrder: form.sortOrder,
      });
    } else {
      addMutation.mutate({
        name: form.name,
        nameEn: form.nameEn || undefined,
        streamType: form.streamType,
        channelId: form.channelId || undefined,
        youtubeUrl: form.youtubeUrl || undefined,
        fallbackVideoId: form.fallbackVideoId || undefined,
        m3u8Url: form.m3u8Url || undefined,
        logo: form.logo,
        color: form.color,
        description: form.description || undefined,
        sortOrder: form.sortOrder,
      });
    }
  };

  const activeCount = channels.filter((c) => c.isActive === 1).length;
  const youtubeCount = channels.filter((c) => c.streamType === "youtube").length;
  const m3u8Count = channels.filter((c) => c.streamType === "m3u8").length;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            إدارة البث المباشر
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة قنوات البث المباشر – يدعم YouTube وروابط M3U8
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4" />
          إضافة قناة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Tv className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{channels.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي القنوات</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">قنوات نشطة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Youtube className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{youtubeCount}</p>
              <p className="text-xs text-muted-foreground">قنوات YouTube</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Link className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{m3u8Count}</p>
              <p className="text-xs text-muted-foreground">قنوات M3U8</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Table */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">قائمة القنوات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : channels.length === 0 ? (
            <div className="p-8 text-center">
              <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">لا توجد قنوات بعد. أضف أول قناة!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-right p-3 font-medium text-muted-foreground w-8"></th>
                    <th className="text-right p-3 font-medium text-muted-foreground">القناة</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">النوع</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">الرابط</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">الترتيب</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((ch) => (
                    <tr key={ch.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-muted-foreground">
                        <GripVertical className="w-4 h-4" />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: ch.color + "20", border: `1px solid ${ch.color}40` }}
                          >
                            {ch.logo}
                          </div>
                          <div>
                            <p className="font-medium">{ch.name}</p>
                            {ch.nameEn && <p className="text-xs text-muted-foreground">{ch.nameEn}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {ch.streamType === "youtube" ? (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1">
                            <Youtube className="w-3 h-3" />
                            YouTube
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">
                            <Link className="w-3 h-3" />
                            M3U8
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          {ch.streamType === "m3u8" ? ch.m3u8Url : ch.youtubeUrl}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className="text-muted-foreground">{ch.sortOrder}</span>
                      </td>
                      <td className="p-3">
                        <Switch
                          checked={ch.isActive === 1}
                          onCheckedChange={(v) => toggleMutation.mutate({ id: ch.id, isActive: v })}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                            onClick={() => openEdit(ch)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => setDeleteId(ch.id)}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) { setEditChannel(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              {editChannel ? "تعديل القناة" : "إضافة قناة جديدة"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Stream Type */}
            <div className="space-y-2">
              <Label>نوع البث</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, streamType: "youtube" }))}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    form.streamType === "youtube"
                      ? "border-red-500 bg-red-500/10 text-red-500"
                      : "border-border hover:border-red-500/50"
                  }`}
                >
                  <Youtube className="w-5 h-5" />
                  <div className="text-right">
                    <p className="font-medium text-sm">YouTube</p>
                    <p className="text-xs text-muted-foreground">قناة يوتيوب</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, streamType: "m3u8" }))}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    form.streamType === "m3u8"
                      ? "border-blue-500 bg-blue-500/10 text-blue-500"
                      : "border-border hover:border-blue-500/50"
                  }`}
                >
                  <Link className="w-5 h-5" />
                  <div className="text-right">
                    <p className="font-medium text-sm">M3U8</p>
                    <p className="text-xs text-muted-foreground">رابط بث مباشر</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اسم القناة (عربي) *</Label>
                <Input
                  placeholder="مثال: قناة الجزيرة"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  placeholder="Al Jazeera"
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                />
              </div>
            </div>

            {/* YouTube specific fields */}
            {form.streamType === "youtube" && (
              <>
                <div className="space-y-2">
                  <Label>رابط YouTube *</Label>
                  <Input
                    placeholder="https://www.youtube.com/@channel/live"
                    value={form.youtubeUrl}
                    onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">رابط صفحة البث المباشر على يوتيوب</p>
                </div>
                <div className="space-y-2">
                  <Label>معرّف القناة (Channel ID)</Label>
                  <Input
                    placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={form.channelId}
                    onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">اختياري – يُستخدم لجلب أحدث فيديو تلقائياً</p>
                </div>
                <div className="space-y-2">
                  <Label>معرّف فيديو احتياطي (Fallback Video ID)</Label>
                  <Input
                    placeholder="dQw4w9WgXcQ"
                    value={form.fallbackVideoId}
                    onChange={(e) => setForm((f) => ({ ...f, fallbackVideoId: e.target.value }))}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">اختياري – يُعرض عند عدم توفر بث مباشر</p>
                </div>
              </>
            )}

            {/* M3U8 specific fields */}
            {form.streamType === "m3u8" && (
              <div className="space-y-2">
                <Label>رابط البث M3U8 *</Label>
                <Input
                  placeholder="https://example.com/stream/live.m3u8"
                  value={form.m3u8Url}
                  onChange={(e) => setForm((f) => ({ ...f, m3u8Url: e.target.value }))}
                  dir="ltr"
                />
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-400">
                    تأكد أن الرابط ينتهي بـ <code className="font-mono">.m3u8</code> وأن الخادم يدعم CORS.
                    روابط HTTPS مُوصى بها.
                  </p>
                </div>
              </div>
            )}

            {/* Logo & Color */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الأيقونة</Label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-border rounded-lg max-h-24 overflow-y-auto">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, logo: emoji }))}
                      className={`w-8 h-8 rounded flex items-center justify-center text-lg transition-all ${
                        form.logo === emoji ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>لون القناة</Label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-border rounded-lg">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color }))}
                      className={`w-7 h-7 rounded-full transition-all ${
                        form.color === color ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#ef4444"
                  dir="ltr"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>وصف القناة</Label>
              <Textarea
                placeholder="وصف مختصر للقناة..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">الأرقام الأصغر تظهر أولاً</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button
              onClick={handleSubmit}
              disabled={addMutation.isPending || updateMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {addMutation.isPending || updateMutation.isPending ? "جاري الحفظ..." : editChannel ? "حفظ التغييرات" : "إضافة القناة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              تأكيد الحذف
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            هل أنت متأكد من حذف هذه القناة؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف القناة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
