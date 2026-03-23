import { Globe, Shield, Eye, Lock, Database, UserCheck, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import ScrollToTop from "@/components/ScrollToTop";
import SEOHead from "@/components/SEOHead";

export default function Privacy() {
  const lastUpdated = "23 مارس 2026";

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <SEOHead
        title="سياسة الخصوصية"
        description="سياسة الخصوصية لموقع عربي سمارت للأخبار. تعرّف على كيفية جمع بياناتك واستخدامها وحمايتها وحقوقك كمستخدم."
        url="/privacy"
        noIndex={false}
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
            <Link href="/about"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">عن الموقع</span></Link>
            <Link href="/contact"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">اتصل بنا</span></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 bg-gradient-to-b from-primary/10 to-background">
        <div className="container text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="outline" className="arabic-text">
            <Shield className="h-3 w-3 ml-1" />
            سياسة الخصوصية
          </Badge>
          <h1 className="text-3xl font-bold arabic-text">سياسة الخصوصية وحماية البيانات</h1>
          <p className="text-muted-foreground arabic-text">
            آخر تحديث: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Quick Summary Cards */}
      <section className="py-10 container max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Card className="p-5 text-center space-y-2 border-green-500/20 bg-green-500/5">
            <Eye className="h-8 w-8 text-green-500 mx-auto" />
            <h3 className="font-semibold arabic-text text-sm">شفافية كاملة</h3>
            <p className="text-xs text-muted-foreground arabic-text">نُخبرك بكل ما نجمعه من بيانات</p>
          </Card>
          <Card className="p-5 text-center space-y-2 border-blue-500/20 bg-blue-500/5">
            <Lock className="h-8 w-8 text-blue-500 mx-auto" />
            <h3 className="font-semibold arabic-text text-sm">حماية قوية</h3>
            <p className="text-xs text-muted-foreground arabic-text">بياناتك محمية بأحدث تقنيات التشفير</p>
          </Card>
          <Card className="p-5 text-center space-y-2 border-purple-500/20 bg-purple-500/5">
            <UserCheck className="h-8 w-8 text-purple-500 mx-auto" />
            <h3 className="font-semibold arabic-text text-sm">حقوقك محفوظة</h3>
            <p className="text-xs text-muted-foreground arabic-text">يمكنك طلب حذف بياناتك في أي وقت</p>
          </Card>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-8">

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold arabic-text flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
              مقدمة
            </h2>
            <p className="text-muted-foreground arabic-text leading-relaxed">
              يلتزم موقع <strong>عربي سمارت للأخبار (ArabiSmart News)</strong> المتاح على الرابط <strong>arabismart.vip</strong> بحماية خصوصيتك وصون بياناتك الشخصية. تُوضّح هذه السياسة كيفية جمع المعلومات واستخدامها وحمايتها عند استخدامك لموقعنا.
            </p>
            <p className="text-muted-foreground arabic-text leading-relaxed">
              باستخدامك لموقعنا، فإنك توافق على الشروط المذكورة في هذه السياسة. إذا كنت لا توافق على أي من هذه الشروط، يُرجى التوقف عن استخدام الموقع.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold arabic-text flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
              المعلومات التي نجمعها
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/40 space-y-2">
                <h3 className="font-semibold arabic-text">أ. المعلومات التي تقدمها مباشرة</h3>
                <ul className="text-muted-foreground arabic-text space-y-1 text-sm">
                  <li>• الاسم وعنوان البريد الإلكتروني عند إنشاء حساب</li>
                  <li>• المعلومات التي تُدخلها في نماذج التواصل</li>
                  <li>• تفضيلاتك الإخبارية والمصادر المفضلة</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-muted/40 space-y-2">
                <h3 className="font-semibold arabic-text">ب. المعلومات التي نجمعها تلقائياً</h3>
                <ul className="text-muted-foreground arabic-text space-y-1 text-sm">
                  <li>• عنوان IP وبيانات الجهاز والمتصفح</li>
                  <li>• الصفحات التي تزورها ومدة الزيارة</li>
                  <li>• الروابط التي تضغط عليها</li>
                  <li>• ملفات تعريف الارتباط (Cookies)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold arabic-text flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
              كيف نستخدم معلوماتك
            </h2>
            <p className="text-muted-foreground arabic-text leading-relaxed">نستخدم المعلومات التي نجمعها للأغراض التالية:</p>
            <ul className="text-muted-foreground arabic-text space-y-2 text-sm">
              <li className="flex gap-2"><span className="text-primary mt-0.5">✓</span> تقديم الخدمات الإخبارية وتحسين تجربة المستخدم</li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">✓</span> إرسال الملخصات اليومية والإشعارات التي اشتركت فيها</li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">✓</span> تحليل أنماط الاستخدام لتحسين الموقع</li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">✓</span> الرد على استفساراتك ورسائلك</li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">✓</span> عرض إعلانات ذات صلة (عبر Google AdSense وشبكات إعلانية أخرى)</li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">✓</span> الامتثال للمتطلبات القانونية</li>
            </ul>
          </section>

          {/* Section 4 - Cookies */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold arabic-text flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</span>
              ملفات تعريف الارتباط (Cookies)
            </h2>
            <p className="text-muted-foreground arabic-text leading-relaxed">
              نستخدم ملفات تعريف الارتباط لتحسين تجربتك على الموقع. تشمل أنواع الـ Cookies التي نستخدمها:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <p className="font-medium arabic-text text-sm">Cookies ضرورية</p>
                <p className="text-xs text-muted-foreground arabic-text">لازمة لعمل الموقع (تسجيل الدخول، الجلسة)</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <p className="font-medium arabic-text text-sm">Cookies التحليل</p>
                <p className="text-xs text-muted-foreground arabic-text">لفهم كيفية استخدام الزوار للموقع (Google Analytics)</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <p className="font-medium arabic-text text-sm">Cookies الإعلانات</p>
                <p className="text-xs text-muted-foreground arabic-text">لعرض إعلانات مناسبة (Google AdSense)</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <p className="font-medium arabic-text text-sm">Cookies التفضيلات</p>
                <p className="text-xs text-muted-foreground arabic-text">لحفظ إعداداتك (اللغة، الثيم، التفضيلات)</p>
              </div>
            </div>
            <p className="text-muted-foreground arabic-text text-sm">
              يمكنك التحكم في ملفات تعريف الارتباط من إعدادات متصفحك. تعطيل بعضها قد يؤثر على وظائف الموقع.
            </p>
          </section>

          {/* Section 5 - Google AdSense */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold arabic-text flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">5</span>
              الإعلانات (Google AdSense)
            </h2>
            <p className="text-muted-foreground arabic-text leading-relaxed">
              يستخدم موقعنا <strong>Google AdSense</strong> لعرض الإعلانات. قد تستخدم Google ملفات تعريف الارتباط لعرض إعلانات بناءً على زياراتك السابقة لهذا الموقع ومواقع أخرى. يمكنك إلغاء الاشتراك في الإعلانات المخصصة من خلال زيارة <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">إعدادات إعلانات Google</a>.
            </p>
            <p className="text-muted-foreground arabic-text text-sm">
              لمزيد من المعلومات حول كيفية استخدام Google للبيانات، يُرجى مراجعة <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">سياسة خصوصية Google</a>.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold arabic-text flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">6</span>
              مشاركة المعلومات مع أطراف ثالثة
            </h2>
            <p className="text-muted-foreground arabic-text leading-relaxed">
              لا نبيع أو نؤجر أو نتاجر بمعلوماتك الشخصية مع أطراف ثالثة. قد نشارك معلوماتك فقط في الحالات التالية:
            </p>
            <ul className="text-muted-foreground arabic-text space-y-1 text-sm">
              <li>• <strong>مزودو الخدمات:</strong> شركاء موثوقون يساعدوننا في تشغيل الموقع (الاستضافة، التحليلات)</li>
              <li>• <strong>المتطلبات القانونية:</strong> عند الطلب من جهات قانونية مختصة</li>
              <li>• <strong>حماية الحقوق:</strong> لحماية حقوق الموقع أو مستخدميه</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold arabic-text flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">7</span>
              حقوقك
            </h2>
            <p className="text-muted-foreground arabic-text leading-relaxed">وفقاً للوائح حماية البيانات الأوروبية (GDPR)، لديك الحقوق التالية:</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <p className="font-medium arabic-text text-sm">حق الوصول</p>
                <p className="text-xs text-muted-foreground arabic-text">طلب نسخة من بياناتك الشخصية</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <p className="font-medium arabic-text text-sm">حق التصحيح</p>
                <p className="text-xs text-muted-foreground arabic-text">تصحيح أي معلومات غير دقيقة</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <p className="font-medium arabic-text text-sm">حق الحذف</p>
                <p className="text-xs text-muted-foreground arabic-text">طلب حذف بياناتك الشخصية</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <p className="font-medium arabic-text text-sm">حق الاعتراض</p>
                <p className="text-xs text-muted-foreground arabic-text">الاعتراض على معالجة بياناتك</p>
              </div>
            </div>
            <p className="text-muted-foreground arabic-text text-sm">
              لممارسة أي من هذه الحقوق، تواصل معنا عبر: <a href="mailto:info@arabismart.vip" className="text-primary hover:underline">info@arabismart.vip</a>
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold arabic-text flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">8</span>
              أمان البيانات
            </h2>
            <p className="text-muted-foreground arabic-text leading-relaxed">
              نتخذ تدابير أمنية مناسبة لحماية بياناتك من الوصول غير المصرح به أو الكشف أو التعديل أو الحذف. يستخدم الموقع بروتوكول HTTPS لتشفير جميع الاتصالات.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold arabic-text flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">9</span>
              التغييرات على هذه السياسة
            </h2>
            <p className="text-muted-foreground arabic-text leading-relaxed">
              قد نُحدّث هذه السياسة من وقت لآخر. سنُخطرك بأي تغييرات جوهرية عبر نشر السياسة الجديدة على هذه الصفحة مع تحديث تاريخ "آخر تحديث". ننصحك بمراجعة هذه الصفحة دورياً.
            </p>
          </section>

          {/* Section 10 - Contact */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold arabic-text flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">10</span>
              التواصل معنا
            </h2>
            <div className="p-5 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <p className="text-muted-foreground arabic-text">
                إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يمكنك التواصل معنا:
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:info@arabismart.vip" className="text-primary hover:underline">info@arabismart.vip</a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-primary" />
                <a href="https://arabismart.vip/contact" className="text-primary hover:underline">arabismart.vip/contact</a>
              </div>
            </div>
          </section>

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
