#!/bin/bash

################################################################################
# سكريبت التثبيت التلقائي لموقع ArabiSmart News على VPS
# النظام المدعوم: Ubuntu 20.04 / 22.04 / 24.04
# المدة المتوقعة: 5-10 دقائق
################################################################################

set -e  # إيقاف السكريبت عند أي خطأ

# الألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دالة طباعة ملونة
print_step() {
    echo -e "${BLUE}==>${NC} ${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

################################################################################
# الخطوة 1: التحقق من صلاحيات المستخدم
################################################################################

print_step "التحقق من صلاحيات المستخدم..."

if [ "$EUID" -ne 0 ]; then 
    print_error "يرجى تشغيل السكريبت بصلاحيات root"
    echo "استخدم: sudo bash vps-auto-deploy.sh"
    exit 1
fi

print_success "صلاحيات المستخدم صحيحة"

################################################################################
# الخطوة 2: جمع المعلومات من المستخدم
################################################################################

print_step "جمع المعلومات المطلوبة..."

echo ""
echo "===================================================================="
echo "  مرحباً بك في سكريبت التثبيت التلقائي لـ ArabiSmart News"
echo "===================================================================="
echo ""

# النطاق
read -p "أدخل اسم النطاق (مثل: arabismart.vip): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    print_error "اسم النطاق مطلوب!"
    exit 1
fi

# البريد الإلكتروني لـ SSL
read -p "أدخل بريدك الإلكتروني (لشهادة SSL): " SSL_EMAIL
if [ -z "$SSL_EMAIL" ]; then
    print_error "البريد الإلكتروني مطلوب!"
    exit 1
fi

# OpenAI API Key (اختياري)
read -p "أدخل OpenAI API Key (اضغط Enter للتخطي): " OPENAI_KEY

# رابط تحميل الكود
DOWNLOAD_URL="https://github.com/redioarab1/arabismart-vip/archive/refs/heads/main.zip"

print_success "تم جمع المعلومات بنجاح"

################################################################################
# الخطوة 3: تحديث النظام
################################################################################

print_step "تحديث النظام..."

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

print_success "تم تحديث النظام"

################################################################################
# الخطوة 4: تثبيت الحزم الأساسية
################################################################################

print_step "تثبيت الحزم الأساسية..."

apt-get install -y -qq \
    curl \
    wget \
    git \
    unzip \
    build-essential \
    software-properties-common \
    certbot \
    python3-certbot-nginx

print_success "تم تثبيت الحزم الأساسية"

################################################################################
# الخطوة 5: تثبيت Node.js 22
################################################################################

print_step "تثبيت Node.js 22..."

curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
apt-get install -y -qq nodejs

# التحقق من التثبيت
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

print_success "تم تثبيت Node.js $NODE_VERSION و npm $NPM_VERSION"

# تثبيت pnpm
print_step "تثبيت pnpm..."
npm install -g pnpm > /dev/null 2>&1
print_success "تم تثبيت pnpm"

################################################################################
# الخطوة 6: تثبيت PostgreSQL
################################################################################

print_step "تثبيت PostgreSQL..."

apt-get install -y -qq postgresql postgresql-contrib

# بدء الخدمة
systemctl start postgresql
systemctl enable postgresql > /dev/null 2>&1

print_success "تم تثبيت PostgreSQL"

################################################################################
# الخطوة 7: إنشاء قاعدة بيانات ومستخدم
################################################################################

print_step "إنشاء قاعدة البيانات..."

# توليد كلمة مرور عشوائية
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_NAME="arabismart_news"
DB_USER="arabismart_user"

# إنشاء المستخدم وقاعدة البيانات
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" > /dev/null 2>&1 || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" > /dev/null 2>&1 || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" > /dev/null 2>&1

# رابط الاتصال
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

print_success "تم إنشاء قاعدة البيانات: $DB_NAME"

################################################################################
# الخطوة 8: تحميل الكود
################################################################################

print_step "تحميل كود الموقع..."

# إنشاء مجلد التطبيق
APP_DIR="/var/www/arabismart-news"
mkdir -p $APP_DIR
cd $APP_DIR

# تحميل من GitHub
if [ -f "main.zip" ]; then
    rm -f main.zip
fi

wget -q -O main.zip $DOWNLOAD_URL
unzip -q main.zip
mv arabismart-vip-main/* .
mv arabismart-vip-main/.* . 2>/dev/null || true
rm -rf arabismart-vip-main main.zip

print_success "تم تحميل الكود"

################################################################################
# الخطوة 9: إنشاء ملف المتغيرات البيئية
################################################################################

print_step "إنشاء ملف .env..."

# توليد JWT Secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

cat > .env << EOF
# Database
DATABASE_URL=$DATABASE_URL

# Security
JWT_SECRET=$JWT_SECRET

# App Info
VITE_APP_TITLE=ArabiSmart News
VITE_APP_LOGO=

# OpenAI (optional)
OPENAI_API_KEY=$OPENAI_KEY

# Server
PORT=3000
NODE_ENV=production
EOF

print_success "تم إنشاء ملف .env"

################################################################################
# الخطوة 10: تثبيت الحزم
################################################################################

print_step "تثبيت حزم Node.js (قد يستغرق 2-3 دقائق)..."

pnpm install --prod > /dev/null 2>&1

print_success "تم تثبيت الحزم"

################################################################################
# الخطوة 11: بناء المشروع
################################################################################

print_step "بناء المشروع..."

pnpm run build > /dev/null 2>&1

print_success "تم بناء المشروع"

################################################################################
# الخطوة 12: تطبيق migrations قاعدة البيانات
################################################################################

print_step "إعداد قاعدة البيانات..."

# تشغيل migrations
pnpm run db:push > /dev/null 2>&1 || true

print_success "تم إعداد قاعدة البيانات"

################################################################################
# الخطوة 13: تثبيت PM2
################################################################################

print_step "تثبيت PM2..."

npm install -g pm2 > /dev/null 2>&1

print_success "تم تثبيت PM2"

################################################################################
# الخطوة 14: إنشاء ملف PM2 ecosystem
################################################################################

print_step "إنشاء ملف PM2..."

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'arabismart-news',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
EOF

mkdir -p logs

print_success "تم إنشاء ملف PM2"

################################################################################
# الخطوة 15: بدء التطبيق مع PM2
################################################################################

print_step "بدء التطبيق..."

pm2 delete arabismart-news > /dev/null 2>&1 || true
pm2 start ecosystem.config.js
pm2 save > /dev/null 2>&1
pm2 startup systemd -u root --hp /root > /dev/null 2>&1

print_success "تم بدء التطبيق"

################################################################################
# الخطوة 16: تثبيت Nginx
################################################################################

print_step "تثبيت Nginx..."

apt-get install -y -qq nginx

print_success "تم تثبيت Nginx"

################################################################################
# الخطوة 17: إعداد Nginx
################################################################################

print_step "إعداد Nginx..."

cat > /etc/nginx/sites-available/arabismart << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    client_max_body_size 50M;
}
EOF

# تفعيل الموقع
ln -sf /etc/nginx/sites-available/arabismart /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار الإعدادات
nginx -t > /dev/null 2>&1

# إعادة تشغيل Nginx
systemctl restart nginx
systemctl enable nginx > /dev/null 2>&1

print_success "تم إعداد Nginx"

################################################################################
# الخطوة 18: إعداد SSL مع Let's Encrypt
################################################################################

print_step "إعداد شهادة SSL (قد يستغرق دقيقة)..."

# التحقق من أن النطاق يشير إلى السيرفر
print_warning "تأكد من أن النطاق $DOMAIN_NAME يشير إلى IP هذا السيرفر"
echo "IP السيرفر الحالي: $(curl -s ifconfig.me)"
echo ""
read -p "هل النطاق يشير إلى هذا IP؟ (y/n): " DNS_READY

if [ "$DNS_READY" = "y" ] || [ "$DNS_READY" = "Y" ]; then
    certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email $SSL_EMAIL --redirect
    print_success "تم إعداد SSL بنجاح"
else
    print_warning "تخطي إعداد SSL. يمكنك تشغيله لاحقاً بالأمر:"
    echo "sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
fi

################################################################################
# الخطوة 19: إعداد Firewall
################################################################################

print_step "إعداد Firewall..."

ufw --force enable > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw reload > /dev/null 2>&1

print_success "تم إعداد Firewall"

################################################################################
# الخطوة 20: إنشاء ملف معلومات التثبيت
################################################################################

print_step "حفظ معلومات التثبيت..."

cat > /root/arabismart-info.txt << EOF
==================================================================
معلومات تثبيت ArabiSmart News
==================================================================

تاريخ التثبيت: $(date)

النطاق: $DOMAIN_NAME
البريد الإلكتروني: $SSL_EMAIL

قاعدة البيانات:
- اسم قاعدة البيانات: $DB_NAME
- اسم المستخدم: $DB_USER
- كلمة المرور: $DB_PASSWORD
- رابط الاتصال: $DATABASE_URL

JWT Secret: $JWT_SECRET

مسار التطبيق: $APP_DIR

==================================================================
الأوامر المفيدة:
==================================================================

# عرض حالة التطبيق
pm2 status

# عرض logs التطبيق
pm2 logs arabismart-news

# إعادة تشغيل التطبيق
pm2 restart arabismart-news

# إيقاف التطبيق
pm2 stop arabismart-news

# بدء التطبيق
pm2 start arabismart-news

# عرض حالة Nginx
systemctl status nginx

# إعادة تشغيل Nginx
systemctl restart nginx

# تجديد شهادة SSL
certbot renew

# الاتصال بقاعدة البيانات
psql -U $DB_USER -d $DB_NAME

==================================================================
EOF

print_success "تم حفظ المعلومات في /root/arabismart-info.txt"

################################################################################
# النهاية
################################################################################

echo ""
echo "===================================================================="
echo -e "${GREEN}✓ تم التثبيت بنجاح!${NC}"
echo "===================================================================="
echo ""
echo "الموقع الآن يعمل على:"
echo -e "${BLUE}http://$DOMAIN_NAME${NC}"
echo ""
if [ "$DNS_READY" = "y" ] || [ "$DNS_READY" = "Y" ]; then
    echo "SSL مُفعّل:"
    echo -e "${GREEN}https://$DOMAIN_NAME${NC}"
    echo ""
fi
echo "معلومات التثبيت محفوظة في: /root/arabismart-info.txt"
echo ""
echo "===================================================================="
echo "الخطوات التالية:"
echo "===================================================================="
echo ""
echo "1. افتح الموقع في المتصفح"
echo "2. تحقق من عمل جميع المميزات"
echo "3. راجع ملف /root/arabismart-info.txt للأوامر المفيدة"
echo ""
if [ -z "$OPENAI_KEY" ]; then
    echo "⚠️  لم تقم بإضافة OpenAI API Key"
    echo "   لتفعيل التصنيف الذكي، أضف المفتاح في ملف .env:"
    echo "   nano $APP_DIR/.env"
    echo "   ثم أعد تشغيل التطبيق: pm2 restart arabismart-news"
    echo ""
fi
echo "===================================================================="
echo ""

exit 0
