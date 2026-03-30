import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, LogIn, Newspaper, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const loginSchema = z.object({
  identifier: z.string().min(1, "اسم المستخدم أو البريد مطلوب"),
  password: z.string().min(1, "كلمة السر مطلوبة"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { refresh: refetch } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = trpc.auth.localLogin.useMutation({
    onSuccess: async () => {
      await refetch();
      navigate("/");
    },
    onError: (err) => {
      setServerError(err.message || "بيانات الدخول غير صحيحة");
    },
  });

  const onSubmit = (data: LoginForm) => {
    setServerError("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4" dir="rtl">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-red-600 p-2.5 rounded-xl">
              <Newspaper className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">ArabiSmart</h1>
          </div>
          <p className="text-slate-400 text-sm">موقع الأخبار الذكي</p>
        </div>

        <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl text-center">تسجيل الدخول</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              أدخل بياناتك للوصول إلى حسابك
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <Alert variant="destructive" className="bg-red-900/30 border-red-700/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-300">{serverError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-slate-300 text-sm">
                  اسم المستخدم أو البريد الإلكتروني
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="أدخل اسم المستخدم أو البريد"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20"
                  {...register("identifier")}
                />
                {errors.identifier && (
                  <p className="text-red-400 text-xs">{errors.identifier.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm">كلمة السر</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة السر"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20 pl-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs">{errors.password.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-red-400 hover:text-red-300 text-xs transition-colors">
                  نسيت كلمة السر؟
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium h-11 transition-all"
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الدخول...</>
                ) : (
                  <><LogIn className="h-4 w-4 ml-2" />تسجيل الدخول</>
                )}
              </Button>
            </form>

            <div className="mt-5">
              <div className="relative">
                <Separator className="bg-slate-700" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-slate-800 px-3 text-slate-500 text-xs">أو</span>
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white bg-transparent"
                onClick={() => window.location.href = getLoginUrl()}
              >
                <svg className="h-4 w-4 ml-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                الدخول عبر Manus OAuth
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center pt-0">
            <p className="text-slate-500 text-sm">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                إنشاء حساب جديد
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-slate-600 text-xs mt-6">
          بتسجيل الدخول، أنت توافق على شروط الاستخدام وسياسة الخصوصية
        </p>
      </div>
    </div>
  );
}
