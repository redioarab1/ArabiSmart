# 🚀 دليل نقل ArabiSmart News إلى Hetzner VPS

> **الوقت المقدر:** 2-3 ساعات | **المستوى:** متوسط

---

## 📋 المتطلبات الأولية

| المتطلب | التفاصيل |
|---|---|
| **سيرفر Hetzner** | CX21 أو أعلى (2 vCPU, 4GB RAM) |
| **نظام التشغيل** | Ubuntu 22.04 LTS |
| **النطاق** | arabismart.vip مُوجَّه لـ IP السيرفر |
| **OpenAI API Key** | للذكاء الاصطناعي (اختياري - الموقع يعمل بدونه) |

---

## 🔴 المرحلة الأولى: تصدير البيانات من Manus

### 1. تصدير قاعدة البيانات

```bash
# على جهازك المحلي أو في Manus
cd /home/ubuntu/arabismart-news
node scripts/export-db.mjs
# ينتج ملف: backup.sql
```

### 2. نقل الملفات إلى Hetzner

```bash
# نقل كود المشروع
rsync -avz --exclude node_modules --exclude .git \
  /home/ubuntu/arabismart-news/ \
  root@YOUR_HETZNER_IP:/opt/arabismart/

# أو عبر GitHub (موصى به):
git push origin main
# ثم على Hetzner:
git clone https://github.com/YOUR_REPO/arabismart-news /opt/arabismart
```

---

## 🔵 المرحلة الثانية: إعداد سيرفر Hetzner

### 1. تثبيت Docker

```bash
# على سيرفر Hetzner
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# تثبيت docker-compose
apt-get install -y docker-compose-plugin
```

### 2. إعداد ملف .env

```bash
cd /opt/arabismart
cp .env.hetzner .env
nano .env   # عدّل القيم المطلوبة
```

**القيم الإلزامية التي يجب تغييرها:**
```
MYSQL_ROOT_PASSWORD=كلمة_سر_قوية_جداً
MYSQL_PASSWORD=كلمة_سر_قوية_جداً
JWT_SECRET=سلسلة_عشوائية_64_حرف  # openssl rand -base64 64
S3_SECRET_KEY=كلمة_سر_قوية_جداً
```

### 3. إنشاء شهادة SSL مؤقتة (قبل Let's Encrypt)

```bash
mkdir -p /opt/arabismart/ssl
# شهادة مؤقتة لبدء التشغيل
openssl req -x509 -nodes -newkey rsa:4096 \
  -keyout /opt/arabismart/ssl/privkey.pem \
  -out /opt/arabismart/ssl/fullchain.pem \
  -days 1 -subj '/CN=arabismart.vip'
```

---

## 🟢 المرحلة الثالثة: تشغيل الخدمات

### 1. بدء قاعدة البيانات أولاً

```bash
cd /opt/arabismart
docker compose up -d mysql
echo "انتظار 30 ثانية لبدء MySQL..."
sleep 30
```

### 2. استيراد البيانات

```bash
# نسخ backup.sql إلى container
docker compose cp backup.sql mysql:/backup.sql

# استيراد البيانات
docker compose exec mysql bash -c \
  "mysql -u root -p\${MYSQL_ROOT_PASSWORD} arabismart < /backup.sql"
```

### 3. تشغيل كل الخدمات

```bash
docker compose up -d
docker compose ps   # تحقق أن كل الخدمات تعمل
docker compose logs -f backend   # مراقبة السجلات
```

---

## 🔐 المرحلة الرابعة: SSL الحقيقي (Let's Encrypt)

```bash
# تأكد أن DNS يشير لـ IP السيرفر
# ثم احصل على شهادة SSL حقيقية:
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d arabismart.vip -d www.arabismart.vip \
  --email redio.arab@gmail.com \
  --agree-tos --no-eff-email

# أعد تشغيل Nginx
docker compose restart nginx
```

---

## ✅ قائمة التحقق النهائية

```
قاعدة البيانات:
□ تم تصدير backup.sql من Manus
□ تم استيراد البيانات على Hetzner
□ الأخبار تظهر في الصفحة الرئيسية

الملفات والصور:
□ الصور القديمة لا تزال تعمل (روابط خارجية)
□ رفع صور جديدة يعمل (MinIO)

المصادقة:
□ تسجيل الدخول بـ m@3rb.se يعمل
□ لوحة الإدارة /admin/login تعمل
□ تسجيل الخروج يعمل

الوظائف الأساسية:
□ جلب RSS يعمل (كل 10 دقائق)
□ الملخص اليومي يُولَّد (7:00 صباحاً)
□ الأرشفة التلقائية تعمل (2:00 صباحاً)
□ Google Analytics يسجّل الزيارات

SSL والأداء:
□ الموقع يفتح على https://arabismart.vip
□ www.arabismart.vip يُعيد التوجيه لـ arabismart.vip
□ شهادة SSL صالحة وتتجدد تلقائياً
```

---

## 🔧 أوامر مفيدة بعد النشر

```bash
# مراقبة السجلات
docker compose logs -f backend

# إعادة تشغيل خدمة
docker compose restart backend

# تحديث الكود
git pull origin main
docker compose up -d --build backend

# نسخ احتياطي يومي لقاعدة البيانات
docker compose exec mysql mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} arabismart \
  > /backups/arabismart-$(date +%Y%m%d).sql

# الدخول لـ MinIO Console
# http://YOUR_IP:9001 (من SSH tunnel)
ssh -L 9001:localhost:9001 root@YOUR_HETZNER_IP
```

---

## ⚠️ ملاحظات مهمة

1. **الذكاء الاصطناعي:** الموقع يعمل بدون `OPENAI_API_KEY` لكن التصنيف التلقائي والملخص اليومي لن يعملا. يمكن إضافة المفتاح لاحقاً.

2. **الصور القديمة:** الصور المحفوظة على Manus S3 ستستمر في العمل طالما Manus يعمل. للنقل الكامل استخدم `rclone` لنقل الملفات لـ MinIO.

3. **النسخ الاحتياطي:** أضف cron job يومي لنسخ قاعدة البيانات:
   ```bash
   0 3 * * * docker compose -f /opt/arabismart/docker-compose.yml exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} arabismart > /backups/arabismart-$(date +\%Y\%m\%d).sql
   ```

4. **المراقبة:** يُنصح بتثبيت [Uptime Kuma](https://github.com/louislam/uptime-kuma) لمراقبة الموقع.

---

*آخر تحديث: أبريل 2026*
