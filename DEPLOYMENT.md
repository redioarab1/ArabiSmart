# 🚀 دليل النشر - ArabiSmart

## 📋 نظرة عامة

هذا الدليل يشرح كيفية نشر تطبيق ArabiSmart في بيئات مختلفة (Development, Staging, Production).

---

## 🌍 البيئات المتاحة

### 1. Development (التطوير المحلي)
- **Backend:** http://localhost:8001
- **Frontend:** Expo Dev Server
- **Database:** MongoDB Local أو Atlas

### 2. Staging (الاختبار)
- **Backend:** https://project-study-apk.preview.emergentagent.com
- **Frontend:** Expo Go
- **Database:** MongoDB Atlas (project-study-apk-base)

### 3. Production (الإنتاج)
- **Backend:** https://project-study-apk.emergent.host
- **Frontend:** APK/AAB على Google Play
- **Database:** MongoDB Atlas (production cluster)

---

## 🔧 إعداد البيئات

### Development Environment

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# عدّل .env بمعلومات قاعدة البيانات المحلية
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

#### Frontend Setup
```bash
cd frontend
pnpm install
cp .env.example .env
# عدّل EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
npx expo start
```

---

### Staging Environment

#### Backend Deployment
```bash
# استخدم ملف .env.production
cd backend
cp .env.production .env
uvicorn server:app --host 0.0.0.0 --port 8001
```

#### Frontend Testing
```bash
cd frontend
cp .env.production .env
npx expo start --tunnel
# استخدم Expo Go لاختبار التطبيق
```

---

### Production Environment

#### Backend Deployment (على خادم)

**الخيار 1: استخدام Docker**
```bash
# إنشاء Dockerfile للـ Backend
cd backend
docker build -t arabismart-backend .
docker run -d -p 8001:8001 --env-file .env.production arabismart-backend
```

**الخيار 2: استخدام Systemd**
```bash
# إنشاء service file
sudo nano /etc/systemd/system/arabismart-backend.service

[Unit]
Description=ArabiSmart Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/arabismart/backend
Environment="PATH=/usr/local/bin"
EnvironmentFile=/var/www/arabismart/backend/.env.production
ExecStart=/usr/local/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target

# تفعيل وتشغيل الخدمة
sudo systemctl enable arabismart-backend
sudo systemctl start arabismart-backend
```

**الخيار 3: استخدام Heroku**
```bash
# إنشاء Procfile
echo "web: uvicorn server:app --host 0.0.0.0 --port \$PORT" > Procfile

# نشر على Heroku
heroku login
heroku create arabismart-backend
heroku config:set MONGO_URL="your-mongo-url"
heroku config:set DB_NAME="project-study-apk-base"
heroku config:set JWT_SECRET_KEY="arabismart-secret-key-2025-secure"
git push heroku main
```

#### Frontend Deployment (بناء APK)

**باستخدام EAS Build:**
```bash
cd frontend
pnpm add -g eas-cli
eas login
eas build:configure

# بناء APK للإنتاج
eas build --platform android --profile production

# بناء AAB لـ Google Play
eas build --platform android --profile production --local
```

**باستخدام GitHub Actions:**
```yaml
# .github/workflows/build-android.yml
name: Build Android APK

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install -g pnpm
          pnpm install
      
      - name: Setup EAS
        run: |
          npm install -g eas-cli
          eas login --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build APK
        run: |
          cd frontend
          eas build --platform android --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 🗄️ إدارة قاعدة البيانات

### Backup

```bash
# Backup MongoDB
mongodump --uri="mongodb+srv://project-study-apk:d5ns8bclqs2c73bhdo7g@customer-apps.ds2ukr.mongodb.net/project-study-apk-base" --out=./backup

# Backup مع التاريخ
mongodump --uri="mongodb+srv://..." --out=./backup-$(date +%Y%m%d)
```

### Restore

```bash
# Restore MongoDB
mongorestore --uri="mongodb+srv://..." --drop ./backup/project-study-apk-base
```

### Migration

```bash
# إنشاء Indexes
mongo "mongodb+srv://..." --eval '
  db = db.getSiblingDB("project-study-apk-base");
  db.articles.createIndex({ "title": "text", "description": "text" });
  db.articles.createIndex({ "category": 1 });
  db.articles.createIndex({ "published_date": -1 });
  db.users.createIndex({ "email": 1 }, { unique: true });
'
```

---

## 🔐 إدارة الأسرار

### استخدام GitHub Secrets

1. اذهب إلى Repository Settings > Secrets and variables > Actions
2. أضف الأسرار التالية:
   - `MONGO_URL`
   - `JWT_SECRET_KEY`
   - `OPENAI_API_KEY`
   - `EXPO_TOKEN`

### استخدام Environment Variables في Expo

```bash
# إضافة secrets إلى EAS
eas secret:create --scope project --name MONGO_URL --value "your-mongo-url"
eas secret:create --scope project --name JWT_SECRET_KEY --value "your-jwt-secret"
```

---

## 📊 المراقبة والصيانة

### Logging

**Backend Logging:**
```python
# في server.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### Health Checks

**Backend Health Endpoint:**
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if db else "disconnected"
    }
```

### Monitoring Tools

- **Backend:** New Relic, Datadog, Sentry
- **Database:** MongoDB Atlas Monitoring
- **Frontend:** Expo Analytics, Firebase Analytics

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Backend Tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest
  
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # نشر Backend على الخادم
          ssh user@server 'cd /var/www/arabismart && git pull && systemctl restart arabismart-backend'
  
  build-apk:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Build APK
        run: |
          cd frontend
          eas build --platform android --profile production
```

---

## 📱 نشر على Google Play Store

### 1. إعداد التطبيق

```bash
cd frontend
eas build --platform android --profile production
```

### 2. توقيع التطبيق

```bash
# إنشاء keystore
keytool -genkey -v -keystore arabismart-release.keystore -alias arabismart -keyalg RSA -keysize 2048 -validity 10000

# إضافة إلى eas.json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentials": "local"
      }
    }
  }
}
```

### 3. رفع على Google Play Console

1. اذهب إلى https://play.google.com/console
2. أنشئ تطبيق جديد
3. ارفع ملف AAB
4. املأ معلومات التطبيق
5. أرسل للمراجعة

---

## 🔧 استكشاف الأخطاء

### Backend لا يعمل
```bash
# تحقق من الـ logs
journalctl -u arabismart-backend -f

# تحقق من الاتصال بقاعدة البيانات
python -c "from pymongo import MongoClient; client = MongoClient('your-mongo-url'); print(client.server_info())"
```

### Frontend لا يتصل بـ Backend
```bash
# تحقق من EXPO_PUBLIC_BACKEND_URL
cat frontend/.env

# اختبر الاتصال
curl https://project-study-apk.preview.emergentagent.com/health
```

---

## 📞 الدعم

للمساعدة في النشر:
- راجع [CREDENTIALS.md](CREDENTIALS.md) للمفاتيح
- راجع [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) للبناء
- افتح Issue على GitHub

---

**آخر تحديث:** 2026-01-28  
**الحالة:** ✅ جاهز للنشر
