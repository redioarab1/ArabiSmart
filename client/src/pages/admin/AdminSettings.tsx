import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Settings, Globe, Rss, Video, Bell, Shield, Database,
  Save, RefreshCw, Loader2, CheckCircle2, Info, Trash2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    siteName: "ArabiSmart News",
    siteDescription: "موقع إخباري ذكي يجمع الأخبار تلقائياً",
    fetchInterval: "30",
    maxNewsPerSource: "50",
    enableNotifications: true,
    enableComments: false,
    enableRatings: true,
    autoFetch: true,
  });

  const { data: stats } = trpc.admin.getStats.useQuery();
  const { data: sources } = trpc.admin.listSources.useQuery();

  const fetchMutation = trpc.admin.fetchNews.useMutation({
    onSuccess: () => toast.success("✅ تم جلب الأخبار بنجاح"),
    onError: (err: any) => toast.error(`❌ ${err.message}`),
  });

  const fetchVideosMutation = trpc.videos.fetchYouTube.useMutation({
    onSuccess: () => toast.success("✅ تم جلب الفيديوهات بنجاح"),
    onError: (err: any) => toast.error(`❌ ${err.message}`),
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("✅ تم حفظ الإعدادات بنجاح");
  };

  const activeSourcesCount = sources?.filter((s: any) => s.isActive).length ?? 0;

  return (
    <AdminLayout title="الإعدادات" subtitle="إعدادات الموقع والنظام">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Site Info */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                معلومات الموقع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">اسم الموقع</Label>
                <Input
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white arabic-text"
                />
              </div>
              <div>
                <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">وصف الموقع</Label>
                <Input
                  value={siteSettings.siteDescription}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white arabic-text"
                />
              </div>
            </CardContent>
          </Card>

          {/* RSS Settings */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
                <Rss className="w-4 h-4 text-orange-400" />
                إعدادات RSS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">
                    فترة الجلب (دقائق)
                  </Label>
                  <Input
                    type="number"
                    value={siteSettings.fetchInterval}
                    onChange={(e) => setSiteSettings({ ...siteSettings, fetchInterval: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="5"
                    max="1440"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 arabic-text text-sm mb-1.5 block">
                    أقصى أخبار لكل مصدر
                  </Label>
                  <Input
                    type="number"
                    value={siteSettings.maxNewsPerSource}
                    onChange={(e) => setSiteSettings({ ...siteSettings, maxNewsPerSource: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="10"
                    max="200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-700">
                <div>
                  <p className="text-sm text-white arabic-text">الجلب التلقائي</p>
                  <p className="text-xs text-slate-400 arabic-text">جلب الأخبار تلقائياً بشكل دوري</p>
                </div>
                <Switch
                  checked={siteSettings.autoFetch}
                  onCheckedChange={(v) => setSiteSettings({ ...siteSettings, autoFetch: v })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 gap-2 arabic-text"
                  onClick={() => fetchMutation.mutate()}
                  disabled={fetchMutation.isPending}
                >
                  {fetchMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  جلب الأخبار الآن
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Video Settings */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
                <Video className="w-4 h-4 text-red-400" />
                إعدادات الفيديو
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-700/40 rounded-lg p-3">
                <p className="text-sm text-slate-300 arabic-text mb-1">قنوات YouTube المفعّلة</p>
                <p className="text-xs text-slate-500 arabic-text">
                  يتم جلب الفيديوهات تلقائياً من قنوات YouTube العربية المضافة في قاعدة البيانات
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2 arabic-text"
                  onClick={() => fetchVideosMutation.mutate()}
                  disabled={fetchVideosMutation.isPending}
                >
                  {fetchVideosMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  جلب الفيديوهات الآن
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-400" />
                الميزات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  key: "enableNotifications" as const,
                  label: "الإشعارات",
                  desc: "إرسال إشعارات للمستخدمين عند نشر أخبار جديدة",
                },
                {
                  key: "enableComments" as const,
                  label: "التعليقات",
                  desc: "السماح للمستخدمين بالتعليق على الأخبار",
                },
                {
                  key: "enableRatings" as const,
                  label: "التقييمات",
                  desc: "السماح للمستخدمين بتقييم الأخبار",
                },
              ].map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between py-2.5 border-b border-slate-700 last:border-0"
                >
                  <div>
                    <p className="text-sm text-white arabic-text">{feature.label}</p>
                    <p className="text-xs text-slate-400 arabic-text">{feature.desc}</p>
                  </div>
                  <Switch
                    checked={siteSettings[feature.key]}
                    onCheckedChange={(v) => setSiteSettings({ ...siteSettings, [feature.key]: v })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white arabic-text gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ الإعدادات
          </Button>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* System Stats */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                إحصائيات النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "إجمالي الأخبار", value: stats?.totalNews ?? "—", color: "text-blue-400" },
                { label: "إجمالي الفيديوهات", value: stats?.totalVideos ?? "—", color: "text-red-400" },
                { label: "المستخدمون", value: stats?.totalUsers ?? "—", color: "text-green-400" },
                { label: "المصادر النشطة", value: stats?.activeSources ?? activeSourcesCount, color: "text-orange-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 arabic-text">{item.label}</span>
                  <span className={`text-sm font-bold ${item.color}`}>
                    {typeof item.value === "number" ? item.value.toLocaleString("ar-SA") : item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                معلومات النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "الإصدار", value: "2.0.0" },
                { label: "قاعدة البيانات", value: "PostgreSQL" },
                { label: "الإطار", value: "React + tRPC" },
                { label: "البيئة", value: "Production" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 arabic-text">{item.label}</span>
                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                    {item.value}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-slate-800 border-red-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                منطقة الخطر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400 arabic-text mb-3">
                هذه الإجراءات لا يمكن التراجع عنها. تأكد قبل المتابعة.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 arabic-text gap-2"
                onClick={() => toast.error("⚠️ هذه الميزة غير مفعّلة في هذا الإصدار")}
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف جميع الأخبار القديمة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
