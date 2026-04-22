# ─── مرحلة البناء ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# تثبيت pnpm
RUN npm install -g pnpm

# نسخ ملفات التبعيات أولاً (للاستفادة من cache)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# نسخ بقية الملفات
COPY . .

# بناء الواجهة الأمامية
RUN pnpm build

# ─── مرحلة الإنتاج ───────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# تثبيت Python وأدوات PDF العربية
RUN apk add --no-cache \
    python3 \
    py3-pip \
    fontconfig \
    font-noto-arabic \
    && pip3 install --break-system-packages weasyprint arabic-reshaper python-bidi 2>/dev/null || true

# تثبيت pnpm
RUN npm install -g pnpm

# نسخ ملفات التبعيات
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# نسخ الكود المبني
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/tsconfig*.json ./

# إنشاء مجلد للـ fonts
RUN mkdir -p /app/fonts

# المنفذ
EXPOSE 3000

# متغير البيئة
ENV NODE_ENV=production
ENV TZ=Europe/Stockholm

# تشغيل الخادم
CMD ["node", "--loader", "ts-node/esm", "server/index.ts"]
