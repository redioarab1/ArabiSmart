import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Download } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface StoryGeneratorProps {
  title: string;
  description: string;
  source: string;
  publishedAt: string;
}

export function StoryGenerator({ title, description, source, publishedAt }: StoryGeneratorProps) {
  const storyRef = useRef<HTMLDivElement>(null);

  const generateStory = async () => {
    if (!storyRef.current) return;

    try {
      toast.info("جاري إنشاء الصورة...");
      
      // توليد الصورة باستخدام html2canvas
      const canvas = await html2canvas(storyRef.current, {
        scale: 2,
        backgroundColor: "#1e293b",
        logging: false,
      });

      // تحويل Canvas إلى Blob
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          toast.error("فشل إنشاء الصورة");
          return;
        }

        // تحميل الصورة
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `arabismart-story-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success("تم إنشاء الصورة بنجاح!");
      });
    } catch (error) {
      console.error("Error generating story:", error);
      toast.error("فشل إنشاء الصورة");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">إنشاء صورة Story</h3>
      
      {/* معاينة Story */}
      <div 
        ref={storyRef}
        className="relative w-full aspect-[9/16] max-w-[360px] mx-auto bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxHeight: "640px" }}
      >
        {/* خلفية زخرفية */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* المحتوى */}
        <div className="relative h-full flex flex-col justify-between p-8 text-white">
          {/* الهيدر */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-xl">ArabiSmart News</div>
              <div className="text-sm opacity-80">موقع الأخبار الذكي</div>
            </div>
          </div>

          {/* العنوان والوصف */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold leading-tight line-clamp-4">
              {title}
            </h2>
            <p className="text-base opacity-90 line-clamp-3">
              {description}
            </p>
          </div>

          {/* الفوتر */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80">{source}</span>
              <span className="opacity-80">{new Date(publishedAt).toLocaleDateString("ar-EG")}</span>
            </div>
            <div className="h-px bg-white/20"></div>
            <div className="text-center text-sm opacity-70">
              اقرأ المزيد على arabismart.news
            </div>
          </div>
        </div>
      </div>

      {/* زر التحميل */}
      <Button
        onClick={generateStory}
        size="lg"
        className="w-full max-w-[360px] mx-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        <Download className="h-5 w-5 ml-2" />
        تحميل صورة Story
      </Button>

      <p className="text-sm text-muted-foreground text-center max-w-[360px] mx-auto">
        يمكنك مشاركة هذه الصورة على Instagram Stories، WhatsApp Status، أو أي منصة أخرى
      </p>
    </div>
  );
}
