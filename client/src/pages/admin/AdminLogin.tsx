import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.localLogin.useMutation({
    onSuccess: (data) => {
      if (data.user?.role === "admin") {
        toast.success("مرحباً بك في لوحة التحكم");
        navigate("/admin");
      } else {
        setError("ليس لديك صلاحية الوصول إلى لوحة التحكم. يجب أن تكون مديراً للنظام.");
      }
    },
    onError: (err) => {
      setError(err.message || "بيانات الدخول غير صحيحة");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة السر");
      return;
    }
    loginMutation.mutate({ identifier, password });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-900"
      dir="rtl"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 shadow-lg shadow-red-600/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white arabic-text">لوحة تحكم ArabiSmart</h1>
          <p className="text-slate-400 text-sm mt-1 arabic-text">منطقة محمية — للمشرفين فقط</p>
        </div>

        <Card className="bg-slate-800 border-slate-700 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg arabic-text text-center">تسجيل الدخول</CardTitle>
            <CardDescription className="text-slate-400 text-center arabic-text text-sm">
              أدخل بيانات حساب المشرف للمتابعة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-slate-300 arabic-text text-sm">
                  اسم المستخدم أو البريد الإلكتروني
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="أدخل اسم المستخدم أو البريد"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20 arabic-text"
                  autoComplete="username"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 arabic-text text-sm">
                  كلمة السر
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة السر"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20 pl-10"
                    autoComplete="current-password"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-red-400 text-sm arabic-text">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium arabic-text h-11 shadow-lg shadow-red-600/20"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  "دخول لوحة التحكم"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-700 text-center">
              <a
                href="/"
                className="text-slate-400 hover:text-slate-200 text-sm arabic-text transition-colors"
              >
                العودة إلى الموقع الرئيسي
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-slate-600 text-xs mt-6 arabic-text">
          هذه المنطقة محمية. جميع محاولات الدخول مسجلة.
        </p>
      </div>
    </div>
  );
}
