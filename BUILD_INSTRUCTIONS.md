# تعليمات بناء ملف APK لتطبيق ArabiSmart

## المتطلبات الأساسية

1. حساب Expo (مجاني)
2. Node.js و pnpm مثبتين
3. EAS CLI مثبت عالمياً

## خطوات البناء

### 1. تثبيت المتطلبات

```bash
cd frontend
pnpm install
pnpm add -g eas-cli
```

### 2. تسجيل الدخول إلى Expo

```bash
eas login
```

أدخل بيانات حساب Expo الخاص بك (البريد الإلكتروني وكلمة المرور).

### 3. إعداد المشروع للبناء

```bash
eas build:configure
```

هذا الأمر سيقوم بإنشاء ملف `eas.json` إذا لم يكن موجوداً.

### 4. بناء APK

لبناء APK للاختبار الداخلي:

```bash
eas build --platform android --profile preview
```

لبناء APK للإنتاج:

```bash
eas build --platform android --profile production
```

### 5. تحميل APK

بعد اكتمال البناء، ستحصل على رابط لتحميل ملف APK. يمكنك أيضاً تحميله من لوحة تحكم Expo:

```bash
eas build:list
```

## البناء المحلي (بدون EAS)

إذا كنت تريد البناء محلياً بدون استخدام خدمة EAS:

### المتطلبات الإضافية:
- Android Studio مثبت
- Java Development Kit (JDK) 17
- Android SDK

### الخطوات:

1. إعداد البيئة:
```bash
cd frontend
npx expo prebuild
```

2. البناء المحلي:
```bash
cd android
./gradlew assembleRelease
```

3. ملف APK سيكون في:
```
android/app/build/outputs/apk/release/app-release.apk
```

## ملاحظات مهمة

- **الإصدار الحالي**: 1.0.0
- **Package Name**: com.arabismart.news
- **Version Code**: 1

## إعدادات MongoDB

تأكد من تحديث ملف `.env` في مجلد `backend` بمعلومات قاعدة البيانات الصحيحة:

```
MONGO_URL="mongodb://atlas-sql-6977ab32aa3dec7a14d977e3-lz1zjx.a.query.mongodb.net/sample_mflix?ssl=true&authSource=admin"
DB_NAME="sample_mflix"
JWT_SECRET_KEY="lHmn7AyBMzMBqhIy"
```

## تشغيل Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

## اختبار التطبيق محلياً

```bash
cd frontend
npx expo start
```

ثم اضغط على `a` لفتح التطبيق على محاكي Android أو امسح رمز QR باستخدام تطبيق Expo Go على هاتفك.

## الدعم

للمزيد من المعلومات، راجع:
- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/)
