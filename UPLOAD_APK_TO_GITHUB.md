# 📦 دليل رفع APK على GitHub Releases

## 🎯 الهدف
رفع ملف APK على GitHub Releases لإتاحة رابط تحميل مباشر للمستخدمين.

---

## 📋 المتطلبات

1. ✅ ملف APK جاهز
2. ✅ حساب GitHub
3. ✅ صلاحيات كاملة على المستودع

---

## 🔧 الخطوة 1: بناء APK

### الطريقة 1: باستخدام EAS Build (موصى به)

```bash
# تسجيل الدخول
eas login
# Email: redio.arab@gmail.com
# Password: Mcd0790768583

# بناء APK
cd frontend
eas build --platform android --profile production-apk

# انتظر اكتمال البناء (10-15 دقيقة)
# حمّل APK من الرابط الذي يظهر
```

**رابط البناء:** https://expo.dev/accounts/arabismart/projects/arabismart/builds

### الطريقة 2: بناء محلي (إذا فشلت الطريقة 1)

```bash
cd frontend/android
export ANDROID_HOME=/path/to/android-sdk
./gradlew assembleRelease

# APK سيكون في:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📤 الخطوة 2: رفع APK على GitHub Releases

### الطريقة 1: عبر واجهة GitHub (الأسهل)

#### 1. إنشاء Release جديد
1. اذهب إلى: https://github.com/redioarab1/ArabiSmart/releases
2. اضغط "Create a new release"

#### 2. ملء معلومات Release
- **Tag version:** `v1.0.0`
- **Release title:** `ArabiSmart v1.0.0 - الإصدار الأول`
- **Description:**
```markdown
# 🎉 ArabiSmart v1.0.0 - الإصدار الأول

## ✨ المميزات الرئيسية

### 📰 مصادر الأخبار
- 24 مصدر أخبار موثوق
- أخبار عربية: الجزيرة، سكاي نيوز، العربية، RT، فرانس 24
- أخبار سويدية: الكومبس، راديو السويد، أكتر، Swed24
- أخبار دولية: DN، SVT، Expressen، Aftonbladet

### 🤖 الذكاء الاصطناعي
- ترجمة تلقائية للأخبار
- تلخيص ذكي للمقالات
- تصنيف تلقائي حسب الموضوع

### ⚡ الميزات
- تحديث تلقائي كل 10 دقائق
- حفظ الأخبار المفضلة
- بحث متقدم
- الوضع الليلي/الفاتح
- واجهة عربية كاملة مع دعم RTL

## 📱 التثبيت

### الطريقة 1: تحميل APK (Android)
1. حمّل ملف `ArabiSmart-v1.0.0.apk` من الأسفل
2. افتح الملف على هاتفك
3. اسمح بالتثبيت من مصادر غير معروفة (إذا طُلب منك)
4. اضغط "تثبيت"

### الطريقة 2: Expo Go (الأسرع)
1. حمّل Expo Go من Google Play
2. افتح الرابط:
```
exp://u.expo.dev/448507fa-43b3-4572-b3d4-33b0cb52aa97/group/d2788dca-33af-4716-b0cb-47a6ff7af9cf
```

## 📊 معلومات تقنية
- **الإصدار:** 1.0.0
- **حجم APK:** ~30 MB
- **الحد الأدنى لـ Android:** 6.0 (API 23)
- **الهدف:** Android 14 (API 34)

## 🔐 الأمان
- ✅ موقّع رقمياً
- ✅ لا يحتوي على برمجيات خبيثة
- ✅ مفتوح المصدر
- ✅ لا إعلانات

