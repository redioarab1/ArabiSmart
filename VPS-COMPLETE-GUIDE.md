# 🚀 دليل النشر الكامل على VPS

## نظرة عامة

هذا الدليل يشرح خطوة بخطوة كيفية نشر موقع **ArabiSmart News** على سيرفر VPS خاص باستخدام **سكريبت تثبيت تلقائي**.

**المدة الإجمالية:** 15-20 دقيقة  
**المستوى:** مبتدئ (لا يحتاج خبرة تقنية)

---

## 📋 المتطلبات

### 1. VPS (خادم افتراضي خاص)

يمكنك شراء VPS من أي من هذه المنصات:

| المنصة | السعر الشهري | المواصفات | الرابط |
|--------|--------------|-----------|--------|
| **Hetzner** | €4.15 (~$4.5) | 2 CPU, 4GB RAM, 40GB SSD | [hetzner.com](https://www.hetzner.com/cloud) |
| **DigitalOcean** | $6 | 1 CPU, 1GB RAM, 25GB SSD | [digitalocean.com](https://www.digitalocean.com) |
| **Vultr** | $6 | 1 CPU, 1GB RAM, 25GB SSD | [vultr.com](https://www.vultr.com) |
| **Contabo** | €4.99 (~$5.5) | 4 CPU, 6GB RAM, 200GB SSD | [contabo.com](https://contabo.com) |

**التوصية:** Hetzner (أفضل سعر/أداء)

### 2. نظام التشغيل

- **Ubuntu 22.04 LTS** (موصى به)
- أو Ubuntu 20.04 / 24.04

### 3. الوصول

- **SSH Access** (ستحصل عليه بعد شراء VPS)
- **IP Address** (عنوان IP للسيرفر)
- **Root Password** (كلمة مرور المدير)

---

## 🛒 الخطوة 1: شراء VPS

### مثال: شراء من Hetzner

1. **اذهب إلى:** [hetzner.com/cloud](https://www.hetzner.com/cloud)

2. **أنشئ حساب:**
   - اضغط **Sign Up**
   - أدخل بياناتك
   - تحقق من البريد الإلكتروني

3. **أضف مشروع جديد:**
   - اضغط **New Project**
   - اسم المشروع: `ArabiSmart News`

4. **أنشئ سيرفر:**
   - اضغط **Add Server**
   - **Location:** اختر أقرب موقع (مثل: Frankfurt, Germany)
   - **Image:** Ubuntu 22.04
   - **Type:** CX22 (2 vCPU, 4GB RAM) - €4.15/شهر
   - **SSH Key:** (اختياري - يمكنك تخطيه)
   - اضغط **Create & Buy Now**

5. **انتظر 1-2 دقيقة** حتى يكتمل إنشاء السيرفر

6. **احفظ المعلومات:**
   - **IP Address:** (مثل: 123.45.67.89)
   - **Root Password:** (ستصلك بالبريد الإلكتروني)

---

## 🔌 الخطوة 2: الاتصال بالسيرفر

### على Windows:

1. **حمّل PuTTY:**
   - [putty.org](https://www.putty.org/)

2. **افتح PuTTY:**
   - **Host Name:** أدخل IP السيرفر
   - **Port:** 22
   - اضغط **Open**

3. **سجل دخول:**
   - **login as:** `root`
   - **Password:** (الصق كلمة المرور من البريد)

### على Mac/Linux:

1. **افتح Terminal**

2. **اكتب:**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```
   (استبدل YOUR_SERVER_IP بـ IP السيرفر)

3. **أدخل كلمة المرور** عند الطلب

---

## 📥 الخطوة 3: تحميل السكريبت

بعد الاتصال بالسيرفر، نفّذ الأوامر التالية:

```bash
# تحميل السكريبت
wget https://raw.githubusercontent.com/redioarab1/arabismart-vip/main/vps-auto-deploy.sh

# إعطاء صلاحيات التنفيذ
chmod +x vps-auto-deploy.sh
```

---

## 🚀 الخطوة 4: تشغيل السكريبت

```bash
sudo bash vps-auto-deploy.sh
```

### سيطلب منك السكريبت:

#### 1. **اسم النطاق:**
```
أدخل اسم النطاق (مثل: arabismart.vip): 
```
أدخل: `arabismart.vip`

#### 2. **البريد الإلكتروني:**
```
أدخل بريدك الإلكتروني (لشهادة SSL): 
```
أدخل: `redio.arab@gmail.com`

#### 3. **OpenAI API Key (اختياري):**
```
أدخل OpenAI API Key (اضغط Enter للتخطي): 
```
- إذا كان لديك: أدخل المفتاح (يبدأ بـ `sk-...`)
- إذا لم يكن لديك: اضغط **Enter** للتخطي

#### 4. **تأكيد DNS:**
```
هل النطاق يشير إلى هذا IP؟ (y/n): 
```
- إذا كنت قد أعددت DNS: اكتب `y`
- إذا لم تعدّ DNS بعد: اكتب `n` (يمكنك إعداد SSL لاحقاً)

### ⏱️ انتظر 5-10 دقائق

السكريبت سيقوم بـ:
- ✅ تحديث النظام
- ✅ تثبيت Node.js 22
- ✅ تثبيت PostgreSQL
- ✅ تحميل الكود من GitHub
- ✅ تثبيت الحزم
- ✅ بناء المشروع
- ✅ إعداد قاعدة البيانات
- ✅ تثبيت PM2
- ✅ تثبيت Nginx
- ✅ إعداد SSL (إذا كان DNS جاهز)
- ✅ إعداد Firewall

---

## 🌐 الخطوة 5: إعداد DNS (ربط النطاق)

### إذا كان النطاق على Manus:

للأسف، النطاقات المشتراة من Manus **لا يمكن ربطها بخوادم خارجية** مباشرة.

**الحلول:**
1. **نقل النطاق** إلى مسجل خارجي (Cloudflare، Namecheap)
2. **شراء نطاق جديد** من Cloudflare (~$10/سنة)

### إذا كان النطاق على Cloudflare/Namecheap:

1. **اذهب إلى لوحة تحكم النطاق**

2. **أضف سجلات DNS:**

| النوع | الاسم | القيمة | TTL |
|------|------|--------|-----|
| A | @ | IP_السيرفر | Auto |
| A | www | IP_السيرفر | Auto |

3. **انتظر 5-10 دقائق** حتى ينتشر DNS

4. **تحقق من DNS:**
   ```bash
   nslookup arabismart.vip
   ```
   يجب أن يظهر IP السيرفر

---

## 🔒 الخطوة 6: إعداد SSL (إذا لم تفعّله في السكريبت)

إذا اخترت `n` عند سؤال DNS، يمكنك تفعيل SSL الآن:

```bash
sudo certbot --nginx -d arabismart.vip -d www.arabismart.vip
```

اتبع التعليمات:
- أدخل بريدك الإلكتروني
- اقبل الشروط (y)
- اختر إعادة التوجيه التلقائي لـ HTTPS (2)

---

## ✅ الخطوة 7: التحقق من عمل الموقع

### 1. **افتح المتصفح:**

```
https://arabismart.vip
```

### 2. **يجب أن ترى:**
- ✅ الصفحة الرئيسية
- ✅ قائمة الأخبار
- ✅ الفلاتر تعمل
- ✅ البحث يعمل

### 3. **تحقق من لوحة الإدارة:**

```
https://arabismart.vip/admin
```

---

## 🔧 الأوامر المفيدة

### عرض حالة التطبيق:
```bash
pm2 status
```

### عرض logs التطبيق:
```bash
pm2 logs arabismart-news
```

### إعادة تشغيل التطبيق:
```bash
pm2 restart arabismart-news
```

### إيقاف التطبيق:
```bash
pm2 stop arabismart-news
```

### بدء التطبيق:
```bash
pm2 start arabismart-news
```

### عرض حالة Nginx:
```bash
systemctl status nginx
```

### إعادة تشغيل Nginx:
```bash
systemctl restart nginx
```

### تجديد شهادة SSL:
```bash
certbot renew
```

### الاتصال بقاعدة البيانات:
```bash
# المعلومات في /root/arabismart-info.txt
cat /root/arabismart-info.txt
```

---

## 🔄 تحديث الموقع مستقبلاً

### الطريقة 1: من GitHub (موصى بها)

إذا قمت بتحديث الكود على GitHub:

```bash
cd /var/www/arabismart-news
git pull origin main
pnpm install
pnpm run build
pm2 restart arabismart-news
```

### الطريقة 2: رفع ملفات جديدة

```bash
# على جهازك المحلي
scp -r /path/to/new/files root@YOUR_SERVER_IP:/var/www/arabismart-news/

# على السيرفر
cd /var/www/arabismart-news
pnpm install
pnpm run build
pm2 restart arabismart-news
```

---

## 🛡️ الأمان

### 1. **تغيير كلمة مرور root:**
```bash
passwd
```

### 2. **إنشاء مستخدم غير root:**
```bash
adduser yourusername
usermod -aG sudo yourusername
```

### 3. **تعطيل تسجيل دخول root عبر SSH:**
```bash
nano /etc/ssh/sshd_config
# غيّر: PermitRootLogin yes
# إلى: PermitRootLogin no
systemctl restart sshd
```

### 4. **تفعيل Fail2Ban:**
```bash
apt-get install fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## 📊 المراقبة

### عرض استخدام الموارد:
```bash
htop
```
(إذا لم يكن مثبتاً: `apt-get install htop`)

### عرض مساحة القرص:
```bash
df -h
```

### عرض استخدام الذاكرة:
```bash
free -h
```

---

## 🆘 استكشاف الأخطاء

### المشكلة: الموقع لا يعمل

**الحل:**
```bash
# تحقق من حالة التطبيق
pm2 status

# تحقق من logs
pm2 logs arabismart-news

# أعد تشغيل التطبيق
pm2 restart arabismart-news
```

### المشكلة: خطأ 502 Bad Gateway

**الحل:**
```bash
# تحقق من أن التطبيق يعمل
pm2 status

# تحقق من Nginx
systemctl status nginx

# أعد تشغيل Nginx
systemctl restart nginx
```

### المشكلة: قاعدة البيانات لا تعمل

**الحل:**
```bash
# تحقق من حالة PostgreSQL
systemctl status postgresql

# أعد تشغيل PostgreSQL
systemctl restart postgresql
```

### المشكلة: SSL لا يعمل

**الحل:**
```bash
# تحقق من شهادة SSL
certbot certificates

# جدّد الشهادة
certbot renew --force-renewal
```

---

## 💰 التكلفة الشهرية

| العنصر | التكلفة |
|--------|---------|
| VPS (Hetzner CX22) | €4.15 (~$4.5) |
| OpenAI API | ~$1 |
| النطاق (.vip) | ~$1/شهر ($12/سنة) |
| **المجموع** | **~$6.5/شهر** |

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. **راجع logs:**
   ```bash
   pm2 logs arabismart-news
   ```

2. **راجع معلومات التثبيت:**
   ```bash
   cat /root/arabismart-info.txt
   ```

3. **تواصل مع المطور** عبر Manus

---

## 🎉 تهانينا!

الآن لديك موقع **ArabiSmart News** يعمل على سيرفر VPS خاص مع:

- ✅ **21 مصدر RSS** نشط
- ✅ **18,059+ خبر** في قاعدة البيانات
- ✅ **SSL/HTTPS** مفعّل
- ✅ **نطاق خاص** (arabismart.vip)
- ✅ **تحكم كامل** في السيرفر
- ✅ **استقلالية تامة**

---

**ملاحظة:** احتفظ بملف `/root/arabismart-info.txt` في مكان آمن - يحتوي على جميع كلمات المرور والمعلومات الحساسة!
