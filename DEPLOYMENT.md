# دليل نشر موقع ArabiSmart News 🚀

دليل شامل لنشر موقع ArabiSmart News على استضافة خارجية مستقلة.

---

## 📋 نظرة عامة

**ArabiSmart News** هو موقع إخباري ذكي يجمع الأخبار تلقائياً من 21 مصدر RSS (عربي، سويدي، عالمي) مع نظام تصنيف تلقائي باستخدام الذكاء الاصطناعي.

### المميزات الرئيسية
- ✅ جمع تلقائي للأخبار من 21 مصدر RSS
- ✅ تصنيف ذكي للأخبار (عاجلة، محلية، رياضة، سياسة، اقتصاد، عالمية)
- ✅ فلاتر متقدمة (حسب المصدر، التصنيف، الفترة الزمنية)
- ✅ بحث نصي كامل
- ✅ واجهة ثنائية اللغة (عربي/سويدي)
- ✅ تحديث تلقائي كل 30 دقيقة
- ✅ 14,641+ خبر محفوظ في قاعدة البيانات

---

## 🛠️ التقنيات المستخدمة

### Frontend
- **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui**
- **Vite** (build tool)
- **tRPC Client** (type-safe API calls)

### Backend
- **Node.js 22** + **Express 4**
- **tRPC 11** (type-safe API)
- **Drizzle ORM** (database queries)
- **rss-parser** (RSS feed parsing)

### Database
- **PostgreSQL** (أو MySQL/TiDB متوافق)
- 4 جداول رئيسية: `news`, `sources`, `categories`, `newsCategories`

### AI Integration
- **LLM API** للتصنيف التلقائي (يمكن استبداله بـ OpenAI/Anthropic)

---

## 📦 المتطلبات

### متطلبات النظام
- **Node.js**: 18.x أو أحدث (يفضل 22.x)
- **PostgreSQL**: 14.x أو أحدث
- **pnpm**: 8.x أو أحدث (أو npm/yarn)
- **Memory**: 512 MB على الأقل
- **Storage**: 1 GB على الأقل

