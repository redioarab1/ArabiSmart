import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, Search, Shield, UserCheck, UserX,
  Loader2, AlertCircle, Crown, Calendar
} from "lucide-react";
import { toast } from "sonner";

export default function AdminUsers() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data: usersData, isLoading } = trpc.admin.listUsers.useQuery({
    search: search || undefined,
  } as any);

  const utils = trpc.useUtils();

  const promoteMutation = trpc.admin.promoteUser.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تغيير صلاحيات المستخدم");
      utils.admin.listUsers.invalidate();
    },
    onError: (err: any) => toast.error(`❌ ${err.message}`),
  });

  const users = (usersData as any) ?? [];
  const adminCount = users.filter((u: any) => u.role === "admin").length;

  return (
    <AdminLayout
      title="إدارة المستخدمين"
      subtitle={`${users.length} مستخدم مسجل`}
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{users.length}</p>
            <p className="text-xs text-slate-400 arabic-text mt-1">إجمالي المستخدمين</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-red-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{adminCount}</p>
            <p className="text-xs text-slate-400 arabic-text mt-1">مدراء</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{users.length - adminCount}</p>
            <p className="text-xs text-slate-400 arabic-text mt-1">مستخدمون عاديون</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="بحث بالاسم أو البريد..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearch(searchInput);
            }
          }}
          className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 max-w-xs arabic-text"
        />
        <Button
          variant="outline"
          size="icon"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
          onClick={() => setSearch(searchInput)}
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" />
              <p className="text-slate-400 arabic-text">جاري التحميل...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 arabic-text">لا توجد مستخدمون</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {users.map((user: any) => (
                <div key={user.id} className="px-4 py-3 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={user.avatar || ""} />
                      <AvatarFallback className="bg-slate-700 text-white text-sm">
                        {user.name?.charAt(0) || "م"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-white font-medium arabic-text">{user.name || "مجهول"}</p>
                        {user.role === "admin" && (
                          <Badge className="bg-red-600/20 text-red-400 border-red-500/30 text-xs gap-1">
                            <Crown className="w-3 h-3" />
                            مدير
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5" dir="ltr">{user.email || user.openId}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user.createdAt && (
                        <span className="text-xs text-slate-500 hidden sm:block">
                          {new Date(user.createdAt).toLocaleDateString("en-GB")}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs gap-1 h-7 ${
                          user.role === "admin"
                            ? "text-red-400 hover:text-slate-400 hover:bg-slate-700"
                            : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        }`}
                        onClick={() =>
                          promoteMutation.mutate({
                            userId: user.id,
                            role: user.role === "admin" ? "user" : "admin",
                          })
                        }
                        disabled={promoteMutation.isPending}
                      >
                        {user.role === "admin" ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span className="arabic-text hidden sm:inline">إلغاء الإدارة</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5" />
                            <span className="arabic-text hidden sm:inline">ترقية لمدير</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
