import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { PlayCircle, Calendar, Eye } from "lucide-react";

export default function Videos() {
  const [selectedChannel, setSelectedChannel] = useState<string | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] = useState<"ar" | "sv" | "en" | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data: videosData, isLoading: videosLoading } = trpc.videos.list.useQuery({
    page,
    limit: 12,
    channelId: selectedChannel,
    language: selectedLanguage,
  });

  const { data: channels } = trpc.videos.channels.useQuery();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatViewCount = (count: number | null) => {
    if (!count) return "---";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📺 الأخبار المصوّرة</h1>
        <p className="text-muted-foreground">
          آخر نشرات الأخبار من أشهر القنوات الإخبارية
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Select value={selectedChannel || "all"} onValueChange={(v) => setSelectedChannel(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="جميع القنوات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع القنوات</SelectItem>
            {channels?.map((channel) => (
              <SelectItem key={channel.id} value={channel.channelId}>
                {channel.channelTitle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLanguage || "all"} onValueChange={(v) => setSelectedLanguage(v === "all" ? undefined : (v as "ar" | "sv" | "en"))}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="جميع اللغات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع اللغات</SelectItem>
            <SelectItem value="ar">العربية</SelectItem>
            <SelectItem value="sv">السويدية</SelectItem>
            <SelectItem value="en">الإنجليزية</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            setSelectedChannel(undefined);
            setSelectedLanguage(undefined);
            setPage(1);
          }}
        >
          إعادة تعيين
        </Button>
      </div>

      {/* Videos Grid */}
      {videosLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : videosData && videosData.videos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videosData.videos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative group">
                  <img
                    src={video.thumbnail || ""}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white"
                    >
                      <PlayCircle className="w-16 h-16" />
                    </a>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {video.title}
                    </a>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>{video.channelTitle}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                    {video.viewCount && (
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatViewCount(video.viewCount)}</span>
                      </div>
                    )}
                  </div>
                  {video.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              السابق
            </Button>
            <span className="flex items-center px-4">
              صفحة {page}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={videosData.videos.length < 12}
            >
              التالي
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا توجد فيديوهات متاحة حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
