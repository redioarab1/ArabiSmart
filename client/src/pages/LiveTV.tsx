import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Tv2, Radio, LogIn, User, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import ScrollToTop from "@/components/ScrollToTop";

// القنوات الإخبارية العربية مع Channel IDs لجلب Video ID تلقائياً
const LIVE_CHANNELS = [
  {
    id: "aljazeeraarabic",
    name: "قناة الجزيرة",
    nameEn: "Al Jazeera Arabic",
    channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
    youtubeUrl: "https://www.youtube.com/aljazeeraarabic/live",
    fallbackVideoId: "hBkJ1Ve0CYc",
    logo: "🎙️",
    color: "#00A86B",
    description: "قناة الجزيرة الإخبارية العربية – بث مباشر على مدار الساعة",
  },
  {
    id: "alarabiya",
    name: "قناة العربية",
    nameEn: "Al Arabiya",
    channelId: "UCrBcmSIvhKlWMhKGqFhFMtg",
    youtubeUrl: "https://www.youtube.com/c/AlArabiya/live",
    fallbackVideoId: "jJqcFN-hjGg",
    logo: "📡",
    color: "#C8102E",
    description: "قناة العربية الإخبارية – بث مباشر 24 ساعة",
  },
  {
    id: "skynewsarabia",
    name: "سكاي نيوز عربية",
    nameEn: "Sky News Arabia",
    channelId: "UCeIFRRMGJjQoKVMVQiAqGGA",
    youtubeUrl: "https://www.youtube.com/watch?v=U--OjmpjF5o",
    fallbackVideoId: "U--OjmpjF5o",
    logo: "🌐",
    color: "#0057A8",
    description: "سكاي نيوز عربية – أخبار عاجلة وتغطيات مباشرة",
  },
  {
    id: "bbcarabic",
    name: "بي بي سي عربي",
    nameEn: "BBC News Arabic",
    channelId: "UC8Sp1qD1goeU5ejP0eK7wYQ",
    youtubeUrl: "https://www.youtube.com/channel/UC8Sp1qD1goeU5ejP0eK7wYQ/live",
    fallbackVideoId: null,
    logo: "🔴",
    color: "#BB1919",
    description: "بي بي سي عربي – أخبار موثوقة ومتنوعة",
  },
  {
    id: "almayadeen",
    name: "قناة الميادين",
    nameEn: "Al Mayadeen",
    channelId: "UCpXEVrHWM1stnAdBNLP5ZHA",
    youtubeUrl: "https://www.youtube.com/channel/UCpXEVrHWM1stnAdBNLP5ZHA/live",
    fallbackVideoId: null,
    logo: "🌙",
    color: "#1A5276",
    description: "قناة الميادين – تغطية إخبارية شاملة من لبنان",
  },
  {
    id: "alhurra",
    name: "قناة الحرة",
    nameEn: "Alhurra",
    channelId: "UCdltdHkhQyR8HFnfUNcRiGg",
    youtubeUrl: "https://www.youtube.com/channel/UCdltdHkhQyR8HFnfUNcRiGg/live",
    fallbackVideoId: null,
    logo: "🗽",
    color: "#2980B9",
    description: "قناة الحرة – إعلام أمريكي عربي مستقل",
  },
  {
    id: "france24arabic",
    name: "فرانس 24 عربي",
    nameEn: "France 24 Arabic",
    channelId: "UCVi6ofFy3QyK1RSqDCiArsA",
    youtubeUrl: "https://www.youtube.com/@FRANCE24Arabic",
    fallbackVideoId: null,
    logo: "🇫🇷",
    color: "#003189",
    description: "فرانس 24 عربي – نظرة عالمية على الأخبار",
  },
  {
    id: "rtarabic",
    name: "روسيا اليوم",
    nameEn: "RT Arabic",
    channelId: "UCiMKtlkLJ4ZW8Vp6s3r3C8g",
    youtubeUrl: "https://www.youtube.com/channel/UCiMKtlkLJ4ZW8Vp6s3r3C8g/live",
    fallbackVideoId: null,
    logo: "📺",
    color: "#C0392B",
    description: "قناة روسيا اليوم العربية – منظور مختلف للأخبار",
  },
  {
    id: "alarabytv",
    name: "العربي – أخبار",
    nameEn: "Alaraby TV News",
    channelId: "UCRJUVYt9gjg8MnlGacySUdg",
    youtubeUrl: "https://www.youtube.com/@AlarabyTVNews/live",
    fallbackVideoId: "e2RgSa1Wt5o",
    logo: "🌍",
    color: "#1ABC9C",
    description: "قناة العربي الإخبارية – بث مباشر",
  },
  {
    id: "dwarabic",
    name: "DW عربية",
    nameEn: "DW Arabic",
    channelId: "UCNje_9zfCqqofJTXGnt5Mhg",
    youtubeUrl: "https://www.youtube.com/@DWArabic",
    fallbackVideoId: null,
    logo: "🇩🇪",
    color: "#004B7F",
    description: "دويتشه فيله عربي – أخبار ألمانية وعالمية بالعربية",
  },
];

