import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings as SettingsIcon, Home, User, Mail, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { user, loading, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("تم حفظ التغييرات بنجاح");
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container py-8 max-w-4xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold arabic-text">إعدادات الحساب</h1>
            </div>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="arabic-text">الرئيسية</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 arabic-text">
                <User className="h-5 w-5" />
                المعلومات الشخصية
              </CardTitle>
              <CardDescription className="arabic-text">
                قم بتحديث معلومات حسابك الشخصية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="arabic-text">الاسم</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="arabic-text"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="arabic-text">البريد الإلكتروني</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="arabic-text"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  <span className="arabic-text">
                    {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 arabic-text">
                <Upload className="h-5 w-5" />
                الصورة الشخصية
              </CardTitle>
              <CardDescription className="arabic-text">
                قم بتحميل صورة شخصية لحسابك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="arabic-text">تحميل صورة</span>
                  </Button>
                  <p className="text-sm text-muted-foreground arabic-text">
                    JPG, PNG أو GIF (الحد الأقصى 2MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">إعدادات الخصوصية</CardTitle>
              <CardDescription className="arabic-text">
                تحكم في خصوصية حسابك وبياناتك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium arabic-text">إظهار الملف الشخصي</p>
                  <p className="text-sm text-muted-foreground arabic-text">
                    السماح للآخرين برؤية ملفك الشخصي
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <span className="arabic-text">تفعيل</span>
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium arabic-text">إظهار النشاط</p>
                  <p className="text-sm text-muted-foreground arabic-text">
                    السماح للآخرين برؤية نشاطك (التعليقات، التقييمات)
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <span className="arabic-text">تفعيل</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive arabic-text">منطقة الخطر</CardTitle>
              <CardDescription className="arabic-text">
                إجراءات لا يمكن التراجع عنها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="arabic-text">
                حذف الحساب
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
