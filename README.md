# ArabiSmart News - موقع الأخبار الذكي

منصة أخبار تلقائية متكاملة تجمع وتعرض الأخبار من 17 مصدر RSS سويدي وعربي مع لوحة تحكم إدارية كاملة.

## ✨ الميزات الرئيسية

### 🔄 جلب تلقائي للأخبار
- **17 مصدر RSS** (12 سويدي + 5 عربي/دولي)
- **تحديث تلقائي** كل 10 دقائق باستخدام Cron Jobs
- **معالجة ذكية** لملفات RSS/XML
- **منع التكرار** عبر التحقق من الروابط الفريدة
- **استخراج شامل** للبيانات: العنوان، الوصف، الرابط، الصورة، التاريخ، المصدر

### 🎛️ لوحة تحكم إدارية
- **نظام مصادقة آمن** مع Manus OAuth
- **إدارة كاملة للأخبار**: إضافة، تعديل، حذف
- **تصفية متقدمة**: حسب المصدر، الفئة، التاريخ
- **وظيفة بحث** قوية
- **إحصائيات شاملة**: عدد الأخبار، المصادر النشطة، آخر تحديث

### 🌐 واجهة مستخدم عصرية
- **تصميم أنيق واحترافي** مع Tailwind CSS 4
- **دعم كامل للغة العربية** مع RTL
- **متجاوب بالكامل**: موبايل، تابلت، ديسكتوب
- **تصنيف ذكي**: أخبار سويدية / عربية
- **تصفية وبحث** سهلة الاستخدام
- **ترقيم صفحات** سلس

## 🛠️ التقنيات المستخدمة

### Backend
- **Node.js + Express** - خادم الويب
- **tRPC** - واجهة برمجة التطبيقات مع Type Safety
- **MySQL/TiDB** - قاعدة البيانات
- **Drizzle ORM** - إدارة قاعدة البيانات
- **RSS Parser** - معالجة خلاصات RSS
- **node-cron** - جدولة المهام التلقائية

### Frontend
- **React 19** - مكتبة واجهة المستخدم
- **Vite** - أداة البناء السريعة
- **Tailwind CSS 4** - إطار التنسيق
- **shadcn/ui** - مكونات UI جاهزة
- **Wouter** - التوجيه (Routing)
- **TanStack Query** - إدارة حالة الخادم

## 📁 هيكل المشروع

```
arabismart-news/
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── pages/         # صفحات التطبيق
│   │   │   ├── Home.tsx           # الصفحة الرئيسية
│   │   │   └── AdminDashboard.tsx # لوحة التحكم
│   │   ├── components/    # مكونات UI
│   │   ├── lib/          # مكتبات مساعدة
│   │   └── index.css     # التنسيقات العامة
│   └── public/           # ملفات ثابتة
├── server/                # Backend (Node.js)
│   ├── routers.ts        # tRPC routers
│   ├── db.ts             # دوال قاعدة البيانات
│   ├── rssFetcher.ts     # خدمة جلب RSS
│   ├── cronJobs.ts       # مهام Cron
│   ├── rssSources.json   # مصادر RSS
│   └── _core/            # ملفات النظام الأساسية
├── drizzle/              # Schema وmigrationsقاعدة البيانات
│   └── schema.ts         # تعريف الجداول
└── README.md             # هذا الملف
```

## 🚀 البدء

### المتطلبات الأساسية
- Node.js 22+
- pnpm
- قاعدة بيانات MySQL/TiDB

### التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd arabismart-news
```

2. **تثبيت الحزم**
```bash
pnpm install
```

3. **إعداد قاعدة البيانات**
```bash
# توليد ملفات الهجرة
pnpm drizzle-kit generate

# تطبيق الهجرات (استخدم webdev_execute_sql في بيئة Manus)
```

4. **إضافة مصادر RSS**
```bash
node server/seedRssSources.mjs
```

5. **تشغيل المشروع**
```bash
# وضع التطوير
pnpm dev

# وضع الإنتاج
pnpm build
pnpm start
```

## 📊 مصادر الأخبار

### مصادر سويدية (12 مصدر)
1. الكومبس (Alkompis)
2. راديو السويد (Sveriges Radio - Arabic)
3. أكتر (Aktarr)
4. Swed24
5. المركز السويدي للمعلومات
6. Dagens Nyheter (DN)
7. Svenska Dagbladet (SvD)
8. SVT Nyheter
9. Expressen
10. Göteborgs-Posten (GP)
11. Sydsvenskan
12. Aftonbladet

### مصادر عربية ودولية (5 مصادر)
1. الجزيرة
2. سكاي نيوز عربية
3. العربية
4. روسيا اليوم (RT Arabic)
5. فرانس 24 (France 24)

## 🔐 نظام المصادقة

يستخدم المشروع **Manus OAuth** لنظام مصادقة آمن:
- تسجيل الدخول عبر Manus
- حماية لوحة التحكم الإدارية
- إدارة الجلسات بشكل آمن

## 🧪 الاختبار

```bash
# تشغيل جميع الاختبارات
pnpm test

# فحص الأنواع (TypeScript)
pnpm check
```

## 📡 API Endpoints

### الأخبار (Public)
- `news.list` - قائمة الأخبار مع pagination وتصفية
- `news.getById` - الحصول على خبر محدد
- `news.stats` - إحصائيات الأخبار

### مصادر RSS (Public)
- `rssSources.list` - قائمة جميع مصادر RSS

### الإدارة (Protected)
- `admin.addNews` - إضافة خبر يدوياً
- `admin.updateNews` - تعديل خبر موجود
- `admin.deleteNews` - حذف خبر

## 🔄 نظام Cron Jobs

يتم تشغيل مهمة Cron تلقائياً كل **10 دقائق** لجلب الأخبار الجديدة من جميع المصادر النشطة.

```typescript
// في server/cronJobs.ts
cron.schedule("*/10 * * * *", async () => {
  await fetchAllRSS();
});
```

## 🌍 دعم اللغات

- **العربية** (RTL): دعم كامل مع خط Tajawal
- **السويدية**: دعم كامل
- **الإنجليزية**: دعم كامل

## 📝 المتغيرات البيئية

المتغيرات التالية يتم حقنها تلقائياً في بيئة Manus:

```env
DATABASE_URL=<mysql-connection-string>
JWT_SECRET=<session-secret>
VITE_APP_ID=<manus-oauth-app-id>
OAUTH_SERVER_URL=<manus-oauth-url>
```

## 🚀 النشر

### استضافة Manus (موصى بها)
1. حفظ نقطة تفتيش (Checkpoint)
2. النقر على زر "Publish" في واجهة الإدارة
3. اختيار نطاق مخصص (اختياري)

### استضافة خارجية
يمكن نشر المشروع على:
- Vercel
- Railway
- Render
- أي خدمة تدعم Node.js

## 📄 الترخيص

MIT License

## 👨‍💻 المطور

تم تطويره بواسطة **Manus AI**

---

**ملاحظة**: هذا المشروع تم تطويره بالكامل باستخدام منصة Manus لتطوير المواقع.
