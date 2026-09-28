// app/admin/layout.tsx — second gate for every /admin page.
//
// middleware.ts is the first gate. This layout checks the same session
// cookie again on the server, so an admin page can never render for a
// request that slipped past the middleware matcher, and it reads cookies(),
// which makes every admin page dynamic: nothing fetched with the service key
// (leads, subscribers, submissions) is ever prerendered into build output.
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminSessionToken, safeEqual } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const expected = await adminSessionToken();
  const got = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!expected || !got || !safeEqual(got, expected)) redirect("/admin-login");
  return <>{children}</>;
}
