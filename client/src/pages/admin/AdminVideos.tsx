import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Video, Plus, Search, Trash2, ExternalLink, RefreshCw,
  ChevronLeft, ChevronRight, Loader2, Play, Youtube,
  AlertCircle, Tv2
} from "lucide-react";
import { toast } from "sonner";

export default function AdminVideos() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  const [form, setForm] = useState({
    videoId: "",
    title: "",
    channelName: "",
    thumbnail: "",
  });

  const utils = trpc.useUtils();

  const { data: videosData, isLoading } = trpc.videos.list.useQuery({
    page,
    limit: 20,
    channelName: search || undefined,
  } as any);

  const addMutation = trpc.videos.addManual.useMutation({
    onSuccess: () => {
      toast.success("✅ تمت إضافة الفيديو بنجاح");
      setAddDialogOpen(false);
      resetForm();
      utils.videos.list.invalidate();
    },
    onError: (err: any) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const deleteMutation = trpc.admin.deleteVideo.useMutation({
    onSuccess: () => {
      toast.success("✅ تم حذف الفيديو بنجاح");
      setDeleteDialogOpen(false);
      utils.videos.list.invalidate();
    },
    onError: (err: any) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const fetchMutation = trpc.videos.fetchYouTube.useMutation({
    onSuccess: () => {
      toast.success("✅ تم جلب الفيديوهات الجديدة");
      utils.videos.list.invalidate();
    },
    onError: (err: any) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const resetForm = () => {
    setForm({ videoId: "", title: "", channelName: "", thumbnail: "" });
  };

  // Extract YouTube video ID from URL or ID
  const extractVideoId = (input: string): string => {
    const urlMatch = input.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return urlMatch ? urlMatch[1] : input.trim();
  };

  const items = (videosData as any)?.videos ?? [];
  const total = (videosData as any)?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <AdminLayout title="إدارة الفيديوهات" subtitle={`إجمالي ${total.toLocaleString("ar-SA")} فيديو`}>
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button
          className="bg-red-600 hover:bg-red-700 text-white gap-2"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span className="arabic-text">إضافة فيديو</span>
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
          <span className="arabic-text">جلب فيديوهات جديدة</span>
        </Button>

        <div className="flex-1" />

        <div className="flex gap-2">
          <Input
            placeholder="بحث بالقناة..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(searchInput);
                setPage(1);
              }
            }}
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 w-48 arabic-text"
          />
          <Button
            variant="outline"
            size="icon"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            onClick={() => { setSearch(searchInput); setPage(1); }}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Youtube className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 arabic-text text-lg mb-2">لا توجد فيديوهات</p>
          <p className="text-slate-500 arabic-text text-sm">أضف فيديوهات يدوياً أو اجلب من YouTube</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((video: any) => (
            <Card key={video.id} className="bg-slate-800 border-slate-700 overflow-hidden group hover:border-slate-600 transition-all">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Youtube className="w-10 h-10 text-slate-600" />
                  </div>
                )}
                {/* Play overlay */}
                <div
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => setPreviewVideo(video.videoId)}
                >
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              <CardContent className="p-3">
                <p className="text-sm text-white arabic-text line-clamp-2 font-medium mb-2 leading-snug">
                  {video.title}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tv2 className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs text-slate-400 arabic-text truncate max-w-[100px]">
                      {video.channelName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={`https://youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-slate-400 hover:text-green-400"
                        title="فتح في YouTube"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 text-slate-400 hover:text-red-400"
                      onClick={() => {
                        setSelectedVideo(video);
                        setDeleteDialogOpen(true);
                      }}
                      title="حذف"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {video.publishedAt && (
                  <p className="text-xs text-slate-600 mt-1.5">
                    {new Date(video.publishedAt).toLocaleDateString("ar-SA")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-400 arabic-text">
            صفحة {page} من {totalPages}
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

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="w-full max-w-3xl aspect-video bg-black rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${previewVideo}?autoplay=1`}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          </div>
        </div>
      )}

      {/* Add Video Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="arabic-text text-white flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-400" />
              إضافة فيديو من YouTube
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">
                رابط YouTube أو معرّف الفيديو *
              </Label>
              <Input
                value={form.videoId}
                onChange={(e) => setForm({ ...form, videoId: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="https://youtube.com/watch?v=... أو dQw4w9WgXcQ"
                dir="ltr"
              />
              <p className="text-xs text-slate-500 mt-1 arabic-text">
                يمكنك لصق رابط YouTube الكامل أو معرّف الفيديو مباشرة
              </p>
            </div>
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">عنوان الفيديو *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white arabic-text"
                placeholder="عنوان الفيديو"
              />
            </div>
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">اسم القناة *</Label>
              <Input
                value={form.channelName}
                onChange={(e) => setForm({ ...form, channelName: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white arabic-text"
                placeholder="مثال: قناة الجزيرة"
              />
            </div>
            <div>
              <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">رابط الصورة المصغرة</Label>
              <Input
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="اتركه فارغاً لاستخدام صورة YouTube التلقائية"
                dir="ltr"
              />
            </div>

            {/* Preview */}
            {form.videoId && (
              <div className="rounded-lg overflow-hidden bg-slate-900 aspect-video">
                <img
                  src={`https://img.youtube.com/vi/${extractVideoId(form.videoId)}/mqdefault.jpg`}
                  alt="معاينة"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
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
              onClick={() => addMutation.mutate({
                videoId: extractVideoId(form.videoId),
                title: form.title,
                channelName: form.channelName,
                thumbnail: form.thumbnail || `https://img.youtube.com/vi/${extractVideoId(form.videoId)}/mqdefault.jpg`,
              })}
              disabled={addMutation.isPending || !form.videoId || !form.title || !form.channelName}
            >
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              إضافة الفيديو
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
              هل أنت متأكد من حذف الفيديو "{selectedVideo?.title?.slice(0, 50)}"؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 arabic-text">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white arabic-text"
              onClick={() => deleteMutation.mutate({ id: selectedVideo?.id })}
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