## 📚 الوثائق
- [دليل الاستخدام](https://github.com/redioarab1/ArabiSmart/blob/main/README_AR.md)
- [سياسة الخصوصية](https://github.com/redioarab1/ArabiSmart/blob/main/PRIVACY_POLICY.md)
- [دليل Google Play](https://github.com/redioarab1/ArabiSmart/blob/main/GOOGLE_PLAY_GUIDE.md)

## 🐛 الإبلاغ عن المشاكل
إذا واجهت أي مشكلة، يُرجى فتح Issue على:
https://github.com/redioarab1/ArabiSmart/issues

## 📞 الدعم
- **البريد:** edio.arab@gmail.com
- **GitHub:** https://github.com/redioarab1/ArabiSmart

---

**شكراً لاستخدامك ArabiSmart! 🙏**
```

#### 3. رفع ملف APK
- اسحب وأفلت ملف APK في منطقة "Attach binaries"
- أو اضغط "choose them" واختر الملف
- **اسم الملف الموصى به:** `ArabiSmart-v1.0.0.apk`

#### 4. نشر Release
- اضغط "Publish release"

#### 5. الحصول على رابط التحميل
بعد النشر، سيكون رابط التحميل:
```
https://github.com/redioarab1/ArabiSmart/releases/download/v1.0.0/ArabiSmart-v1.0.0.apk
```

---

### الطريقة 2: عبر GitHub CLI

```bash
# تثبيت GitHub CLI (إذا لم يكن مثبتاً)
# على Linux:
sudo apt install gh

# تسجيل الدخول
gh auth login

# إنشاء Release ورفع APK
gh release create v1.0.0 \
  --title "ArabiSmart v1.0.0 - الإصدار الأول" \
  --notes-file RELEASE_NOTES.md \
  app-release.apk#ArabiSmart-v1.0.0.apk

# أو باستخدام التوكن مباشرة
export GH_TOKEN="YOUR_GITHUB_TOKEN"

gh release create v1.0.0 \
  --repo redioarab1/ArabiSmart \
  --title "ArabiSmart v1.0.0" \
  --notes "الإصدار الأول من ArabiSmart" \
  path/to/app-release.apk#ArabiSmart-v1.0.0.apk
```

---

### الطريقة 3: عبر GitHub API

```bash
# 1. إنشاء Release
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/redioarab1/ArabiSmart/releases \
  -d '{
    "tag_name": "v1.0.0",
    "name": "ArabiSmart v1.0.0",
    "body": "الإصدار الأول",
    "draft": false,
    "prerelease": false
  }'

# 2. رفع APK (استبدل {release_id} بالـ ID من الخطوة السابقة)
curl -X POST \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Content-Type: application/vnd.android.package-archive" \
  --data-binary @app-release.apk \
  "https://uploads.github.com/repos/redioarab1/ArabiSmart/releases/{release_id}/assets?name=ArabiSmart-v1.0.0.apk"
```

---

## 📝 الخطوة 3: تحديث README مع رابط التحميل

### إضافة badge التحميل

```markdown
# ArabiSmart

[![Download APK](https://img.shields.io/badge/Download-APK-blue?style=for-the-badge&logo=android)](https://github.com/redioarab1/ArabiSmart/releases/latest/download/ArabiSmart-v1.0.0.apk)
[![Version](https://img.shields.io/github/v/release/redioarab1/ArabiSmart?style=for-the-badge)](https://github.com/redioarab1/ArabiSmart/releases)
[![Downloads](https://img.shields.io/github/downloads/redioarab1/ArabiSmart/total?style=for-the-badge)](https://github.com/redioarab1/ArabiSmart/releases)

## 📥 التحميل

### Android APK
[⬇️ تحميل ArabiSmart v1.0.0 APK](https://github.com/redioarab1/ArabiSmart/releases/download/v1.0.0/ArabiSmart-v1.0.0.apk)

### Expo Go
```
exp://u.expo.dev/448507fa-43b3-4572-b3d4-33b0cb52aa97/group/d2788dca-33af-4716-b0cb-47a6ff7af9cf
```
```

---

## 🔄 الخطوة 4: التحديثات المستقبلية

### عند إصدار نسخة جديدة:

1. **زيادة رقم الإصدار** في `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 4
    }
  }
}
```

2. **بناء APK جديد**:
```bash
eas build --platform android --profile production-apk
```

3. **إنشاء Release جديد**:
```bash
gh release create v1.0.1 \
  --title "ArabiSmart v1.0.1 - تحديث" \
  --notes "- إصلاح الأخطاء\n- تحسينات الأداء" \
  app-release.apk#ArabiSmart-v1.0.1.apk
```

---

## 📊 الخطوة 5: مراقبة التحميلات

### عبر GitHub
- اذهب إلى: https://github.com/redioarab1/ArabiSmart/releases
- شاهد عدد التحميلات لكل إصدار

### عبر GitHub API
```bash
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/redioarab1/ArabiSmart/releases
```

---

## 🎨 الخطوة 6: تحسين صفحة Release

### إضافة صور
```markdown
## لقطات الشاشة

![الشاشة الرئيسية](https://raw.githubusercontent.com/redioarab1/ArabiSmart/main/screenshots/home.png)
![الأخبار](https://raw.githubusercontent.com/redioarab1/ArabiSmart/main/screenshots/news.png)
```

### إضافة فيديو
```markdown
## فيديو توضيحي

[![شاهد الفيديو](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)
```

### إضافة changelog
```markdown
## 📝 التغييرات

### إضافات
- ميزة جديدة 1
- ميزة جديدة 2

### إصلاحات
- إصلاح مشكلة 1
- إصلاح مشكلة 2

### تحسينات
- تحسين الأداء
- تحسين الواجهة
```

---

## 🔐 الأمان

### توقيع APK
تأكد من أن APK موقّع بشكل صحيح:

```bash
# التحقق من التوقيع
jarsigner -verify -verbose -certs app-release.apk

# معلومات التوقيع
keytool -printcert -jarfile app-release.apk
```

### Checksum
أضف checksum للتحقق من سلامة الملف:

```bash
# SHA256
sha256sum app-release.apk

# MD5
md5sum app-release.apk
```

أضف النتيجة في وصف Release:
```markdown
## 🔐 Checksum

**SHA256:**
```
abc123def456...
```

**MD5:**
```
xyz789...
```
```

---

## 📚 موارد إضافية

- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Android APK Signing](https://developer.android.com/studio/publish/app-signing)

---

## 🆘 استكشاف الأخطاء

### مشكلة: "Release already exists"
**الحل:** احذف Release القديم أو استخدم رقم إصدار مختلف

### مشكلة: "Asset too large"
**الحل:** GitHub يسمح بملفات حتى 2 GB

### مشكلة: "Permission denied"
**الحل:** تأكد من أن لديك صلاحيات كاملة على المستودع

---

## ✅ قائمة التحقق النهائية

قبل النشر، تأكد من:
- ✅ APK موقّع بشكل صحيح
- ✅ رقم الإصدار صحيح
- ✅ الوصف واضح وشامل
- ✅ لقطات الشاشة متوفرة
- ✅ روابط الوثائق تعمل
- ✅ Checksum مضاف

---

**آخر تحديث:** 2026-01-28  
**الإصدار:** 1.0.0  
**الحالة:** ✅ جاهز للاستخدام
