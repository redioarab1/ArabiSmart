import { useState } from "react";
import { Globe, Mail, MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { toast } from "sonner";
import ScrollToTop from "@/components/ScrollToTop";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success("تم إرسال رسالتك بنجاح! سنرد عليك خلال 24-48 ساعة.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Globe className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">ArabiSmart News</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">الرئيسية</span></Link>
            <Link href="/about"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">عن الموقع</span></Link>
            <Link href="/privacy"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">سياسة الخصوصية</span></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 bg-gradient-to-b from-primary/10 to-background">
        <div className="container text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="outline" className="arabic-text">تواصل معنا</Badge>
          <h1 className="text-3xl font-bold arabic-text">اتصل بنا</h1>
          <p className="text-muted-foreground arabic-text leading-relaxed">
            نسعد بتواصلك معنا لأي استفسار، اقتراح، أو للإبلاغ عن خبر غير دقيق.
          </p>
        </div>
      </section>

      <section className="py-12 container max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold arabic-text">معلومات التواصل</h2>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium arabic-text">البريد الإلكتروني</p>
                  <a href="mailto:info@arabismart.vip" className="text-sm text-primary hover:underline">
                    info@arabismart.vip
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium arabic-text">الموقع الإلكتروني</p>
                  <a href="https://arabismart.vip" className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                    arabismart.vip
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium arabic-text">وقت الاستجابة</p>
                  <p className="text-sm text-muted-foreground arabic-text">خلال 24-48 ساعة</p>
                </div>
              </div>
            </Card>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium arabic-text">أسباب التواصل الشائعة:</p>
              <ul className="text-sm text-muted-foreground arabic-text space-y-1">
                <li>• الإبلاغ عن خبر غير دقيق</li>
                <li>• اقتراح مصدر إخباري جديد</li>
                <li>• مشكلة تقنية في الموقع</li>
                <li>• طلب إعلان أو شراكة</li>
                <li>• استفسارات عامة</li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text">أرسل لنا رسالة</CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h3 className="text-xl font-bold arabic-text">تم إرسال رسالتك بنجاح!</h3>
                    <p className="text-muted-foreground arabic-text">
                      شكراً لتواصلك معنا. سنرد عليك خلال 24-48 ساعة على بريدك الإلكتروني.
                    </p>
                    <Button
                      variant="outline"
                      className="arabic-text"
                      onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    >
                      إرسال رسالة أخرى
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="arabic-text">
                          الاسم الكامل <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="أدخل اسمك الكامل"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="arabic-text"
                          dir="rtl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="arabic-text">
                          البريد الإلكتروني <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="arabic-text">موضوع الرسالة</Label>
                      <Input
                        id="subject"
                        placeholder="مثال: اقتراح مصدر إخباري جديد"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="arabic-text"
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="arabic-text">
                        الرسالة <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="اكتب رسالتك هنا..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="arabic-text min-h-[140px] resize-none"
                        dir="rtl"
                      />
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-muted-foreground arabic-text">
                        بإرسال هذا النموذج، أنت توافق على سياسة الخصوصية الخاصة بنا.
                      </p>
                    </div>

                    <Button type="submit" className="w-full arabic-text gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>جاري الإرسال...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          إرسال الرسالة
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium arabic-text">ArabiSmart News - تغطية بلا حدود</p>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground arabic-text">
            <Link href="/privacy"><span className="hover:text-foreground cursor-pointer transition-colors">سياسة الخصوصية</span></Link>
            <span>•</span>
            <Link href="/contact"><span className="hover:text-foreground cursor-pointer transition-colors">اتصل بنا</span></Link>
            <span>•</span>
            <Link href="/about"><span className="hover:text-foreground cursor-pointer transition-colors">عن الموقع</span></Link>
          </div>
          <p className="text-sm text-muted-foreground arabic-text">
            © 2026 ArabiSmart News. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
}
