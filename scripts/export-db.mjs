/**
 * سكريبت تصدير قاعدة البيانات من Manus
 * الاستخدام: node scripts/export-db.mjs
 * يُنتج ملف: backup.sql في المجلد الجذر
 */
import { createConnection } from "mysql2/promise";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// قراءة DATABASE_URL من .env أو متغيرات البيئة
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL غير موجود في متغيرات البيئة");
  process.exit(1);
}

// تحليل DATABASE_URL
const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: url.searchParams.get("ssl") ? { rejectUnauthorized: false } : undefined,
};

console.log(`🔌 الاتصال بقاعدة البيانات: ${config.host}:${config.port}/${config.database}`);

const conn = await createConnection(config);

// قائمة الجداول للتصدير
const TABLES = [
  "users",
  "rssSources",
  "news",
  "fetchLogs",
  "favorites",
  "comments",
  "ratings",
  "categories",
  "news_categories",
  "archivedNews",
  "daily_summaries",
  "notifications_preferences",
  "breakingNews",
  "pageViews",
  "activityLogs",
  "folders",
  "folder_items",
  "liveChannels",
  "videos",
  "youtubeChannels",
  "push_subscriptions",
];

let sql = `-- ArabiSmart News Database Backup
-- Generated: ${new Date().toISOString()}
-- Source: Manus TiDB/MySQL

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

`;

let totalRows = 0;

for (const table of TABLES) {
  try {
    // التحقق من وجود الجدول
    const [exists] = await conn.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [config.database, table]
    );
    
    if (!exists.length) {
      console.log(`⚠️  الجدول ${table} غير موجود - تخطي`);
      continue;
    }

    // الحصول على CREATE TABLE
    const [[createResult]] = await conn.execute(`SHOW CREATE TABLE \`${table}\``);
    const createSql = createResult["Create Table"];
    
    sql += `\n-- ─── ${table} ───────────────────────────────────────────────\n`;
    sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    sql += `${createSql};\n\n`;

    // تصدير البيانات على دفعات
    const BATCH_SIZE = 1000;
    let offset = 0;
    let rowCount = 0;

    while (true) {
      const [rows] = await conn.execute(
        `SELECT * FROM \`${table}\` LIMIT ${BATCH_SIZE} OFFSET ${offset}`
      );
      
      if (!rows.length) break;

      const columns = Object.keys(rows[0]);
      const values = rows.map(row => {
        const vals = columns.map(col => {
          const val = row[col];
          if (val === null) return "NULL";
          if (typeof val === "number") return val;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
          if (typeof val === "boolean") return val ? 1 : 0;
          return `'${String(val).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}'`;
        });
        return `(${vals.join(", ")})`;
      });

      sql += `INSERT INTO \`${table}\` (\`${columns.join("`, `")}\`) VALUES\n`;
      sql += values.join(",\n") + ";\n";

      rowCount += rows.length;
      offset += BATCH_SIZE;
      
      if (rows.length < BATCH_SIZE) break;
    }

    totalRows += rowCount;
    console.log(`✅ ${table}: ${rowCount} سجل`);
  } catch (err) {
    console.error(`❌ خطأ في تصدير ${table}:`, err.message);
  }
}

sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;

// حفظ الملف
const outputPath = join(ROOT, "backup.sql");
writeFileSync(outputPath, sql, "utf8");

await conn.end();

console.log(`\n✅ تم التصدير بنجاح!`);
console.log(`📁 الملف: ${outputPath}`);
console.log(`📊 إجمالي السجلات: ${totalRows.toLocaleString()}`);
console.log(`\n📋 الخطوة التالية:`);
console.log(`   انسخ backup.sql إلى سيرفر Hetzner وشغّل:`);
console.log(`   docker compose up -d mysql`);
console.log(`   # انتظر 30 ثانية حتى يبدأ MySQL`);
console.log(`   docker compose exec mysql mysql -u root -p arabismart < /docker-entrypoint-initdb.d/backup.sql`);
