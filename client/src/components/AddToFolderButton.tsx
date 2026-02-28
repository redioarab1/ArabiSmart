import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface AddToFolderButtonProps {
  newsId: number;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function AddToFolderButton({ 
  newsId, 
  variant = "outline", 
  size = "sm",
  className = ""
}: AddToFolderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");

  // Fetch user folders
  const { data: folders, refetch: refetchFolders } = trpc.folders.list.useQuery();

  // Add to folder mutation
  const addToFolderMutation = trpc.folders.addNews.useMutation({
    onSuccess: () => {
      toast.success("تمت إضافة الخبر إلى المجلد بنجاح!", { className: "arabic-text" });
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(`فشل إضافة الخبر: ${error.message}`, { className: "arabic-text" });
    },
  });

  // Create folder mutation
  const createFolderMutation = trpc.folders.create.useMutation({
    onSuccess: async (newFolder: any) => {
      toast.success("تم إنشاء المجلد بنجاح!", { className: "arabic-text" });
      await refetchFolders();
      
      // Add news to the new folder
      if (newFolder && newFolder.id) {
        addToFolderMutation.mutate({
          folderId: newFolder.id,
          newsId,
        });
      }
      
      setIsDialogOpen(false);
      setNewFolderName("");
      setNewFolderDescription("");
    },
    onError: (error) => {
      toast.error(`فشل إنشاء المجلد: ${error.message}`, { className: "arabic-text" });
    },
  });

  const handleAddToFolder = (folderId: number) => {
    addToFolderMutation.mutate({ folderId, newsId });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("يرجى إدخال اسم المجلد", { className: "arabic-text" });
      return;
    }

    createFolderMutation.mutate({
      name: newFolderName,
      description: newFolderDescription || undefined,
      color: "#3b82f6", // Default blue color
      icon: "folder",
    });
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            className={`gap-2 ${className}`}
          >
            <FolderPlus className="h-4 w-4" />
            <span className="arabic-text hidden sm:inline">إضافة لمجلد</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="arabic-text">اختر المجلد</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {folders && folders.length > 0 ? (
            folders.map((folder) => (
              <DropdownMenuItem
                key={folder.id}
                onClick={() => handleAddToFolder(folder.id)}
                disabled={addToFolderMutation.isPending}
                className="arabic-text cursor-pointer"
              >
                {addToFolderMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <span className="text-xl ml-2">{folder.icon || "📁"}</span>
                )}
                {folder.name}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled className="arabic-text">
              لا توجد مجلدات
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              setIsDialogOpen(true);
            }}
            className="arabic-text cursor-pointer text-primary"
          >
            <Plus className="h-4 w-4 ml-2" />
            إنشاء مجلد جديد
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Folder Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="arabic-text">إنشاء مجلد جديد</DialogTitle>
            <DialogDescription className="arabic-text">
              أضف مجلداً جديداً لتنظيم أخبارك المفضلة
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="arabic-text">
                اسم المجلد
              </Label>
              <Input
                id="name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="مثال: أخبار التقنية"
                className="arabic-text"
                dir="rtl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="arabic-text">
                الوصف (اختياري)
              </Label>
              <Input
                id="description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="وصف قصير للمجلد"
                className="arabic-text"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="arabic-text"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleCreateFolder}
              disabled={createFolderMutation.isPending}
              className="arabic-text"
            >
              {createFolderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 ml-2" />
                  إنشاء المجلد
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
