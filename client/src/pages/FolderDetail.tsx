import { useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Trash2, ExternalLink, Calendar, Clock, Heart, Share2, Languages } from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function FolderDetail() {
  const params = useParams();
  const folderId = parseInt(params.id || "0");
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Fetch folder details
  const { data: folder, isLoading: folderLoading } = trpc.folders.getById.useQuery(
    { folderId },
    { enabled: !!user && folderId > 0 }
  );

  // Fetch folder news
  const { data: folderNews = [], isLoading: newsLoading } = trpc.folders.getNews.useQuery(
    { folderId },
    { enabled: !!user && folderId > 0 }
  );

  // Remove news mutation
  const removeNewsMutation = trpc.folders.removeNews.useMutation({
    onSuccess: () => {
      utils.folders.getNews.invalidate({ folderId });
      toast.success("تم إزالة الخبر من المجلد");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRemoveNews = (newsId: number) => {
    if (confirm("هل أنت متأكد من إزالة هذا الخبر من المجلد؟")) {
      removeNewsMutation.mutate({ folderId, newsId });
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    // Handle reordering if needed
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>يجب تسجيل الدخول</CardTitle>
            <CardDescription>يرجى تسجيل الدخول لعرض المجلد</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (folderLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>المجلد غير موجود</CardTitle>
            <CardDescription>لم يتم العثور على المجلد المطلوب</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/folders">
              <Button>
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة للمجلدات
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/folders">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للمجلدات
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-5xl" style={{ color: folder.color || "#3b82f6" }}>
            {folder.icon || "📁"}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{folder.name}</h1>
            {folder.description && (
              <p className="text-muted-foreground">{folder.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {folderNews.length} {folderNews.length === 1 ? "خبر" : "أخبار"}
            </p>
          </div>
        </div>
      </div>

      {/* News List */}
      {newsLoading ? (
        <div className="text-center py-8">جاري تحميل الأخبار...</div>
      ) : folderNews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">لا توجد أخبار في هذا المجلد</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإضافة أخبار من الصفحة الرئيسية إلى هذا المجلد
            </p>
            <Link href="/">
              <Button>تصفح الأخبار</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={folderNews.map((item) => item.news.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {folderNews.map((item) => (
                <SortableNewsCard
                  key={item.news.id}
                  news={item.news}
                  note={item.folderItem.note}
                  onRemove={() => handleRemoveNews(item.news.id)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="opacity-50">
                <Card>
                  <CardHeader>
                    <CardTitle>سحب الخبر...</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

// Sortable News Card Component
function SortableNewsCard({
  news,
  note,
  onRemove,
}: {
  news: any;
  note: string | null;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: news.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={news.category === "SE" ? "default" : "secondary"}>
                  {news.category === "SE" ? "🇸🇪" : "🌍"} {news.source}
                </Badge>
                <Badge variant="outline">{news.language.toUpperCase()}</Badge>
              </div>
              <Link href={`/news/${news.id}`}>
                <CardTitle className="text-xl hover:text-primary cursor-pointer mb-2">
                  {news.title}
                </CardTitle>
              </Link>
              {news.description && (
                <CardDescription className="line-clamp-2 mb-3">
                  {news.description}
                </CardDescription>
              )}
              {note && (
                <div className="bg-muted p-3 rounded-md mb-3">
                  <p className="text-sm">
                    <strong>ملاحظة:</strong> {note}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(news.publishedAt).toLocaleDateString("ar-EG")}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(news.publishedAt).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
            {news.image && (
              <div className="w-32 h-32 flex-shrink-0">
                <LazyLoadImage
                  src={news.image}
                  alt={news.title}
                  effect="blur"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Link href={`/news/${news.id}`}>
                <Button variant="outline" size="sm">
                  قراءة المزيد
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 ml-1" />
                إزالة
              </Button>
            </div>
            <div
              {...attributes}
              {...listeners}
              className="cursor-move p-2 hover:bg-muted rounded-md"
            >
              <div className="flex flex-col gap-1">
                <div className="w-6 h-0.5 bg-muted-foreground rounded"></div>
                <div className="w-6 h-0.5 bg-muted-foreground rounded"></div>
                <div className="w-6 h-0.5 bg-muted-foreground rounded"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
