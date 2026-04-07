import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Tv2, Radio, LogIn, User, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import ScrollToTop from "@/components/ScrollToTop";
import Hls from "hls.js";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";

type LiveChannel = {
  id: number;
  name: string;
  nameEn: string | null;
  streamType: string;
  channelId: string;
  youtubeUrl: string;
  fallbackVideoId: string | null;
  m3u8Url: string | null;
  logo: string;
  logoUrl: string | null;
  color: string;
  description: string | null;
  isActive: number;
  sortOrder: number;
};

// ─── مشغل YouTube ────────────────────────────────────────────────────────────
function YouTubePlayer({ channel, onError }: { channel: LiveChannel; onError: () => void }) {
  const { data, isLoading } = trpc.videos.getLiveVideoId.useQuery(
    { channelId: channel.channelId || "" },
    { staleTime: 5 * 60 * 1000, retry: 1, enabled: !!channel.channelId }
  );
  const videoId = data?.videoId || channel.fallbackVideoId;

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-background to-muted">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
        <p className="text-muted-foreground text-sm">جاري تحميل البث المباشر...</p>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-background to-muted p-8 text-center">
        <span className="text-6xl">{channel.logo}</span>
        <div>
          <h3 className="text-xl font-bold mb-2">{channel.name}</h3>
          <p className="text-muted-foreground text-sm mb-6">البث المباشر متاح على يوتيوب مباشرة</p>
          {channel.youtubeUrl && (
            <a href={channel.youtubeUrl} target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-base">
                <Radio className="w-5 h-5 animate-pulse" />
                مشاهدة البث المباشر على يوتيوب
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <iframe
      key={`yt-${channel.id}-${videoId}`}
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
      title={`${channel.name} - بث مباشر`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      className="w-full h-full"
      onError={onError}
    />
  );
}

// ─── مشغل M3U8 / HLS ─────────────────────────────────────────────────────────
function HLSPlayer({ channel, onError }: { channel: LiveChannel; onError: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [hlsError, setHlsError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel.m3u8Url) return;

    setLoading(true);
    setHlsError(false);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(channel.m3u8Url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setHlsError(true);
          setLoading(false);
          onError();
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = channel.m3u8Url;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setHlsError(true);
        setLoading(false);
        onError();
      });
    } else {
      setHlsError(true);
      setLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.id, channel.m3u8Url]);

  if (hlsError || !channel.m3u8Url) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-background to-muted p-8 text-center">
        <span className="text-6xl">{channel.logo}</span>
        <div>
          <h3 className="text-xl font-bold mb-2">{channel.name}</h3>
          <p className="text-muted-foreground text-sm">تعذّر تحميل البث المباشر. تحقق من الرابط أو حاول لاحقاً.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 z-10">
          <Loader2 className="w-12 h-12 animate-spin text-red-500" />
          <p className="text-white/70 text-sm">جاري تحميل البث المباشر...</p>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        autoPlay
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function LiveTV() {
  const { user } = useAuth();
  const { data: dbChannels = [], isLoading: channelsLoading } = trpc.liveTV.list.useQuery();
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | null>(null);
  const [playerError, setPlayerError] = useState(false);

  useEffect(() => {
    if (dbChannels.length > 0 && !selectedChannel) {
      setSelectedChannel(dbChannels[0]);
    }
  }, [dbChannels]);

  useEffect(() => {
    if (selectedChannel) setPlayerError(false);
  }, [selectedChannel?.id]);

  function handleChannelChange(channel: LiveChannel) {
    setSelectedChannel(channel);
    setPlayerError(false);
  }

  if (channelsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-red-500" />
          <p className="text-muted-foreground">جاري تحميل القنوات...</p>
        </div>
      </div>
    );
  }

  if (!selectedChannel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">لا توجد قنوات متاحة</h2>
          <p className="text-muted-foreground">لم يتم إضافة أي قنوات بعد.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              <h1 className="text-lg font-bold">بث مباشر</h1>
              <Badge className="bg-red-600 text-white text-xs px-2 py-0.5 animate-pulse">
                🔴 LIVE
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5 border border-border">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">{user.name || "مستخدم"}</span>
                </div>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-white rounded-full px-4">
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </Button>
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground rounded-full px-3">
                <Home className="w-4 h-4" />
                <span className="text-xs">الرئيسية</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-border mx-1" />
            <Link href="/videos">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-red-500 rounded-full px-3">
                <Tv2 className="w-4 h-4" />
                <span className="text-xs">فيديو</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-border mx-1" />
            <Button variant="ghost" size="sm" className="gap-2 text-red-500 rounded-full px-3">
              <Radio className="w-4 h-4" />
              <span className="text-xs">بث مباشر</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Breaking News Ticker */}
      <div className="sticky top-[73px] z-[45]">
        <BreakingNewsTicker />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Channels Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-28">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Tv2 className="w-4 h-4" />
                القنوات الإخبارية ({dbChannels.length})
              </h3>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                {dbChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelChange(channel)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-right ${
                      selectedChannel.id === channel.id
                        ? "border-red-500/50 bg-red-500/10 shadow-sm"
                        : "border-border hover:border-red-500/50 hover:bg-muted/50"
                    }`}
                  >
                    {channel.logoUrl ? (
                      <img src={channel.logoUrl} alt={channel.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <span className="text-2xl flex-shrink-0">{channel.logo}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${selectedChannel.id === channel.id ? "text-red-500" : "text-foreground"}`}>
                        {channel.name}
                      </p>
                      {channel.nameEn && (
                        <p className="text-xs text-muted-foreground truncate">{channel.nameEn}</p>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${
                        channel.streamType === "m3u8"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {channel.streamType === "m3u8" ? "بث مباشر" : "YouTube"}
                      </span>
                    </div>
                    {selectedChannel.id === channel.id && (
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Channel info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedChannel.logo}</span>
                <div>
                  <h2 className="text-xl font-bold">{selectedChannel.name}</h2>
                  {selectedChannel.description && (
                    <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white animate-pulse">🔴 مباشر</Badge>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setPlayerError(false)}>
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">تحديث</span>
                </Button>
                {selectedChannel.streamType === "youtube" && selectedChannel.youtubeUrl && (
                  <a href={selectedChannel.youtubeUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">يوتيوب</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Player */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-border">
              {playerError ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-background to-muted p-8 text-center">
                  <span className="text-6xl">{selectedChannel.logo}</span>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedChannel.name}</h3>
                    <p className="text-muted-foreground text-sm mb-6">تعذّر تحميل البث المباشر. جرّب تحديث الصفحة.</p>
                    <Button onClick={() => setPlayerError(false)} className="gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full">
                      <RefreshCw className="w-4 h-4" />
                      إعادة المحاولة
                    </Button>
                  </div>
                </div>
              ) : selectedChannel.streamType === "m3u8" ? (
                <HLSPlayer
                  key={`hls-${selectedChannel.id}`}
                  channel={selectedChannel}
                  onError={() => setPlayerError(true)}
                />
              ) : (
                <YouTubePlayer
                  channel={selectedChannel}
                  onError={() => setPlayerError(true)}
                />
              )}
            </div>

            {/* Tip */}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              {selectedChannel.streamType === "m3u8"
                ? "يتم تشغيل البث عبر بروتوكول HLS مباشرة في المتصفح."
                : "يتم جلب أحدث فيديو من كل قناة تلقائياً. إذا لم يعمل البث، اضغط \"يوتيوب\" للمشاهدة المباشرة."}
            </div>

            {/* Other channels */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">قنوات أخرى</h3>
              <div className="flex flex-wrap gap-2">
                {dbChannels.filter((ch) => ch.id !== selectedChannel.id).map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelChange(channel)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-red-500/50 hover:bg-red-500/10 transition-all text-sm"
                  >
                    <span>{channel.logo}</span>
                    <span>{channel.name}</span>
                    {channel.streamType === "m3u8" && (
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1 rounded">بث مباشر</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}
