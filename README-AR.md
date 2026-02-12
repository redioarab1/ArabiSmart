# ArabiSmart News 📰

<div dir="rtl">

موقع إخباري ذكي يجمع الأخبار تلقائياً من 21 مصدر RSS (عربي، سويدي، عالمي) مع نظام تصنيف تلقائي باستخدام الذكاء الاصطناعي.

</div>

---

## ✨ المميزات

<div dir="rtl">

- ✅ **جمع تلقائي للأخبار** من 21 مصدر RSS موثوق
- ✅ **تصنيف ذكي** باستخدام AI (عاجلة، محلية، رياضة، سياسة، اقتصاد، عالمية)
- ✅ **فلاتر متقدمة** حسب المصدر، التصنيف، والفترة الزمنية
- ✅ **بحث نصي كامل** عبر جميع الأخبار
- ✅ **واجهة ثنائية اللغة** (عربي/سويدي)
- ✅ **تحديث تلقائي** كل 30 دقيقة
- ✅ **تصميم متجاوب** يعمل على جميع الأجهزة
- ✅ **SEO محسّن** مع sitemap ديناميكي
- ✅ **14,641+ خبر** محفوظ في قاعدة البيانات

</div>

---

## 🎯 المصادر الإخبارية

### 🇸🇦 المصادر العربية (9 مصادر)
<div dir="rtl">

1. **الجزيرة** - أخبار عربية وعالمية
2. **BBC العربية** - أخبار دولية
3. **سكاي نيوز عربية** - أخبار عاجلة
4. **الشرق الأوسط** - أخبار الشرق الأوسط
5. **العربي الجديد** - تحليلات سياسية
6. **CNN بالعربية** - أخبار عالمية
7. **فرانس 24** - أخبار فرنسية وعالمية
8. **DW عربية** - أخبار ألمانية وعالمية
9. **RT Arabic** - أخبار روسية وعالمية

</div>

### 🇸🇪 المصادر السويدية (8 مصادر)
<div dir="rtl">

1. **Svenska Dagbladet** - صحيفة سويدية رئيسية
2. **Dagens Nyheter** - أكبر صحيفة سويدية
3. **Expressen** - أخبار سويدية عاجلة
4. **Aftonbladet** - صحيفة مسائية سويدية
5. **SVT Nyheter** - التلفزيون السويدي
6. **Göteborgs-Posten** - أخبار غوتنبرغ
7. **راديو السويد** - إذاعة السويد الرسمية
8. **المركز السويدي** - أخبار الجالية العربية

</div>

### 🌍 المصادر العالمية (4 مصادر)
<div dir="rtl">

1. **Reuters** - وكالة الأنباء العالمية
2. **Associated Press** - وكالة الأنباء الأمريكية
3. **Bloomberg** - أخبار اقتصادية
4. **The Guardian** - صحيفة بريطانية

</div>

---

## 🛠️ التقنيات المستخدمة

### Frontend
- **React 19** - مكتبة واجهة المستخدم
- **TypeScript** - لغة البرمجة
- **Tailwind CSS 4** - إطار عمل CSS
- **shadcn/ui** - مكونات UI جاهزة
- **Vite** - أداة البناء
- **tRPC Client** - استدعاءات API آمنة

### Backend
- **Node.js 22** - بيئة التشغيل
- **Express 4** - إطار عمل الخادم
- **tRPC 11** - API آمن من حيث الأنواع
- **Drizzle ORM** - استعلامات قاعدة البيانات
- **rss-parser** - تحليل RSS feeds

### Database
- **PostgreSQL** - قاعدة البيانات
- 4 جداول: `news`, `sources`, `categories`, `newsCategories`

### AI Integration
- **LLM API** - للتصنيف التلقائي

---

## 📦 التثبيت والتشغيل

### المتطلبات
- Node.js 18+ (يفضل 22.x)
- PostgreSQL 14+
- pnpm 8+

### خطوات التثبيت

```bash
# 1. استنساخ المشروع
git clone https://github.com/yourusername/arabismart-news.git
cd arabismart-news

# 2. تثبيت الحزم
pnpm install

# 3. إعداد قاعدة البيانات
# أنشئ قاعدة بيانات PostgreSQL جديدة
createdb arabismart_news

# 4. إعداد المتغيرات البيئية
cp .env.example .env
# عدّل .env وأضف قيمك

# 5. تطبيق migrations
pnpm drizzle-kit push

# 6. تشغيل الموقع
pnpm dev

# الموقع سيعمل على http://localhost:3000
```

---

## 🚀 النشر

<div dir="rtl">

لنشر الموقع على استضافة خارجية، راجع **[دليل النشر الشامل](./DEPLOYMENT.md)** الذي يحتوي على:

- خطوات النشر على Vercel + Railway
- خطوات النشر على VPS خاص
- إعداد قاعدة البيانات
- إعداد SSL/HTTPS
- استكشاف الأخطاء
- نصائح الأمان

