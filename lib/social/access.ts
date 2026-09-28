// lib/social/access.ts — who may open /social.
// Only a request carrying the admin password cookie (the same cookie /admin
// uses, lib/adminAuth). No mode skips this: SOCIAL_FIXTURES swaps the data
// for made-up fixtures and nothing else. Tests log in with a test password.

import { timingSafeEqual } from "node:crypto";
export { ADMIN_COOKIE } from "../adminAuth";

/** True only when an admin password is configured and the cookie matches it. */
export function socialAccessAllowed(cookieValue: string | null | undefined, adminPassword: string | null | undefined): boolean {
  if (!adminPassword || typeof cookieValue !== "string" || !cookieValue) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(adminPassword);
  return a.length === b.length && timingSafeEqual(a, b);
}