### خدمات خارجية مطلوبة
1. **قاعدة بيانات PostgreSQL** (يمكن استخدام خدمات مجانية مثل):
   - [Supabase](https://supabase.com) - مجاني حتى 500 MB
   - [Neon](https://neon.tech) - مجاني حتى 3 GB
   - [Railway PostgreSQL](https://railway.app) - $5/شهر
   - [Render PostgreSQL](https://render.com) - مجاني

2. **LLM API** (للتصنيف التلقائي):
   - [OpenAI API](https://platform.openai.com) - $0.002/1K tokens
   - [Anthropic Claude](https://anthropic.com) - $0.003/1K tokens
   - أو أي LLM API متوافق

---

## 🚀 خيارات الاستضافة

### الخيار 1: Vercel (Frontend) + Railway (Backend + Database) ⭐ موصى به

**المميزات:**
- سهل النشر والإدارة
- مجاني للمشاريع الصغيرة
- SSL تلقائي
- CDN عالمي

**التكلفة:**
- Vercel: مجاني (حتى 100 GB bandwidth)
- Railway: $5/شهر (500 MB RAM + PostgreSQL)

### الخيار 2: VPS خاص (استقلالية كاملة)

**المميزات:**
- تحكم كامل
- لا قيود على الموارد
- خصوصية أعلى

**التكلفة:**
- DigitalOcean Droplet: $6/شهر (1 GB RAM)
- Hetzner VPS: €4.5/شهر (2 GB RAM)
- Contabo VPS: €5/شهر (4 GB RAM)

### الخيار 3: Render (All-in-One)

**المميزات:**
- نشر متكامل (Frontend + Backend + Database)
- إعداد بسيط

**التكلفة:**
- Web Service: $7/شهر
- PostgreSQL: مجاني (90 يوم، ثم $7/شهر)

---

## 📝 إعداد المتغيرات البيئية

### 1. إنشاء ملف `.env` في المجلد الرئيسي

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Server
PORT=3000
NODE_ENV=production

# JWT Secret (أنشئ مفتاح عشوائي قوي)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"

# LLM API (للتصنيف التلقائي)
BUILT_IN_FORGE_API_URL="https://api.openai.com/v1"
BUILT_IN_FORGE_API_KEY="sk-your-openai-api-key"

# OAuth (اختياري - للمصادقة)
OAUTH_SERVER_URL="https://your-oauth-server.com"
VITE_OAUTH_PORTAL_URL="https://your-oauth-portal.com"
VITE_APP_ID="your-app-id"

# Owner Info (اختياري)
OWNER_OPEN_ID="admin"
OWNER_NAME="Admin"

# Frontend (Vite)
VITE_APP_TITLE="ArabiSmart News"
VITE_APP_LOGO="/logo.png"
VITE_FRONTEND_FORGE_API_KEY="your-frontend-api-key"
VITE_FRONTEND_FORGE_API_URL="https://api.openai.com/v1"
```

### 2. توليد JWT Secret قوي

```bash
# استخدم هذا الأمر لتوليد مفتاح عشوائي
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔧 خطوات النشر

### الطريقة 1: Vercel + Railway

#### أ) نشر Backend على Railway

1. **إنشاء حساب على Railway**
   - اذهب إلى [railway.app](https://railway.app)
   - سجل دخول باستخدام GitHub

2. **إنشاء مشروع جديد**
   ```bash
   # في المجلد الرئيسي للموقع
   railway login
   railway init
   railway link
   ```

3. **إضافة PostgreSQL**
   - من لوحة التحكم: New → Database → PostgreSQL
   - انسخ `DATABASE_URL` من المتغيرات

4. **إضافة المتغيرات البيئية**
   - اذهب إلى Variables
   - أضف جميع المتغيرات من `.env`

5. **نشر Backend**
   ```bash
   railway up
   ```

6. **الحصول على رابط Backend**
   - Settings → Generate Domain
   - انسخ الرابط (مثال: `https://your-app.up.railway.app`)

#### ب) نشر Frontend على Vercel

1. **تعديل ملف `client/src/lib/trpc.ts`**
   ```typescript
   const baseUrl = import.meta.env.PROD 
     ? 'https://your-backend-url.up.railway.app' // ضع رابط Railway هنا
     : 'http://localhost:3000';
   ```

2. **إنشاء حساب على Vercel**
   - اذهب إلى [vercel.com](https://vercel.com)
   - سجل دخول باستخدام GitHub

3. **رفع الكود إلى GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/arabismart-news.git
   git push -u origin main
   ```

4. **استيراد المشروع في Vercel**
   - New Project → Import من GitHub
   - اختر repository
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `pnpm run build`
   - Output Directory: `dist`

5. **إضافة المتغيرات البيئية**
   - أضف جميع المتغيرات التي تبدأ بـ `VITE_`

6. **نشر الموقع**
   - اضغط Deploy
   - انتظر حتى يكتمل البناء

---

### الطريقة 2: VPS خاص (Ubuntu)

#### 1. إعداد الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت pnpm
npm install -g pnpm

# تثبيت PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# تثبيت Nginx
sudo apt install -y nginx

# تثبيت Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. إعداد PostgreSQL

```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة بيانات ومستخدم
CREATE DATABASE arabismart_news;
CREATE USER arabismart WITH PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE arabismart_news TO arabismart;
\q
```

#### 3. رفع الكود

```bash
# إنشاء مجلد للموقع
sudo mkdir -p /var/www/arabismart-news
sudo chown $USER:$USER /var/www/arabismart-news

# رفع الملف المضغوط
scp arabismart-news-export.tar.gz user@your-server:/var/www/

# فك الضغط
cd /var/www
tar -xzf arabismart-news-export.tar.gz
cd arabismart-news

# تثبيت الحزم
pnpm install --prod
```

#### 4. إعداد المتغيرات البيئية

```bash
# إنشاء ملف .env
nano .env

# أضف المتغيرات (راجع القسم السابق)
# احفظ بـ Ctrl+X ثم Y
```

#### 5. تطبيق migrations على قاعدة البيانات

```bash
# تشغيل migrations
pnpm drizzle-kit push
```

#### 6. بناء Frontend

```bash
# بناء Frontend
pnpm run build
```

#### 7. إعداد PM2 (Process Manager)

```bash
# تثبيت PM2
npm install -g pm2

# تشغيل Backend
pm2 start server/_core/index.ts --name arabismart-backend --interpreter tsx

# حفظ التكوين
pm2 save
pm2 startup
```

#### 8. إعداد Nginx

```bash
# إنشاء ملف تكوين
sudo nano /etc/nginx/sites-available/arabismart-news
```

أضف التكوين التالي:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend (Static Files)
    location / {
        root /var/www/arabismart-news/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/arabismart-news /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 9. إعداد SSL (HTTPS)

```bash
# الحصول على شهادة SSL مجانية
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# تجديد تلقائي
sudo certbot renew --dry-run
```

---

## 🗄️ تصدير قاعدة البيانات

### من Manus إلى PostgreSQL خارجي

```bash
# 1. تصدير البيانات من Manus (في لوحة التحكم)
# اذهب إلى Database → Export → SQL Dump

# 2. استيراد البيانات إلى PostgreSQL الجديد
psql -h your-host -U your-user -d arabismart_news < dump.sql

# أو باستخدام pg_restore إذا كان الملف بصيغة custom
pg_restore -h your-host -U your-user -d arabismart_news dump.backup
```

---

## 🔄 إعداد Cron Job (تحديث تلقائي)

الموقع يحتوي على نظام تحديث تلقائي مدمج يعمل كل 30 دقيقة. لكن يمكنك إضافة Cron Job احتياطي:

```bash
# فتح crontab
crontab -e

# إضافة مهمة تحديث كل 30 دقيقة
*/30 * * * * curl -X POST http://localhost:3000/api/trpc/news.fetchAllNews
```

---

## 🔧 استبدال LLM API

إذا كنت تريد استخدام OpenAI بدلاً من Manus LLM:

### 1. تعديل `server/_core/llm.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function invokeLLM(params: any) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // أو gpt-3.5-turbo للتوفير
    messages: params.messages,
    response_format: params.response_format,
    temperature: 0.3,
  });
  
  return response;
}
```

### 2. تحديث `.env`

```bash
OPENAI_API_KEY="sk-your-openai-api-key"
```

### 3. تثبيت حزمة OpenAI

```bash
pnpm add openai
```

---

## 📊 مراقبة الأداء

### استخدام PM2 Monitor

```bash
# عرض حالة العمليات
pm2 status

# عرض السجلات
pm2 logs arabismart-backend

# عرض استخدام الموارد
pm2 monit
```

### استخدام PostgreSQL Monitoring

```bash
# الاتصال بقاعدة البيانات
psql -U arabismart -d arabismart_news

# عرض عدد الأخبار
SELECT COUNT(*) FROM news;

# عرض عدد المصادر النشطة
SELECT COUNT(*) FROM sources WHERE is_active = true;

# عرض آخر 10 أخبار
SELECT title, source, published_at FROM news ORDER BY published_at DESC LIMIT 10;
```

---

## 🐛 استكشاف الأخطاء

### مشكلة: Backend لا يعمل

```bash
# التحقق من السجلات
pm2 logs arabismart-backend

# إعادة تشغيل
pm2 restart arabismart-backend

# التحقق من المنفذ
netstat -tulpn | grep 3000
```

### مشكلة: قاعدة البيانات لا تتصل

```bash
# التحقق من PostgreSQL
sudo systemctl status postgresql

# التحقق من الاتصال
psql -U arabismart -d arabismart_news -c "SELECT 1;"

# التحقق من DATABASE_URL في .env
cat .env | grep DATABASE_URL
```

### مشكلة: RSS feeds لا تُجمع

```bash
# التحقق من السجلات
pm2 logs arabismart-backend | grep "RSS"

# اختبار يدوي
curl -X POST http://localhost:3000/api/trpc/news.fetchAllNews
```

### مشكلة: التصنيف التلقائي لا يعمل

```bash
# التحقق من LLM API key
cat .env | grep FORGE_API_KEY

# اختبار الاتصال
curl -H "Authorization: Bearer $BUILT_IN_FORGE_API_KEY" \
  https://api.openai.com/v1/models
```

---

## 🔐 الأمان

### توصيات الأمان

1. **استخدم HTTPS دائماً** (Certbot مجاني)
2. **غيّر JWT_SECRET** إلى مفتاح عشوائي قوي
3. **لا تشارك ملف `.env`** أبداً
4. **استخدم كلمات مرور قوية** لقاعدة البيانات
5. **فعّل Firewall**:
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```
6. **حدّث النظام بانتظام**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## 📈 التحسينات المستقبلية

### أفكار للتطوير

1. **إضافة نظام تعليقات** للمستخدمين
2. **إضافة نظام إشعارات** للأخبار العاجلة
3. **إضافة RSS feed** للموقع نفسه
4. **إضافة API عام** للمطورين
5. **إضافة تطبيق موبايل** (React Native)
6. **إضافة نظام ترجمة تلقائي** بين العربية والسويدية
7. **إضافة تحليلات متقدمة** (Google Analytics)

---

## 📞 الدعم

### الموارد المفيدة

- **React**: https://react.dev
- **tRPC**: https://trpc.io
- **Drizzle ORM**: https://orm.drizzle.team
- **Tailwind CSS**: https://tailwindcss.com
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **PostgreSQL Docs**: https://www.postgresql.org/docs

---

## 📄 الترخيص

هذا المشروع مفتوح المصدر ويمكن استخدامه بحرية.

---

**تم إنشاء هذا الدليل بواسطة Manus AI** 🤖

آخر تحديث: فبراير 2026
