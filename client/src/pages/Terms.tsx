import { useEffect } from "react";
import { Link } from "wouter";

export default function Terms() {
  useEffect(() => {
    document.title = "بنود الخدمة | ArabiSmart News";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-primary hover:underline text-sm flex items-center gap-1">
            ← العودة للرئيسية
          </Link>
          <span className="text-muted-foreground">|</span>
          <h1 className="text-lg font-bold">بنود الخدمة</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="prose prose-invert max-w-none space-y-8">

          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-2xl font-bold mb-2">بنود الخدمة</h2>
            <p className="text-muted-foreground text-sm">آخر تحديث: يونيو 2026</p>
          </div>

          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-xl font-semibold">1. قبول الشروط</h3>
            <p className="text-muted-foreground leading-relaxed">
              باستخدامك لموقع ArabiSmart News ("الموقع")، فإنك توافق على الالتزام بهذه البنود والشروط.
              إذا كنت لا توافق على أي جزء من هذه البنود، يرجى عدم استخدام الموقع.
            </p>
          </section>

          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-xl font-semibold">2. وصف الخدمة</h3>
            <p className="text-muted-foreground leading-relaxed">
              ArabiSmart News هو موقع إخباري يجمع الأخبار من مصادر عربية متعددة موثوقة ويعرضها في مكان واحد.
              يستخدم الموقع تقنيات الذكاء الاصطناعي لتصنيف الأخبار وتحليلها وتلخيصها.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
              <li>تجميع الأخبار من مصادر RSS موثوقة</li>
              <li>تصنيف الأخبار وترتيبها حسب الأهمية</li>
              <li>توفير ملخصات يومية للأخبار البارزة</li>
              <li>خدمة البحث في الأخبار</li>
            </ul>
          </section>

          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-xl font-semibold">3. حقوق الملكية الفكرية</h3>
            <p className="text-muted-foreground leading-relaxed">
              محتوى الأخبار المعروض على الموقع هو ملك للمصادر الأصلية التي نشرتها.
              ArabiSmart News يعرض ملخصات ومقتطفات مع روابط مباشرة للمصادر الأصلية وفق مبدأ الاستخدام العادل.
              التصميم والكود البرمجي للموقع هو ملك حصري لـ ArabiSmart News.
            </p>
          </section>

          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-xl font-semibold">4. سياسة الاستخدام المقبول</h3>
            <p className="text-muted-foreground leading-relaxed">يُحظر على المستخدمين:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
              <li>استخدام الموقع لأغراض غير قانونية</li>
              <li>نسخ أو إعادة نشر المحتوى دون إذن مسبق</li>
              <li>محاولة اختراق أو تعطيل الموقع</li>
              <li>إرسال محتوى مسيء أو مضلل</li>
              <li>استخدام برامج آلية لجمع البيانات بشكل مفرط</li>
            </ul>
          </section>

          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-xl font-semibold">5. إخلاء المسؤولية</h3>
            <p className="text-muted-foreground leading-relaxed">
              ArabiSmart News يجمع الأخبار من مصادر خارجية ولا يتحمل مسؤولية دقة أو صحة المحتوى المنشور من تلك المصادر.
              الآراء الواردة في الأخبار تعبر عن وجهات نظر أصحابها ولا تعكس بالضرورة موقف الموقع.
            </p>
          </section>

          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-xl font-semibold">6. حسابات المستخدمين</h3>
            <p className="text-muted-foreground leading-relaxed">
              عند إنشاء حساب على الموقع، أنت مسؤول عن:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mr-4">
              <li>الحفاظ على سرية بيانات حسابك</li>
              <li>جميع الأنشطة التي تتم عبر حسابك</li>
              <li>إخطارنا فوراً عند أي استخدام غير مصرح به</li>
            </ul>
          </section>

          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-xl font-semibold">7. التعديلات على البنود</h3>
            <p className="text-muted-foreground leading-relaxed">
              نحتفظ بالحق في تعديل هذه البنود في أي وقت. سيتم إخطار المستخدمين بالتغييرات الجوهرية عبر الموقع.
              استمرارك في استخدام الموقع بعد التعديلات يعني قبولك للبنود الجديدة.
            </p>
          </section>

          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-xl font-semibold">8. القانون المطبق</h3>
            <p className="text-muted-foreground leading-relaxed">
              تخضع هذه البنود لقوانين المملكة السويدية. أي نزاع يتعلق بهذه البنود يخضع للاختصاص القضائي في السويد.
            </p>
          </section>

          <section className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="text-xl font-semibold">9. التواصل معنا</h3>
            <p className="text-muted-foreground leading-relaxed">
              لأي استفسار حول بنود الخدمة، يمكنك التواصل معنا عبر:
            </p>
            <ul className="list-none text-muted-foreground space-y-2">
              <li>🌐 الموقع: <a href="https://arabismart.vip" className="text-primary hover:underline">arabismart.vip</a></li>
              <li>📘 فيسبوك: <a href="https://www.facebook.com/share/1Dr2tHQcKM/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">صفحتنا على فيسبوك</a></li>
            </ul>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-primary hover:underline">سياسة الخصوصية</Link>
          <Link href="/about" className="hover:text-primary hover:underline">من نحن</Link>
          <Link href="/" className="hover:text-primary hover:underline">الصفحة الرئيسية</Link>
        </div>
      </main>
    </div>
  );
}
