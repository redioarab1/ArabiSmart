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
import { Eye, EyeOff, UserPlus, Newspaper, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(32, "اسم المستخدم يجب ألا يتجاوز 32 حرفاً")
    .regex(/^[a-zA-Z0-9_\u0600-\u06ff]+$/, "يُسمح بالحروف والأرقام والشرطة السفلية فقط"),
  name: z.string().min(1, "الاسم الكامل مطلوب").max(64),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة السر يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة السر مطلوب"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "كلمتا السر غير متطابقتين",
  path: ["confirmPassword"],
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { refresh } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await refresh();
      navigate("/");
    },
    onError: (err) => {
      setServerError(err.message || "حدث خطأ أثناء إنشاء الحساب");
    },
  });

  const onSubmit = (data: RegisterForm) => {
    setServerError("");
    registerMutation.mutate({
      username: data.username,
      email: data.email,
      password: data.password,
      name: data.name,
    });
  };

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 8) return { level: "weak", label: "ضعيفة", color: "bg-red-500" };
    if (pwd.length < 12 && !/[A-Z]/.test(pwd)) return { level: "medium", label: "متوسطة", color: "bg-yellow-500" };
    return { level: "strong", label: "قوية", color: "bg-green-500" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4" dir="rtl">
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
            <CardTitle className="text-white text-xl text-center">إنشاء حساب جديد</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              أنشئ حسابك للوصول إلى جميع الميزات
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

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-slate-300 text-sm">الاسم الكامل</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500"
                  {...register("name")}
                />
                {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-slate-300 text-sm">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="مثال: ahmed_ali"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500"
                  dir="ltr"
                  {...register("username")}
                />
                {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300 text-sm">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500"
                  dir="ltr"
                  {...register("email")}
                />
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300 text-sm">كلمة السر</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="8 أحرف على الأقل"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500 pl-10"
                    {...register("password")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-slate-300 text-sm">تأكيد كلمة السر</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="أعد إدخال كلمة السر"
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
                disabled={registerMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium h-11 mt-2"
              >
                {registerMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري إنشاء الحساب...</>
                ) : (
                  <><UserPlus className="h-4 w-4 ml-2" />إنشاء الحساب</>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center pt-0">
            <p className="text-slate-500 text-sm">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                تسجيل الدخول
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
