import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  requestNotificationPermission,
  areNotificationsEnabled,
  saveNotificationPreferences,
  loadNotificationPreferences,
  getNotificationPermission,
} from "@/lib/notifications";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotificationSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const { t, lang } = useLanguage();

  const { data: sources } = trpc.rssSources.list.useQuery();

  // Load preferences and permission status
  useEffect(() => {
    const prefs = loadNotificationPreferences();
    setNotificationsEnabled(prefs.enabled && areNotificationsEnabled());
    setSelectedSources(prefs.sources);
    setPermissionStatus(getNotificationPermission());
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    
    if (granted) {
      setNotificationsEnabled(true);
      setPermissionStatus("granted");
      saveNotificationPreferences({
        enabled: true,
        sources: selectedSources,
      });
      toast.success(lang === "ar" ? "تم تفعيل الإشعارات بنجاح" : lang === "sv" ? "Aviseringar aktiverade" : "Notifications enabled");
    } else {
      toast.error(lang === "ar" ? "تم رفض إذن الإشعارات" : lang === "sv" ? "Avisering nekad" : "Notification permission denied");
      setPermissionStatus(getNotificationPermission());
    }
  };

  const handleDisableNotifications = () => {
    setNotificationsEnabled(false);
    saveNotificationPreferences({
      enabled: false,
      sources: selectedSources,
    });
    toast.success(lang === "ar" ? "تم إيقاف الإشعارات" : lang === "sv" ? "Aviseringar inaktiverade" : "Notifications disabled");
  };

  const handleToggleSource = (sourceName: string) => {
    const newSources = selectedSources.includes(sourceName)
      ? selectedSources.filter((s) => s !== sourceName)
      : [...selectedSources, sourceName];
    
    setSelectedSources(newSources);
    saveNotificationPreferences({
      enabled: notificationsEnabled,
      sources: newSources,
    });
  };

  const handleSelectAll = () => {
    if (sources) {
      const allSources = sources.map((s) => s.name);
      setSelectedSources(allSources);
      saveNotificationPreferences({
        enabled: notificationsEnabled,
        sources: allSources,
      });
      toast.success(lang === "ar" ? "تم تحديد جميع المصادر" : lang === "sv" ? "Alla källor valda" : "All sources selected");
    }
  };

  const handleClearAll = () => {
    setSelectedSources([]);
    saveNotificationPreferences({
      enabled: notificationsEnabled,
      sources: [],
    });
    toast.success(lang === "ar" ? "تم إلغاء تحديد جميع المصادر" : lang === "sv" ? "Alla källor avvalda" : "All sources deselected");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10" dir={t.dir}>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{lang === "ar" ? "إعدادات الإشعارات" : lang === "sv" ? "Aviseringsinställningar" : "Notification Settings"}</h1>
                <p className="text-sm text-muted-foreground">
                  {lang === "ar" ? "تحكم في إشعارات الأخبار العاجلة" : lang === "sv" ? "Kontrollera dina nyhetsaviseringar" : "Control your breaking news notifications"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link href="/">
                <Button variant="outline">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  {t.home}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 md:py-12">
        <div className="container max-w-4xl">
          <div className="space-y-6">
            {/* Enable/Disable Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 arabic-text">
                  {notificationsEnabled ? (
                    <Bell className="h-5 w-5 text-green-500" />
                  ) : (
                    <BellOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  {lang === "ar" ? "تفعيل الإشعارات" : lang === "sv" ? "Aktivera aviseringar" : "Enable Notifications"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "احصل على إشعارات فورية عند نشر أخبار جديدة" : lang === "sv" ? "Få omedelbara aviseringar när nya nyheter publiceras" : "Get instant notifications when new news is published"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {notificationsEnabled ? (lang === "ar" ? "الإشعارات مفعلة" : lang === "sv" ? "Aviseringar aktiverade" : "Notifications enabled") : (lang === "ar" ? "الإشعارات معطلة" : lang === "sv" ? "Aviseringar inaktiverade" : "Notifications disabled")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {permissionStatus === "denied"
                        ? (lang === "ar" ? "تم رفض إذن الإشعارات من المتصفح" : lang === "sv" ? "Avisering nekad av webbläsaren" : "Notification permission denied by browser")
                        : permissionStatus === "granted"
                        ? (lang === "ar" ? "تم منح إذن الإشعارات" : lang === "sv" ? "Avisering bevärdigad" : "Notification permission granted")
                        : (lang === "ar" ? "لم يتم طلب إذن الإشعارات بعد" : lang === "sv" ? "Avisering inte begärd än" : "Notification permission not requested yet")}
                    </p>
                  </div>
                  
                  {permissionStatus === "denied" ? (
                    <Badge variant="destructive">{lang === "ar" ? "مرفوض" : lang === "sv" ? "Nekad" : "Denied"}</Badge>
                  ) : (
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleEnableNotifications();
                        } else {
                          handleDisableNotifications();
                        }
                      }}
                    />
                  )}
                </div>
                
                {permissionStatus === "denied" && (
                  <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                    <p className="text-sm arabic-text text-right">
                      لتفعيل الإشعارات، يجب السماح بها من إعدادات المتصفح أولاً
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source Selection */}
            {notificationsEnabled && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{lang === "ar" ? "اختر المصادر" : lang === "sv" ? "Välj källor" : "Select Sources"}</CardTitle>
                      <CardDescription>
                        {lang === "ar" ? "حدد المصادر التي تريد تلقي إشعارات منها" : lang === "sv" ? "Välj källor du vill få aviseringar från" : "Select sources you want to receive notifications from"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSelectAll}>
                        {lang === "ar" ? "تحديد الكل" : lang === "sv" ? "Välj alla" : "Select All"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearAll}>
                        {lang === "ar" ? "إلغاء الكل" : lang === "sv" ? "Avvälj alla" : "Clear All"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedSources.length === 0 && (
                    <div className="mb-4 p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm arabic-text text-right">
                        لم تحدد أي مصادر. سيتم إرسال إشعارات من جميع المصادر.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sources?.map((source) => {
                      const isSelected = selectedSources.includes(source.name);
                      
                      return (
                        <button
                          key={source.id}
                          onClick={() => handleToggleSource(source.name)}
                          className={`p-4 rounded-lg border-2 transition-all text-right ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium arabic-text">{source.name}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {source.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {source.language}
                                </Badge>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2 arabic-text text-right">
                  <p className="font-medium">💡 نصائح:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>سيتم إرسال إشعار عند نشر خبر جديد من المصادر المحددة</li>
                    <li>يمكنك تعطيل الإشعارات في أي وقت</li>
                    <li>الإشعارات تعمل حتى عند إغلاق الموقع (إذا كان المتصفح مفتوحًا)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
