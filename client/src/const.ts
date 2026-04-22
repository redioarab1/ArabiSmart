export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * إرجاع رابط تسجيل الدخول:
 * - في بيئة Manus: يستخدم Manus OAuth
 * - في بيئة Hetzner (لا يوجد VITE_OAUTH_PORTAL_URL): يوجّه لصفحة تسجيل الدخول المحلية
 */
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // إذا لم يكن Manus OAuth متاحاً → صفحة تسجيل الدخول المحلية
  if (!oauthPortalUrl || !appId) {
    return "/login";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
