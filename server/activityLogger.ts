/**
 * activityLogger.ts
 * دالة مشتركة لتسجيل نشاط المستخدمين في جدول activityLogs
 * تُستخدم من داخل tRPC procedures لتوثيق العمليات الإدارية تلقائياً
 */

import { getDb } from "./db";

export interface LogActivityOptions {
  userId?: number | null;
  userName?: string | null;
  action: string;       // نوع العملية: "create_news" | "delete_news" | ...
  entity?: string | null;  // الكيان المتأثر: "news" | "rssSource" | "user" | ...
  entityId?: number | null;
  details?: string | null; // تفاصيل إضافية (JSON string أو نص حر)
  ip?: string | null;
  status?: "success" | "error";
}

/**
 * تسجيل نشاط في جدول activityLogs
 * لا تُوقف العملية الأصلية عند الفشل - تسجيل صامت
 */
export async function logActivity(opts: LogActivityOptions): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const { activityLogs } = await import("../drizzle/schema");

    await db.insert(activityLogs).values({
      userId: opts.userId ?? null,
      userName: opts.userName ?? "مجهول",
      action: opts.action,
      entity: opts.entity ?? null,
      entityId: opts.entityId ?? null,
      details: opts.details ?? null,
      ip: opts.ip ?? null,
      status: opts.status ?? "success",
      createdAt: new Date(),
    });
  } catch (err) {
    // تسجيل صامت - لا نريد إيقاف العملية الأصلية
    console.error("[ActivityLogger] Failed to log activity:", err);
  }
}
