import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Folder, FolderPlus, Trash2, Edit, ChevronRight, FileText } from "lucide-react";
import { Link } from "wouter";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

export default function Folders() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [newFolderColor, setNewFolderColor] = useState("#3b82f6");
  const [activeId, setActiveId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Fetch folders
  const { data: folders = [], isLoading } = trpc.folders.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Create folder mutation
  const createMutation = trpc.folders.create.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      setIsCreateDialogOpen(false);
      setNewFolderName("");
      setNewFolderDescription("");
      setNewFolderIcon("📁");
      setNewFolderColor("#3b82f6");
      toast.success("تم إنشاء المجلد بنجاح");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete folder mutation
  const deleteMutation = trpc.folders.delete.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      toast.success("تم حذف المجلد بنجاح");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("يرجى إدخال اسم المجلد");
      return;
    }

    createMutation.mutate({
      name: newFolderName,
      description: newFolderDescription || undefined,
      icon: newFolderIcon,
      color: newFolderColor,
    });
  };

  const handleDeleteFolder = (folderId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المجلد؟ سيتم حذف جميع الأخبار المحفوظة فيه.")) {
      deleteMutation.mutate({ folderId });
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
    // Handle drag end logic here if needed
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>يجب تسجيل الدخول</CardTitle>
            <CardDescription>يرجى تسجيل الدخول لعرض المجلدات</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">مجلداتي 📁</h1>
          <p className="text-muted-foreground">نظّم أخبارك المفضلة في مجلدات مخصصة</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <FolderPlus className="ml-2 h-4 w-4" />
              مجلد جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مجلد جديد</DialogTitle>
              <DialogDescription>أنشئ مجلداً جديداً لتنظيم أخبارك المفضلة</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المجلد</Label>
                <Input
                  id="name"
                  placeholder="مثال: سياسة، رياضة، تقنية"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف (اختياري)</Label>
                <Textarea
                  id="description"
                  placeholder="وصف المجلد..."
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">الأيقونة</Label>
                  <Input
                    id="icon"
                    placeholder="📁"
                    value={newFolderIcon}
                    onChange={(e) => setNewFolderIcon(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">اللون</Label>
                  <Input
                    id="color"
                    type="color"
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateFolder} disabled={createMutation.isPending}>
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folders Grid */}
      {folders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">لا توجد مجلدات بعد</h3>
            <p className="text-muted-foreground mb-4">أنشئ مجلدك الأول لتنظيم أخبارك المفضلة</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <FolderPlus className="ml-2 h-4 w-4" />
              إنشاء مجلد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onDelete={handleDeleteFolder}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}

// Folder Card Component
function FolderCard({
  folder,
  onDelete,
}: {
  folder: any;
  onDelete: (id: number) => void;
}) {
  const { data: newsCount = 0 } = trpc.folders.newsCount.useQuery({ folderId: folder.id });

  return (
    <Link href={`/folders/${folder.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="text-4xl"
                style={{ color: folder.color || "#3b82f6" }}
              >
                {folder.icon || "📁"}
              </div>
              <div>
                <CardTitle className="text-lg">{folder.name}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  {newsCount} {newsCount === 1 ? "خبر" : "أخبار"}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(folder.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {folder.description && (
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {folder.description}
            </p>
          </CardContent>
        )}
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>عرض المحتوى</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
