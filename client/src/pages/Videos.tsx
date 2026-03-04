import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  Tv2,
  RefreshCw,
  ArrowRight,
  Clock,
  X,
  LogIn,
  User,
  Radio,
  Home,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import ScrollToTop from "@/components/ScrollToTop";

export default function Videos() {
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{
    videoId: string;
    title: string;
    channelName?: string | null;
  } | null>(null);

  const { data, isLoading, refetch } = trpc.videos.list.useQuery({
    page: 1,
    limit: 30,
    channelName: selectedChannel || undefined,
  });

  const { data: channelsData } = trpc.videos.channels.useQuery();

  const fetchMutation = trpc.videos.fetchYouTube.useMutation({
    onSuccess: (result) => {
      toast.success(`تم جلب ${result.count} فيديو جديد`);
      refetch();
    },
    onError: () => {
      toast.error("فشل جلب الفيديوهات");
    },
  });

  const videoList = data?.videos || [];

  function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top row: title + user actions */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Tv2 className="w-5 h-5 text-red-500" />
              <h1 className="text-lg font-bold">مركز الفيديو</h1>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchMutation.mutate()}
                    disabled={fetchMutation.isPending}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${fetchMutation.isPending ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">تحديث</span>
                  </Button>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5 border border-border">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-medium hidden sm:inline">{user.name || "مستخدم"}</span>
                  </div>
                </>
              ) : (
                <a href={getLoginUrl()}>
                  <Button
                    size="sm"
                    className="gap-2 bg-red-600 hover:bg-red-700 text-white rounded-full px-4"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Navigation tabs: 3 icons */}
          <div className="flex items-center gap-1">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground rounded-full px-3"
              >
                <Home className="w-4 h-4" />
                <span className="text-xs">الرئيسية</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-border mx-1" />
            <Link href="/videos">
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-red-600 hover:bg-red-700 text-white rounded-full px-3"
              >
                <Tv2 className="w-4 h-4" />
                <span className="text-xs">فيديو</span>
              </Button>
            </Link>
            <Link href="/live">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-red-500 rounded-full px-3"
              >
                <Radio className="w-4 h-4" />
                <span className="text-xs">بث مباشر</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Channel Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={selectedChannel === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedChannel(null)}
            className="rounded-full"
          >
            الكل
          </Button>
          {(channelsData || []).map((ch) => (
            <Button
              key={ch.id}
              variant={selectedChannel === ch.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChannel(ch.name === selectedChannel ? null : ch.name)}
              className="rounded-full"
            >
              {ch.name}
            </Button>
          ))}
        </div>

        {/* Videos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : videoList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <Tv2 className="w-16 h-16 text-muted-foreground opacity-40" />
            <div>
              <p className="text-lg font-medium text-muted-foreground">لا توجد فيديوهات بعد</p>
              <p className="text-sm text-muted-foreground mt-1">
                {user ? "اضغط على زر التحديث لجلب أحدث الفيديوهات" : "سيتم تحديث الفيديوهات تلقائياً"}
              </p>
            </div>
            {user && (
              <Button onClick={() => fetchMutation.mutate()} disabled={fetchMutation.isPending} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${fetchMutation.isPending ? "animate-spin" : ""}`} />
                جلب الفيديوهات
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videoList.map((video) => (
              <Card
                key={video.id}
                className="group cursor-pointer overflow-hidden border border-border hover:border-red-500/50 transition-all duration-200 hover:shadow-lg"
                onClick={() =>
                  setSelectedVideo({
                    videoId: video.videoId,
                    title: video.title,
                    channelName: video.channelName,
                  })
                }
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Tv2 className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                      <Play className="w-5 h-5 text-white fill-white mr-[-2px]" />
                    </div>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium line-clamp-2 leading-snug mb-2 text-foreground">
                    {video.title}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    {video.channelName && (
                      <Badge variant="secondary" className="text-xs truncate max-w-[120px]">
                        {video.channelName}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden" dir="rtl">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <DialogTitle className="text-base font-semibold leading-snug text-right">
                  {selectedVideo?.title}
                </DialogTitle>
                {selectedVideo?.channelName && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedVideo.channelName}</p>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="p-4 pt-3">
            {selectedVideo && (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}
            <div className="flex justify-end mt-3">
              <a
                href={`https://www.youtube.com/watch?v=${selectedVideo?.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                مشاهدة على YouTube ↗
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScrollToTop />
    </div>
  );
}
