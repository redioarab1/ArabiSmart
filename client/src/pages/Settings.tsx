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
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Settings() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t, lang } = useLanguage();
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
    toast.success(lang === "ar" ? "تم حفظ التغييرات بنجاح" : lang === "sv" ? "Ändringarna har sparats" : "Changes saved successfully");
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
              <h1 className="text-2xl md:text-3xl font-bold">{lang === "ar" ? "إعدادات الحساب" : lang === "sv" ? "Kontoinställningar" : "Account Settings"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  <span>{t.home}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {lang === "ar" ? "المعلومات الشخصية" : lang === "sv" ? "Personlig information" : "Personal Information"}
              </CardTitle>
              <CardDescription>
                {lang === "ar" ? "قم بتحديث معلومات حسابك الشخصية" : lang === "sv" ? "Uppdatera dina kontoinställningar" : "Update your personal account information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{lang === "ar" ? "الاسم" : lang === "sv" ? "Namn" : "Name"}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === "ar" ? "أدخل اسمك" : lang === "sv" ? "Ange ditt namn" : "Enter your name"}
                  dir={t.dir}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{lang === "ar" ? "البريد الإلكتروني" : lang === "sv" ? "E-postadress" : "Email Address"}</Label>
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
                  <span>
                    {isSaving ? (lang === "ar" ? "جاري الحفظ..." : lang === "sv" ? "Sparar..." : "Saving...") : (lang === "ar" ? "حفظ التغييرات" : lang === "sv" ? "Spara ändringar" : "Save Changes")}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {lang === "ar" ? "الصورة الشخصية" : lang === "sv" ? "Profilbild" : "Profile Picture"}
              </CardTitle>
              <CardDescription>
                {lang === "ar" ? "قم بتحميل صورة شخصية لحسابك" : lang === "sv" ? "Ladda upp en profilbild" : "Upload a profile picture for your account"}
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
                    <span>{lang === "ar" ? "تحميل صورة" : lang === "sv" ? "Ladda upp bild" : "Upload Image"}</span>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG {lang === "ar" ? "أو" : lang === "sv" ? "eller" : "or"} GIF ({lang === "ar" ? "الحد الأقصى 2MB" : lang === "sv" ? "Max 2MB" : "Max 2MB"})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{lang === "ar" ? "إعدادات الخصوصية" : lang === "sv" ? "Sekretessinställningar" : "Privacy Settings"}</CardTitle>
              <CardDescription>
                {lang === "ar" ? "تحكم في خصوصية حسابك وبياناتك" : lang === "sv" ? "Kontrollera din kontos sekretess" : "Control your account privacy and data"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{lang === "ar" ? "إظهار الملف الشخصي" : lang === "sv" ? "Visa profil" : "Show Profile"}</p>
                  <p className="text-sm text-muted-foreground">
                    {lang === "ar" ? "السماح للآخرين برؤية ملفك الشخصي" : lang === "sv" ? "Tillåt andra att se din profil" : "Allow others to see your profile"}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <span>{lang === "ar" ? "تفعيل" : lang === "sv" ? "Aktivera" : "Enable"}</span>
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{lang === "ar" ? "إظهار النشاط" : lang === "sv" ? "Visa aktivitet" : "Show Activity"}</p>
                  <p className="text-sm text-muted-foreground">
                    {lang === "ar" ? "السماح للآخرين برؤية نشاطك" : lang === "sv" ? "Tillåt andra att se din aktivitet" : "Allow others to see your activity"}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <span>{lang === "ar" ? "تفعيل" : lang === "sv" ? "Aktivera" : "Enable"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{lang === "ar" ? "منطقة الخطر" : lang === "sv" ? "Farlig zon" : "Danger Zone"}</CardTitle>
              <CardDescription>
                {lang === "ar" ? "إجراءات لا يمكن التراجع عنها" : lang === "sv" ? "Åtgärder som inte kan ångras" : "Actions that cannot be undone"}
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
