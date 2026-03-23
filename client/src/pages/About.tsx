import { Globe, Zap, Shield, Users, BookOpen, Target, Mail, ExternalLink } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ScrollToTop from "@/components/ScrollToTop";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <SEOHead
        title="عن عربي سمارت للأخبار"
        description="تعرّف على موقع عربي سمارت للأخبار - منصة إخبارية ذكية تجمع أهم الأخبار العربية والسويدية مع ملخصات يومية بالذكاء الاصطناعي."
        url="/about"
      />
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
            <Link href="/contact"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">اتصل بنا</span></Link>
            <Link href="/privacy"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">سياسة الخصوصية</span></Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container text-center space-y-6 max-w-3xl mx-auto">
          <Badge variant="outline" className="arabic-text">عن الموقع</Badge>
          <h1 className="text-4xl font-bold arabic-text leading-tight">
            عربي سمارت للأخبار
          </h1>
          <p className="text-xl text-muted-foreground arabic-text leading-relaxed">
            منصة إخبارية ذكية تجمع أهم الأخبار العربية والسويدية والعالمية في مكان واحد، مع ملخصات يومية مُولَّدة بالذكاء الاصطناعي.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-14 container max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold arabic-text">رسالتنا</h2>
            <p className="text-muted-foreground arabic-text leading-relaxed">
              أُسِّس موقع عربي سمارت للأخبار بهدف تقديم تجربة إخبارية متكاملة للجالية العربية في السويد والعالم. نؤمن بأن المعلومة الصحيحة في الوقت المناسب هي حق لكل إنسان.
            </p>
            <p className="text-muted-foreground arabic-text leading-relaxed">
              نجمع الأخبار من أكثر من 20 مصدراً موثوقاً، ونستخدم الذكاء الاصطناعي لتوليد ملخصات يومية دقيقة تُوفّر وقتك وتُبقيك على اطلاع دائم.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center p-4">
              <CardContent className="pt-2 space-y-2">
                <div className="text-3xl font-bold text-primary">20+</div>
                <p className="text-sm text-muted-foreground arabic-text">مصدر إخباري</p>
              </CardContent>
            </Card>
            <Card className="text-center p-4">
              <CardContent className="pt-2 space-y-2">
                <div className="text-3xl font-bold text-primary">200+</div>
                <p className="text-sm text-muted-foreground arabic-text">زيارة يومية</p>
              </CardContent>
            </Card>
            <Card className="text-center p-4">
              <CardContent className="pt-2 space-y-2">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <p className="text-sm text-muted-foreground arabic-text">تحديث مستمر</p>
              </CardContent>
            </Card>
            <Card className="text-center p-4">
              <CardContent className="pt-2 space-y-2">
                <div className="text-3xl font-bold text-primary">3</div>
                <p className="text-sm text-muted-foreground arabic-text">لغات متاحة</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 bg-muted/30">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold arabic-text text-center mb-10">ما يميزنا</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold arabic-text">أخبار فورية</h3>
              <p className="text-sm text-muted-foreground arabic-text leading-relaxed">
                تحديث تلقائي كل 15 دقيقة من أكثر من 20 مصدراً إخبارياً موثوقاً.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold arabic-text">ملخصات ذكية</h3>
              <p className="text-sm text-muted-foreground arabic-text leading-relaxed">
                ملخص يومي شامل مُولَّد بالذكاء الاصطناعي يُغطي أبرز أحداث اليوم.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold arabic-text">تغطية متعددة اللغات</h3>
              <p className="text-sm text-muted-foreground arabic-text leading-relaxed">
                أخبار عربية وسويدية وعالمية مع إمكانية الترجمة الفورية.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold arabic-text">مصادر موثوقة</h3>
              <p className="text-sm text-muted-foreground arabic-text leading-relaxed">
                نختار مصادرنا بعناية لضمان دقة المعلومة وموثوقيتها.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold arabic-text">مجتمع القراء</h3>
              <p className="text-sm text-muted-foreground arabic-text leading-relaxed">
                إنشاء حساب شخصي لحفظ الأخبار المفضلة وتنظيمها في مجلدات.
              </p>
            </Card>
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold arabic-text">تخصيص المحتوى</h3>
              <p className="text-sm text-muted-foreground arabic-text leading-relaxed">
                فلترة الأخبار حسب الفئة والمصدر والتاريخ لتجربة مخصصة.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Sources Section */}
      <section className="py-14 container max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold arabic-text text-center mb-4">مصادرنا الإخبارية</h2>
        <p className="text-center text-muted-foreground arabic-text mb-8">
          نجمع الأخبار من أبرز المصادر الإخبارية العربية والسويدية والدولية
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {["روسيا اليوم (RT Arabic)", "الجزيرة", "BBC Arabic", "العربية", "الكومبس", "SVT", "Aftonbladet", "الوطن", "سبوتنيك عربي", "دويتشه فيله"].map((source) => (
            <Badge key={source} variant="secondary" className="arabic-text text-sm py-1 px-3">
              {source}
            </Badge>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 bg-primary/5 border-t border-b">
        <div className="container max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold arabic-text">هل لديك سؤال أو اقتراح؟</h2>
          <p className="text-muted-foreground arabic-text">
            نسعد بتواصلك معنا لأي استفسار أو اقتراح لتحسين الموقع.
          </p>
          <Link href="/contact">
            <Button size="lg" className="arabic-text gap-2">
              <Mail className="h-4 w-4" />
              تواصل معنا
            </Button>
          </Link>
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
