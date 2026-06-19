import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye, Users, TrendingUp, Globe, BarChart3,
  ArrowUpRight, RefreshCw, Loader2, MousePointerClick,
  UserCheck, UserPlus
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

const PAGE_LABELS: Record<string, string> = {
  "/": "الرئيسية",
  "/live": "البث المباشر",
  "/videos": "الفيديوهات",
  "/daily-summary": "الملخص اليومي",
  "/search": "البحث",
  "/archive": "الأرشيف",
  "/favorites": "المفضلة",
  "/about": "من نحن",
  "/contact": "تواصل معنا",
};

function getPageLabel(page: string): string {
  if (PAGE_LABELS[page]) return PAGE_LABELS[page];
  if (page.startsWith("/news/")) return `خبر #${page.replace("/news/", "")}`;
  if (page.startsWith("/folders/")) return `مجلد #${page.replace("/folders/", "")}`;
  return page;
}

const PERIOD_OPTIONS = [
  { label: "7 أيام", value: 7 },
  { label: "30 يوم", value: 30 },
  { label: "90 يوم", value: 90 },
];

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);

  const { data: stats, isLoading, refetch } = trpc.analytics.getStats.useQuery({ days });
  const { data: visitorTypes } = trpc.analytics.visitorTypes.useQuery({ days });

  const statCards = [
    {
      title: "إجمالي المشاهدات",
      value: stats?.totalViews ?? 0,
      icon: Eye,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "الزوار الفريدون",
      value: stats?.uniqueSessions ?? 0,
      icon: Users,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    {
      title: "زوار جدد",
      value: visitorTypes?.newVisitors ?? 0,
      icon: UserPlus,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      title: "زوار عائدون",
      value: visitorTypes?.returningVisitors ?? 0,
      icon: UserCheck,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  // Format daily views for chart
  const chartData = (stats?.dailyViews || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    مشاهدات: Number(d.count),
  }));

  // Traffic sources for pie chart
  const sourcesData = (stats?.trafficSources || []).map((s) => ({
    name: s.source,
    value: Number(s.count),
  }));

  // Visitor types for pie chart
  const visitorData = [
    { name: "زوار جدد", value: visitorTypes?.newVisitors ?? 0 },
    { name: "زوار عائدون", value: visitorTypes?.returningVisitors ?? 0 },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white arabic-text flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-red-400" />
              إحصاءات الزوار
            </h1>
            <p className="text-slate-400 text-sm arabic-text mt-1">
              تتبع حركة الزوار ومصادر الزيارات
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={days === opt.value ? "default" : "outline"}
                onClick={() => setDays(opt.value)}
                className={days === opt.value
                  ? "bg-red-600 hover:bg-red-700 text-white arabic-text"
                  : "border-slate-600 text-slate-300 hover:bg-slate-700 arabic-text"
                }
              >
                {opt.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => (
                <Card key={card.title} className={`bg-slate-800 border ${card.border}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${card.bg}`}>
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {card.value.toLocaleString("ar-SA")}
                    </p>
                    <p className="text-slate-400 text-sm arabic-text mt-1">{card.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Daily Views Chart */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-base arabic-text flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  المشاهدات اليومية
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-500 arabic-text">
                    لا توجد بيانات كافية بعد. ستظهر الإحصاءات بعد زيارة الموقع.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        labelStyle={{ color: "#e2e8f0" }}
                        itemStyle={{ color: "#94a3b8" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="مشاهدات"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#viewsGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Bottom Row: Traffic Sources + Visitor Types + Top Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Traffic Sources */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base arabic-text flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-400" />
                    مصادر الزيارات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sourcesData.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-slate-500 text-sm arabic-text">
                      لا توجد بيانات بعد
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={sourcesData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {sourcesData.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                            itemStyle={{ color: "#94a3b8" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {sourcesData.map((s, i) => (
                          <div key={s.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-slate-300 text-sm arabic-text">{s.name}</span>
                            </div>
                            <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                              {s.value.toLocaleString("ar-SA")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Visitor Types */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base arabic-text flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    أنواع الزوار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {visitorData.every(v => v.value === 0) ? (
                    <div className="h-40 flex items-center justify-center text-slate-500 text-sm arabic-text">
                      لا توجد بيانات بعد
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={visitorData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            <Cell fill="#8b5cf6" />
                            <Cell fill="#10b981" />
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                            itemStyle={{ color: "#94a3b8" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-3 mt-2">
                        {visitorData.map((v, i) => {
                          const total = visitorData.reduce((a, b) => a + b.value, 0);
                          const pct = total > 0 ? Math.round((v.value / total) * 100) : 0;
                          return (
                            <div key={v.name}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-slate-300 text-sm arabic-text">{v.name}</span>
                                <span className="text-slate-400 text-sm">{pct}%</span>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: i === 0 ? "#8b5cf6" : "#10b981",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Top Pages */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base arabic-text flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-amber-400" />
                    أكثر الصفحات زيارةً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(stats?.topPages || []).length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-slate-500 text-sm arabic-text">
                      لا توجد بيانات بعد
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(stats?.topPages || []).slice(0, 8).map((p, i) => {
                        const maxCount = Number(stats?.topPages?.[0]?.count || 1);
                        const pct = Math.round((Number(p.count) / maxCount) * 100);
                        return (
                          <div key={p.page}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-slate-500 text-xs w-4 flex-shrink-0">
                                  {i + 1}
                                </span>
                                <span className="text-slate-300 text-sm arabic-text truncate">
                                  {getPageLabel(p.page)}
                                </span>
                              </div>
                              <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs flex-shrink-0 mr-2">
                                {Number(p.count).toLocaleString("ar-SA")}
                              </Badge>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-500/70 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Google Analytics Info Banner */}
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-blue-300 font-medium arabic-text text-sm">
                      ربط Google Analytics
                    </p>
                    <p className="text-slate-400 text-xs arabic-text mt-1 leading-relaxed">
                      لتفعيل Google Analytics، أضف معرّف التتبع (مثل G-XXXXXXXXXX) من إعدادات الموقع.
                      يمكنك إنشاء حساب مجاني على{" "}
                      <a
                        href="https://analytics.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        analytics.google.com
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
