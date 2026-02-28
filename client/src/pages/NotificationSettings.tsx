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

export default function NotificationSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");

  const { data: sources } = trpc.rssSources.list.useQuery();

  // Set RTL direction
  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

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
      toast.success("تم تفعيل الإشعارات بنجاح");
    } else {
      toast.error("تم رفض إذن الإشعارات");
      setPermissionStatus(getNotificationPermission());
    }
  };

  const handleDisableNotifications = () => {
    setNotificationsEnabled(false);
    saveNotificationPreferences({
      enabled: false,
      sources: selectedSources,
    });
    toast.success("تم إيقاف الإشعارات");
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
      toast.success("تم تحديد جميع المصادر");
    }
  };

  const handleClearAll = () => {
    setSelectedSources([]);
    saveNotificationPreferences({
      enabled: notificationsEnabled,
      sources: [],
    });
    toast.success("تم إلغاء تحديد جميع المصادر");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold arabic-text">إعدادات الإشعارات</h1>
                <p className="text-sm text-muted-foreground arabic-text">
                  تحكم في إشعارات الأخبار العاجلة
                </p>
              </div>
            </div>
            
            <Link href="/">
              <Button variant="outline" className="arabic-text">
                <ArrowRight className="h-4 w-4 ml-2" />
                العودة للرئيسية
              </Button>
            </Link>
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
                  تفعيل الإشعارات
                </CardTitle>
                <CardDescription className="arabic-text">
                  احصل على إشعارات فورية عند نشر أخبار جديدة من المصادر المفضلة لديك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium arabic-text">
                      {notificationsEnabled ? "الإشعارات مفعلة" : "الإشعارات معطلة"}
                    </p>
                    <p className="text-sm text-muted-foreground arabic-text">
                      {permissionStatus === "denied"
                        ? "تم رفض إذن الإشعارات من المتصفح"
                        : permissionStatus === "granted"
                        ? "تم منح إذن الإشعارات"
                        : "لم يتم طلب إذن الإشعارات بعد"}
                    </p>
                  </div>
                  
                  {permissionStatus === "denied" ? (
                    <Badge variant="destructive" className="arabic-text">مرفوض</Badge>
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
                      <CardTitle className="arabic-text">اختر المصادر</CardTitle>
                      <CardDescription className="arabic-text">
                        حدد المصادر التي تريد تلقي إشعارات منها
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleSelectAll} className="arabic-text">
                        تحديد الكل
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearAll} className="arabic-text">
                        إلغاء الكل
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
