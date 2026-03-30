import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Newspaper, AlertCircle, Loader2, CheckCircle, ArrowRight, Mail } from "lucide-react";

const schema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
});
type ForgotForm = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  });

  const mutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: (_, variables) => {
      setSentEmail(variables.email);
      setSent(true);
    },
  });

  const onSubmit = (data: ForgotForm) => {
    mutation.mutate(data);
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
            <CardTitle className="text-white text-xl text-center">استعادة كلمة السر</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              {sent
                ? "تم إرسال رابط الاستعادة إلى بريدك"
                : "أدخل بريدك الإلكتروني لاستعادة كلمة السر"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              <div className="text-center space-y-5 py-4">
                <div className="flex justify-center">
                  <div className="bg-green-900/30 p-4 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">تم إرسال البريد بنجاح!</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    أرسلنا رابط إعادة تعيين كلمة السر إلى:
                  </p>
                  <div className="bg-slate-700/50 rounded-lg px-4 py-2 flex items-center gap-2 justify-center">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-white text-sm font-mono" dir="ltr">{sentEmail}</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-3">
                    الرابط صالح لمدة ساعة واحدة. تحقق من مجلد البريد العشوائي إذا لم يصل.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  onClick={() => { setSent(false); setSentEmail(""); }}
                >
                  إرسال مرة أخرى
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 text-sm">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500"
                    dir="ltr"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs">{errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium h-11"
                >
                  {mutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الإرسال...</>
                  ) : (
                    <><Mail className="h-4 w-4 ml-2" />إرسال رابط الاستعادة</>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-5 text-center">
              <Link href="/login" className="text-slate-400 hover:text-slate-200 text-sm flex items-center justify-center gap-1.5 transition-colors">
                <ArrowRight className="h-4 w-4" />
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
