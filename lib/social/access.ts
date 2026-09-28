// lib/social/access.ts — who may open /social.
// Only a request carrying a valid admin session cookie (the same cookie
// /admin uses, set by /api/admin-auth — lib/adminAuth). The cookie holds a
// token derived from the password, never the password itself. No mode skips
// this: SOCIAL_FIXTURES swaps the data for made-up fixtures and nothing else.
// Tests sign in through /api/admin-auth with a test password.

import { safeEqual, sessionTokenFor } from "../adminAuth";
export { ADMIN_COOKIE } from "../adminAuth";

/** True only when an admin password is configured and the cookie is its session token. */
export async function socialAccessAllowed(cookieValue: string | null | undefined, adminPassword: string | null | undefined): Promise<boolean> {
  if (!adminPassword || typeof cookieValue !== "string" || !cookieValue) return false;
  return safeEqual(cookieValue, await sessionTokenFor(adminPassword));
}
