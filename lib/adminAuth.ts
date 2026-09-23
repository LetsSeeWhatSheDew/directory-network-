// Shared admin check for /api/admin/* routes (the /admin pages are gated by
// middleware; API routes are not, so each one must call this).
import type { NextRequest } from "next/server";
export const ADMIN_COOKIE = "dn_admin_auth";
export function isAdmin(req: NextRequest | Request): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const cookieHeader = req.headers.get("cookie") || "";
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return !!m && decodeURIComponent(m[1]) === pw;
}