type Channel = typeof LIVE_CHANNELS[number];

// مكون لعرض مشغل قناة واحدة مع جلب Video ID تلقائياً
function ChannelPlayer({ channel, onError }: { channel: Channel; onError: () => void }) {
  const { data, isLoading } = trpc.videos.getLiveVideoId.useQuery(
    { channelId: channel.channelId },
    { staleTime: 5 * 60 * 1000, retry: 1 }
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
          <p className="text-muted-foreground text-sm mb-6">
            البث المباشر متاح على يوتيوب مباشرة
          </p>
          <a href={channel.youtubeUrl} target="_blank" rel="noopener noreferrer">
            <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-base">
              <Radio className="w-5 h-5 animate-pulse" />
              مشاهدة البث المباشر على يوتيوب
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      key={`${channel.id}-${videoId}`}
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
      title={`${channel.name} - بث مباشر`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      className="w-full h-full"
      onError={onError}
    />
  );
}

export default function LiveTV() {
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<Channel>(LIVE_CHANNELS[0]);
  const [playerError, setPlayerError] = useState(false);

  // إعادة تعيين الخطأ عند تغيير القناة
  useEffect(() => {
    setPlayerError(false);
  }, [selectedChannel.id]);

  function handleChannelChange(channel: Channel) {
    setSelectedChannel(channel);
    setPlayerError(false);
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top row: title + user */}
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

          {/* Navigation tabs: 3 icons */}
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
            <Link href="/live">
              <Button variant="default" size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-white rounded-full px-3">
                <Radio className="w-4 h-4" />
                <span className="text-xs">بث مباشر</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Channel List - sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4" />
              القنوات الإخبارية ({LIVE_CHANNELS.length})
            </h2>
            <div className="space-y-2">
              {LIVE_CHANNELS.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelChange(channel)}
                  className={`w-full text-right p-3 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                    selectedChannel.id === channel.id
                      ? "border-red-500 bg-red-500/10 shadow-sm"
                      : "border-border hover:border-red-500/50 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{channel.logo}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${selectedChannel.id === channel.id ? "text-red-500" : "text-foreground"}`}>
                      {channel.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{channel.nameEn}</p>
                  </div>
                  {selectedChannel.id === channel.id && (
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Video Player - main area */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Channel info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedChannel.logo}</span>
                <div>
                  <h2 className="text-xl font-bold">{selectedChannel.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white animate-pulse">🔴 مباشر</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => { setPlayerError(false); }}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">تحديث</span>
                </Button>
                <a href={selectedChannel.youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">يوتيوب</span>
                  </Button>
                </a>
              </div>
            </div>

            {/* YouTube Embed */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-border">
              {playerError ? (
                /* Fallback when embed fails */
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-background to-muted p-8 text-center">
                  <span className="text-6xl">{selectedChannel.logo}</span>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedChannel.name}</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      البث المباشر متاح على يوتيوب مباشرة
                    </p>
                    <a href={selectedChannel.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-base">
                        <Radio className="w-5 h-5 animate-pulse" />
                        مشاهدة البث المباشر على يوتيوب
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <ChannelPlayer
                  channel={selectedChannel}
                  onError={() => setPlayerError(true)}
                />
              )}
            </div>

            {/* Tip */}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              <span>يتم جلب أحدث فيديو من كل قناة تلقائياً. إذا لم يعمل البث، اضغط "يوتيوب" للمشاهدة المباشرة.</span>
            </div>

            {/* Other channels quick access */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">قنوات أخرى</h3>
              <div className="flex flex-wrap gap-2">
                {LIVE_CHANNELS.filter((ch) => ch.id !== selectedChannel.id).map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelChange(channel)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-red-500/50 hover:bg-red-500/10 transition-all text-sm"
                  >
                    <span>{channel.logo}</span>
                    <span>{channel.name}</span>
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