</div>

---

## 📂 هيكل المشروع

```
arabismart-news/
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── pages/         # صفحات الموقع
│   │   ├── components/    # مكونات UI
│   │   ├── lib/           # مكتبات مساعدة
│   │   └── App.tsx        # التطبيق الرئيسي
│   └── public/            # ملفات ثابتة
├── server/                # Backend (Node.js)
│   ├── routers.ts         # tRPC procedures
│   ├── db.ts              # استعلامات قاعدة البيانات
│   ├── ai-classifier.ts   # نظام التصنيف الذكي
│   ├── rss-scraper.ts     # جمع الأخبار من RSS
│   └── _core/             # إعدادات الخادم
├── drizzle/               # Database schema & migrations
│   └── schema.ts          # تعريف الجداول
├── DEPLOYMENT.md          # دليل النشر الشامل
└── package.json           # الحزم والاعتماديات
```

---

## 🔧 الاستخدام

### إضافة مصدر RSS جديد

```typescript
// في server/db.ts
await db.insert(sources).values({
  name: 'اسم المصدر',
  url: 'https://example.com/rss',
  category: 'عربية', // أو 'SE' أو 'EN'
  language: 'ar',    // أو 'sv' أو 'en'
  isActive: true,
});
```

### تحديث الأخبار يدوياً

```bash
# استدعاء API لجمع الأخبار
curl -X POST http://localhost:3000/api/trpc/news.fetchAllNews
```

### عرض الإحصائيات

```sql
-- عدد الأخبار الكلي
SELECT COUNT(*) FROM news;

-- عدد الأخبار حسب المصدر
SELECT source, COUNT(*) as count 
FROM news 
GROUP BY source 
ORDER BY count DESC;

-- عدد الأخبار حسب التصنيف
SELECT c.name_ar, COUNT(*) as count
FROM news_categories nc
JOIN categories c ON nc.category_id = c.id
GROUP BY c.name_ar;
```

---

## 🎨 التخصيص

### تغيير الألوان

<div dir="rtl">

عدّل ملف `client/src/index.css`:

</div>

```css
:root {
  --primary: 220 90% 56%;        /* اللون الأساسي */
  --secondary: 210 40% 96.1%;    /* اللون الثانوي */
  --accent: 210 40% 96.1%;       /* لون التمييز */
}
```

### تغيير الشعار

<div dir="rtl">

استبدل ملف `client/public/logo.png` بشعارك الخاص.

</div>

### تغيير عنوان الموقع

<div dir="rtl">

عدّل `VITE_APP_TITLE` في ملف `.env`:

</div>

```bash
VITE_APP_TITLE="اسم موقعك"
```

---

## 🐛 استكشاف الأخطاء

### مشكلة: الأخبار لا تُجمع

<div dir="rtl">

**الحل:**
1. تحقق من اتصال الإنترنت
2. تحقق من صلاحية روابط RSS
3. راجع السجلات: `pnpm logs`

</div>

### مشكلة: التصنيف التلقائي لا يعمل

<div dir="rtl">

**الحل:**
1. تحقق من `BUILT_IN_FORGE_API_KEY` في `.env`
2. تحقق من رصيد LLM API
3. راجع السجلات للأخطاء

</div>

### مشكلة: قاعدة البيانات لا تتصل

<div dir="rtl">

**الحل:**
1. تحقق من `DATABASE_URL` في `.env`
2. تحقق من تشغيل PostgreSQL
3. تحقق من صلاحيات المستخدم

</div>

---

## 📊 الإحصائيات

<div dir="rtl">

- **14,641+** خبر محفوظ
- **21** مصدر نشط
- **6** تصنيفات ذكية
- **3** لغات (عربي، سويدي، إنجليزي)
- **تحديث كل 30 دقيقة**

</div>

---

## 🤝 المساهمة

<div dir="rtl">

المساهمات مرحب بها! يرجى:

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

</div>

---

## 📄 الترخيص

<div dir="rtl">

هذا المشروع مفتوح المصدر ومتاح للاستخدام الحر.

</div>

---

## 📞 التواصل

<div dir="rtl">

- **الموقع**: [arabismart-news.manus.space](https://arabismart-news.manus.space)
- **البريد الإلكتروني**: contact@arabismart.com
- **GitHub**: [github.com/yourusername/arabismart-news](https://github.com/yourusername/arabismart-news)

</div>

---

## 🙏 شكر خاص

<div dir="rtl">

- جميع المصادر الإخبارية على توفير RSS feeds
- مجتمع React و TypeScript
- فريق Manus AI على الدعم

</div>

---

<div align="center" dir="rtl">

**صُنع بـ ❤️ باستخدام Manus AI**

آخر تحديث: فبراير 2026

</div>
