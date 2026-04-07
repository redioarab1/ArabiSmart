import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Newspaper, Video, Users, Rss, TrendingUp, Eye,
  RefreshCw, ArrowUpRight, ArrowDownRight, Clock,
  Activity, Globe, BarChart3, Calendar, CheckCircle2,
  AlertCircle, Loader2, Zap
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { toast } from "sonner";
import { Link } from "wouter";

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function AdminHome() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
  const { data: growthData, isLoading: growthLoading } = trpc.admin.newsGrowth.useQuery();
  const { data: sources } = trpc.admin.listSources.useQuery();
  const { data: newsData } = trpc.news.list.useQuery({ page: 1, limit: 5 } as any);

  const fetchNewsMutation = trpc.admin.fetchNews.useMutation({
    onSuccess: () => {
      toast.success("✅ تم جلب الأخبار بنجاح");
    },
    onError: (err) => toast.error(`❌ خطأ: ${err.message}`),
  });

  const statCards = [
    {
      title: "إجمالي الأخبار",
      value: stats?.totalNews ?? 0,
      icon: Newspaper,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      change: "+12%",
      positive: true,
      href: "/admin/news",
    },
    {
      title: "أخبار اليوم",
      value: 0, // today count
      icon: Calendar,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      change: "+5%",
      positive: true,
      href: "/admin/news",
    },
    {
      title: "المصادر النشطة",
      value: stats?.activeSources ?? 0,
      icon: Rss,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      change: "0%",
      positive: true,
      href: "/admin/sources",
    },
    {
      title: "إجمالي الفيديوهات",
      value: stats?.totalVideos ?? 0,
      icon: Video,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      change: "+8%",
      positive: true,
      href: "/admin/videos",
    },
    {
      title: "إجمالي المصادر",
      value: sources?.length ?? 0,
      icon: Globe,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      change: "+2",
      positive: true,
      href: "/admin/sources",
    },
  ];

  // Prepare chart data
  const chartData = growthData?.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }),
    أخبار: Number(d.count),
  })) ?? [];

  // Category distribution from stats
  const categoryData = [
    { name: "عربية", value: 60 },
    { name: "SE", value: 40 },
  ];

  // Source distribution
  const sourceData: any[] = [];

  return (
    <AdminLayout title="لوحة التحكم" subtitle="نظرة عامة على الموقع">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white gap-2"
          onClick={() => fetchNewsMutation.mutate()}
          disabled={fetchNewsMutation.isPending}
        >
          {fetchNewsMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="arabic-text">جلب الأخبار الآن</span>
        </Button>
        <Link href="/admin/news">
          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
            <Newspaper className="w-4 h-4" />
            <span className="arabic-text">إدارة الأخبار</span>
          </Button>
        </Link>
        <Link href="/admin/videos">
          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
            <Video className="w-4 h-4" />
            <span className="arabic-text">إدارة الفيديوهات</span>
          </Button>
        </Link>
        <Link href="/admin/sources">
          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
            <Rss className="w-4 h-4" />
            <span className="arabic-text">مصادر RSS</span>
          </Button>
        </Link>
        <Link href="/admin/breaking-news">
          <Button size="sm" variant="outline" className="border-red-600/50 text-red-400 hover:bg-red-900/30 gap-2">
            <Zap className="w-4 h-4 fill-red-400" />
            <span className="arabic-text">أخبار عاجلة</span>
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}>
              <Card className={`bg-slate-800 border ${card.border} hover:border-opacity-60 transition-all cursor-pointer group`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${card.positive ? "text-green-400" : "text-red-400"}`}>
                      {card.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {card.change}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {statsLoading ? <div className="h-7 w-16 bg-slate-700 rounded animate-pulse" /> : card.value.toLocaleString("ar-SA")}
                  </div>
                  <p className="text-xs text-slate-400 arabic-text">{card.title}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* News Growth Chart */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              نمو الأخبار (آخر 7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {growthLoading ? (
              <div className="h-48 bg-slate-700/30 rounded animate-pulse" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="newsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="أخبار" stroke="#ef4444" fill="url(#newsGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500 arabic-text text-sm">
                لا توجد بيانات كافية
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              توزيع التصنيفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latest News */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-400" />
              آخر الأخبار المضافة
            </CardTitle>
            <Link href="/admin/news">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs arabic-text">
                عرض الكل
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700">
              {(newsData as any)?.items?.slice(0, 5).map((item: any) => (
                <div key={item.id} className="px-4 py-3 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Newspaper className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white arabic-text line-clamp-1 font-medium">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 arabic-text">{item.source}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-500">
                          {new Date(item.publishedAt).toLocaleDateString("ar-SA")}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs border-slate-600 text-slate-400 flex-shrink-0"
                    >
                      {item.category}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!(newsData as any)?.items || (newsData as any).items.length === 0) && (
                <div className="px-4 py-8 text-center text-slate-500 arabic-text text-sm">
                  لا توجد أخبار بعد
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sources Status */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-white text-sm arabic-text flex items-center gap-2">
              <Rss className="w-4 h-4 text-orange-400" />
              حالة مصادر RSS
            </CardTitle>
            <Link href="/admin/sources">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs arabic-text">
                إدارة المصادر
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700">
              {sources?.slice(0, 6).map((source: any) => (
                <div key={source.id} className="px-4 py-3 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${source.active ? "bg-green-400" : "bg-red-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white arabic-text truncate">{source.name}</p>
                      <p className="text-xs text-slate-500 truncate">{source.url}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs flex-shrink-0 ${source.active ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}`}
                    >
                      {source.active ? "نشط" : "معطل"}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!sources || sources.length === 0) && (
                <div className="px-4 py-8 text-center text-slate-500 arabic-text text-sm">
                  لا توجد مصادر مضافة
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
