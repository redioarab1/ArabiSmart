import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Shield } from "lucide-react";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * AdminGuard - يحمي مسارات /admin بالتحقق من:
 * 1. أن المستخدم مسجل الدخول
 * 2. أن دور المستخدم هو "admin"
 * 3. أن المستخدم مسجّل عبر النظام المحلي (isLocalAuth=1) وليس OAuth
 * إذا لم يستوفِ أي شرط، يعيد التوجيه إلى /admin/login
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // التحقق من صلاحية الدخول: admin + isLocalAuth
  const isLocalAdmin = user?.role === "admin" && (user as any)?.isLocalAuth === 1;

  useEffect(() => {
    if (!loading) {
      if (!user || !isLocalAdmin) {
        navigate("/admin/login");
      }
    }
  }, [user, loading, navigate, isLocalAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/20 mb-4">
            <Shield className="w-8 h-8 text-red-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="arabic-text text-sm">جاري التحقق من الصلاحيات...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isLocalAdmin) {
    return null;
  }

  return <>{children}</>;
}
