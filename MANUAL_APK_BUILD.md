# 🔧 دليل بناء APK يدوياً - ArabiSmart

## 📋 المتطلبات

### على Windows:
- Node.js 18+ ([تحميل](https://nodejs.org/))
- Git ([تحميل](https://git-scm.com/))
- Android Studio ([تحميل](https://developer.android.com/studio))
- Java JDK 17 ([تحميل](https://www.oracle.com/java/technologies/downloads/))

### على Mac:
```bash
brew install node git openjdk@17
brew install --cask android-studio
```

### على Linux:
```bash
sudo apt update
sudo apt install nodejs npm git openjdk-17-jdk
# ثبت Android Studio من الموقع الرسمي
```

---

## 📦 الطريقة 1: بناء APK عبر EAS (الأسهل)

### الخطوة 1: استنساخ المشروع
```bash
git clone https://github.com/redioarab1/ArabiSmart.git
cd ArabiSmart/frontend
```

### الخطوة 2: تثبيت المتطلبات
```bash
# تثبيت pnpm
npm install -g pnpm

# تثبيت المكتبات
pnpm install

# تثبيت EAS CLI
pnpm add -g eas-cli
```

### الخطوة 3: تسجيل الدخول
```bash
eas login
# أدخل:
# Email: redio.arab@gmail.com
# Password: Mcd0790768583
```

### الخطوة 4: بناء APK
```bash
# بناء APK للتوزيع الداخلي
eas build --platform android --profile preview

# أو بناء AAB لـ Google Play
eas build --platform android --profile production
```

### الخطوة 5: تحميل APK
- انتظر 10-15 دقيقة
- افتح الرابط الذي يظهر في Terminal
- حمّل APK من صفحة البناء

---

## 🏗️ الطريقة 2: بناء APK محلياً (متقدم)

### الخطوة 1: إعداد Android SDK

#### على Windows:
1. ثبت Android Studio
2. افتح SDK Manager
3. ثبت:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools
   - Android Emulator

4. أضف متغيرات البيئة:
```cmd
setx ANDROID_HOME "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools"
```

#### على Mac/Linux:
```bash
# أضف إلى ~/.bashrc أو ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/tools/bin

# طبق التغييرات
source ~/.bashrc  # أو source ~/.zshrc
```

### الخطوة 2: استنساخ وإعداد المشروع
```bash
git clone https://github.com/redioarab1/ArabiSmart.git
cd ArabiSmart/frontend
pnpm install
```

### الخطوة 3: تشغيل Prebuild
```bash
# إنشاء مجلدات Android native
npx expo prebuild --platform android --clean
```

### الخطوة 4: بناء APK
```bash
cd android

# على Windows:
gradlew.bat assembleRelease

# على Mac/Linux:
./gradlew assembleRelease
```

### الخطوة 5: العثور على APK
```bash
# سيكون APK في:
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔑 الطريقة 3: بناء APK موقّع (للنشر)

### الخطوة 1: إنشاء Keystore
```bash
keytool -genkey -v -keystore arabismart-release.keystore \
  -alias arabismart \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# أدخل المعلومات المطلوبة:
# Password: [اختر كلمة مرور قوية]
# Name: ArabiSmart
# Organization: ArabiSmart
# City: [مدينتك]
# State: [ولايتك]
# Country: [رمز بلدك - مثلاً SE]
```

### الخطوة 2: إعداد ملف gradle.properties
```bash
# أنشئ/عدّل android/gradle.properties
cat >> android/gradle.properties << EOF

ARABISMART_UPLOAD_STORE_FILE=arabismart-release.keystore
ARABISMART_UPLOAD_KEY_ALIAS=arabismart
ARABISMART_UPLOAD_STORE_PASSWORD=كلمة_المرور_التي_اخترتها
ARABISMART_UPLOAD_KEY_PASSWORD=كلمة_المرور_التي_اخترتها
EOF
```

### الخطوة 3: تحديث android/app/build.gradle
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('ARABISMART_UPLOAD_STORE_FILE')) {
                storeFile file(ARABISMART_UPLOAD_STORE_FILE)
                storePassword ARABISMART_UPLOAD_STORE_PASSWORD
                keyAlias ARABISMART_UPLOAD_KEY_ALIAS
                keyPassword ARABISMART_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### الخطوة 4: بناء APK موقّع
```bash
cd android
./gradlew assembleRelease

# APK الموقّع سيكون في:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 الطريقة 4: بناء AAB لـ Google Play

### بناء AAB
```bash
cd android
./gradlew bundleRelease

# AAB سيكون في:
# android/app/build/outputs/bundle/release/app-release.aab
```

### رفع على Google Play Console
1. اذهب إلى https://play.google.com/console
2. أنشئ تطبيق جديد
3. ارفع ملف AAB
4. املأ معلومات التطبيق
5. أرسل للمراجعة

---

## 🐛 استكشاف الأخطاء

### خطأ: "SDK location not found"
```bash
# أنشئ ملف local.properties
echo "sdk.dir=/path/to/Android/Sdk" > android/local.properties

# على Windows:
echo sdk.dir=C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk > android\\local.properties
```

### خطأ: "Gradle build failed"
```bash
# نظف وأعد البناء
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

### خطأ: "Java version incompatible"
```bash
# تأكد من استخدام Java 17
java -version

# إذا لم يكن 17، ثبته وحدّث JAVA_HOME
export JAVA_HOME=/path/to/jdk-17
```

### خطأ: "Out of memory"
```bash
# زد الذاكرة في android/gradle.properties
echo "org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m" >> android/gradle.properties
```

### خطأ: "Module not found"
```bash
# أعد تثبيت المكتبات
rm -rf node_modules
pnpm install

# أعد بناء Android
npx expo prebuild --platform android --clean
```

---

## ⚡ نصائح للأداء

### 1. تقليل حجم APK
```gradle
// في android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
        }
    }
    
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a'
            universalApk false
        }
    }
}
```

### 2. تسريع البناء
```gradle
// في android/gradle.properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

### 3. تفعيل Hermes
```json
// في app.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

---

## 📊 مقارنة الطرق

| الطريقة | الصعوبة | الوقت | الحجم | التوقيع |
|---------|---------|-------|-------|---------|
| EAS Build | سهل | 10-15 دقيقة | ~30 MB | تلقائي |
| بناء محلي | متوسط | 5-10 دقائق | ~30 MB | يدوي |
| بناء موقّع | صعب | 10-15 دقيقة | ~25 MB | يدوي |
| AAB | متوسط | 10-15 دقيقة | ~20 MB | يدوي |

---

## 🔐 الأمان

### لا تشارك أبداً:
- ❌ ملف `.keystore`
- ❌ كلمات مرور Keystore
- ❌ ملف `gradle.properties` (إذا كان يحتوي على كلمات مرور)

### احفظ بأمان:
- ✅ نسخة احتياطية من `.keystore` في مكان آمن
- ✅ كلمات المرور في مدير كلمات مرور
- ✅ معلومات التوقيع في مكان آمن

---

## 📚 موارد إضافية

- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Developer Guide](https://developer.android.com/studio/build)
- [React Native Documentation](https://reactnative.dev/docs/signed-apk-android)
- [Gradle Documentation](https://docs.gradle.org/)

---

## 🆘 الدعم

إذا واجهت أي مشكلة:

1. راجع قسم "استكشاف الأخطاء" أعلاه
2. تحقق من Logs في Terminal
3. ابحث عن الخطأ في Google
4. افتح Issue على GitHub
5. تواصل عبر: edio.arab@gmail.com

---

**آخر تحديث:** 2026-01-28  
**الإصدار:** 1.0.0  
**الحالة:** ✅ مختبر وجاهز
