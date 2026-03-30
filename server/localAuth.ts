/**
 * Local Authentication Module
 * Handles email/username + password auth independent of Manus OAuth.
 * Uses bcryptjs for password hashing and nodemailer for password reset emails.
 */
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";

// ─── Nodemailer transporter ───────────────────────────────────────────────────
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateOpenId(username: string): string {
  return `local_${username}_${nanoid(8)}`;
}

export function generateResetToken(): string {
  return nanoid(48);
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function registerLocalUser(params: {
  username: string;
  email: string;
  password: string;
  name?: string;
}): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "خطأ في الاتصال بقاعدة البيانات" };
  const { username, email, password, name } = params;

  // Validate password strength
  if (password.length < 8) {
    return { success: false, error: "كلمة السر يجب أن تكون 8 أحرف على الأقل" };
  }

  // Check username uniqueness
  const existingUsername = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existingUsername.length > 0) {
    return { success: false, error: "اسم المستخدم مستخدم بالفعل" };
  }

  // Check email uniqueness
  const existingEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingEmail.length > 0) {
    return { success: false, error: "البريد الإلكتروني مستخدم بالفعل" };
  }

  const passwordHash = await hashPassword(password);
  const openId = generateOpenId(username);

  await db.insert(users).values({
    openId,
    username,
    email,
    name: name || username,
    passwordHash,
    isLocalAuth: 1,
    loginMethod: "local",
    lastSignedIn: new Date(),
  });

  return { success: true };
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function loginLocalUser(params: {
  identifier: string; // email or username
  password: string;
}): Promise<{ user: typeof users.$inferSelect | null; error?: string }> {
  const db = await getDb();
  if (!db) return { user: null, error: "خطأ في الاتصال بقاعدة البيانات" };
  const { identifier, password } = params;

  const isEmail = identifier.includes("@");

  const results = await db
    .select()
    .from(users)
    .where(
      isEmail
        ? eq(users.email, identifier)
        : eq(users.username, identifier)
    )
    .limit(1);

  const user = results[0];

  if (!user || !user.passwordHash || !user.isLocalAuth) {
    return { user: null, error: "اسم المستخدم أو كلمة السر غير صحيحة" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { user: null, error: "اسم المستخدم أو كلمة السر غير صحيحة" };
  }

  // Update lastSignedIn
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return { user };
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export async function forgotPassword(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, error: "خطأ في الاتصال بقاعدة البيانات" };

  const results = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = results[0];

  // Always return success to prevent email enumeration
  if (!user || !user.isLocalAuth) {
    return { success: true };
  }

  const token = generateResetToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db
    .update(users)
    .set({ resetToken: token, resetTokenExpires: expires })
    .where(eq(users.id, user.id));

  // Send reset email
  const siteUrl = process.env.SITE_URL || "https://arabismart.vip";
  const resetUrl = `${siteUrl}/reset-password?token=${token}`;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"ArabiSmart News" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "إعادة تعيين كلمة السر - ArabiSmart News",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
          <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #e94560; margin: 0;">ArabiSmart News</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">إعادة تعيين كلمة السر</h2>
            <p style="color: #666; line-height: 1.6;">
              مرحباً ${user.name || user.username},<br><br>
              تلقينا طلباً لإعادة تعيين كلمة السر الخاصة بحسابك.
              انقر على الزر أدناه لإنشاء كلمة سر جديدة.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background: #e94560; color: white; padding: 14px 32px; border-radius: 6px;
                        text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
                إعادة تعيين كلمة السر
              </a>
            </div>
            <p style="color: #999; font-size: 13px;">
              هذا الرابط صالح لمدة ساعة واحدة فقط.<br>
              إذا لم تطلب إعادة تعيين كلمة السر، تجاهل هذا البريد.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #bbb; font-size: 12px; text-align: center;">
              ArabiSmart News — موقع الأخبار الذكي
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("[LocalAuth] Failed to send reset email:", err);
    // Don't expose email errors to the user
  }

  return { success: true };
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export async function resetPassword(params: {
  token: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "خطأ في الاتصال بقاعدة البيانات" };
  const { token, newPassword } = params;

  if (newPassword.length < 8) {
    return { success: false, error: "كلمة السر يجب أن تكون 8 أحرف على الأقل" };
  }

  const results = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, token))
    .limit(1);

  const user = results[0];

  if (!user || !user.resetTokenExpires) {
    return { success: false, error: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" };
  }

  if (new Date() > user.resetTokenExpires) {
    return { success: false, error: "انتهت صلاحية رابط إعادة التعيين. يرجى طلب رابط جديد" };
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    })
    .where(eq(users.id, user.id));

  return { success: true };
}

// ─── Get user by reset token (for validation) ─────────────────────────────────
export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const results = await db
    .select({ id: users.id, resetTokenExpires: users.resetTokenExpires, name: users.name })
    .from(users)
    .where(eq(users.resetToken, token))
    .limit(1);
  return results[0] || null;
}
