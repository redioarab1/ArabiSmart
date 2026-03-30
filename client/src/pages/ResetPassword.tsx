import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Newspaper, Loader2, CheckCircle, XCircle, KeyRound } from "lucide-react";

const schema = z.object({
  newPassword: z.string().min(8, "كلمة السر يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة السر مطلوب"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "كلمتا السر غير متطابقتين",
  path: ["confirmPassword"],
});
type ResetForm = z.infer<typeof schema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const validateQuery = trpc.auth.validateResetToken.useQuery(
    { token },
    { enabled: token.length > 0, retry: false }
  );

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(schema),
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    },
  });

  const onSubmit = (data: ResetForm) => {
    resetMutation.mutate({ token, newPassword: data.newPassword });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
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
            <CardTitle className="text-white text-xl text-center">تعيين كلمة سر جديدة</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              أدخل كلمة السر الجديدة لحسابك
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Loading token validation */}
            {validateQuery.isLoading && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">جاري التحقق من الرابط...</p>
              </div>
            )}

            {/* Invalid token */}
            {!validateQuery.isLoading && validateQuery.data && !validateQuery.data.valid && (
              <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="bg-red-900/30 p-4 rounded-full">
                    <XCircle className="h-12 w-12 text-red-400" />
                  </div>
                </div>
                <p className="text-white font-medium">الرابط غير صالح أو منتهي الصلاحية</p>
                <p className="text-slate-400 text-sm">يرجى طلب رابط جديد من صفحة استعادة كلمة السر.</p>
                <Link href="/forgot-password">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    طلب رابط جديد
                  </Button>
                </Link>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="bg-green-900/30 p-4 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                  </div>
                </div>
                <p className="text-white font-medium">تم تغيير كلمة السر بنجاح!</p>
                <p className="text-slate-400 text-sm">سيتم توجيهك إلى صفحة الدخول خلال ثوانٍ...</p>
                <Link href="/login">
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    تسجيل الدخول الآن
                  </Button>
                </Link>
              </div>
            )}

            {/* Form */}
            {!validateQuery.isLoading && validateQuery.data?.valid && !success && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {validateQuery.data.name && (
                  <p className="text-slate-400 text-sm text-center">
                    مرحباً <span className="text-white font-medium">{validateQuery.data.name}</span>، أدخل كلمة سر جديدة
                  </p>
                )}

                {resetMutation.error && (
                  <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3">
                    <p className="text-red-300 text-sm">{resetMutation.error.message}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-slate-300 text-sm">كلمة السر الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="8 أحرف على الأقل"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500 pl-10"
                      {...register("newPassword")}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-red-400 text-xs">{errors.newPassword.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-slate-300 text-sm">تأكيد كلمة السر</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="أعد إدخال كلمة السر الجديدة"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500 pl-10"
                      {...register("confirmPassword")}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium h-11"
                >
                  {resetMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الحفظ...</>
                  ) : (
                    <><KeyRound className="h-4 w-4 ml-2" />تعيين كلمة السر الجديدة</>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
