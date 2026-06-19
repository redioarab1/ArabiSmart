import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity, Search, RefreshCw, Loader2, CheckCircle2,
  XCircle, User, Clock, Filter, ChevronLeft, ChevronRight,
  Newspaper, Trash2, Edit, LogIn, LogOut, Settings, Plus
} from "lucide-react";

const ACTION_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  login: { label: "تسجيل دخول", icon: LogIn, color: "text-green-400" },
  logout: { label: "تسجيل خروج", icon: LogOut, color: "text-slate-400" },
  create_news: { label: "إضافة خبر", icon: Plus, color: "text-blue-400" },
  update_news: { label: "تعديل خبر", icon: Edit, color: "text-amber-400" },
  delete_news: { label: "حذف خبر", icon: Trash2, color: "text-red-400" },
  create_source: { label: "إضافة مصدر", icon: Plus, color: "text-blue-400" },
  delete_source: { label: "حذف مصدر", icon: Trash2, color: "text-red-400" },
  promote_user: { label: "ترقية مستخدم", icon: User, color: "text-purple-400" },
  fetch_news: { label: "جلب الأخبار", icon: RefreshCw, color: "text-cyan-400" },
  update_settings: { label: "تعديل الإعدادات", icon: Settings, color: "text-amber-400" },
  add_comment: { label: "إضافة تعليق", icon: Newspaper, color: "text-slate-400" },
  delete_comment: { label: "حذف تعليق", icon: Trash2, color: "text-red-400" },
};

function getActionInfo(action: string) {
  return ACTION_LABELS[action] || { label: action, icon: Activity, color: "text-slate-400" };
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PERIOD_OPTIONS = [
  { label: "7 أيام", value: 7 },
  { label: "30 يوم", value: 30 },
  { label: "90 يوم", value: 90 },
];

export default function AdminActivityLog() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  const { data, isLoading, refetch } = trpc.activityLog.list.useQuery({
    page,
    limit,
    days,
  });

  const { data: summary } = trpc.activityLog.summary.useQuery({ days });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Filter by search (client-side for simplicity)
  const filteredLogs = search
    ? logs.filter(
        (log) =>
          log.action?.toLowerCase().includes(search.toLowerCase()) ||
          log.userName?.toLowerCase().includes(search.toLowerCase()) ||
          log.entity?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white arabic-text flex items-center gap-2">
              <Activity className="w-6 h-6 text-red-400" />
              سجل النشاط
            </h1>
            <p className="text-slate-400 text-sm arabic-text mt-1">
              تتبع جميع العمليات التي ينفذها المستخدمون
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={days === opt.value ? "default" : "outline"}
                onClick={() => { setDays(opt.value); setPage(1); }}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-white">{summary?.total?.toLocaleString("en-GB") ?? 0}</p>
              <p className="text-slate-400 text-sm arabic-text mt-1">إجمالي العمليات</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-400">{summary?.errors === 0 ? "100%" : `${100 - (summary?.errorRate ?? 0)}%`}</p>
              <p className="text-slate-400 text-sm arabic-text mt-1">معدل النجاح</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-red-400">{summary?.errors?.toLocaleString("en-GB") ?? 0}</p>
              <p className="text-slate-400 text-sm arabic-text mt-1">عمليات فاشلة</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-400">
                {summary?.topUsers?.[0]?.userName ?? "—"}
              </p>
              <p className="text-slate-400 text-sm arabic-text mt-1">الأكثر نشاطاً</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Actions */}
        {(summary?.topActions || []).length > 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base arabic-text">أكثر العمليات تكراراً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(summary?.topActions || []).map((a) => {
                  const info = getActionInfo(a.action);
                  return (
                    <div
                      key={a.action}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full border border-slate-600"
                    >
                      <info.icon className={`w-3.5 h-3.5 ${info.color}`} />
                      <span className="text-slate-300 text-xs arabic-text">{info.label}</span>
                      <Badge variant="outline" className="border-slate-500 text-slate-400 text-xs px-1.5 py-0">
                        {Number(a.count)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="بحث في السجل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 pr-10 arabic-text"
            />
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-sm arabic-text">
            <Filter className="w-4 h-4" />
            <span>{total.toLocaleString("en-GB")} سجل</span>
          </div>
        </div>

        {/* Logs Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                <Activity className="w-10 h-10 mb-3 opacity-30" />
                <p className="arabic-text text-sm">لا توجد سجلات بعد</p>
                <p className="arabic-text text-xs mt-1">ستظهر العمليات هنا عند تنفيذها</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-right text-slate-400 text-xs font-medium p-4 arabic-text">العملية</th>
                      <th className="text-right text-slate-400 text-xs font-medium p-4 arabic-text">المستخدم</th>
                      <th className="text-right text-slate-400 text-xs font-medium p-4 arabic-text">الكيان</th>
                      <th className="text-right text-slate-400 text-xs font-medium p-4 arabic-text">الحالة</th>
                      <th className="text-right text-slate-400 text-xs font-medium p-4 arabic-text">الوقت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const info = getActionInfo(log.action);
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <info.icon className={`w-4 h-4 ${info.color} flex-shrink-0`} />
                              <span className="text-slate-200 text-sm arabic-text">{info.label}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              <span className="text-slate-300 text-sm arabic-text">
                                {log.userName || "مجهول"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            {log.entity ? (
                              <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs arabic-text">
                                {log.entity}
                                {log.entityId ? ` #${log.entityId}` : ""}
                              </Badge>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            {log.status === "success" ? (
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-xs arabic-text">نجاح</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-400">
                                <XCircle className="w-3.5 h-3.5" />
                                <span className="text-xs arabic-text">فشل</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-slate-500 text-xs">
                              <Clock className="w-3 h-3" />
                              <span dir="ltr">{formatDate(log.createdAt)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm arabic-text">
              صفحة {page} من {totalPages} ({total.toLocaleString("en-GB")} سجل)
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
