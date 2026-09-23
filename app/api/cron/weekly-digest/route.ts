// GET /api/cron/weekly-digest — Mondays (vercel.json). Sends the weekly
// report to active deal_alerts subscribers via Resend.
// Auth: Authorization: Bearer ${CRON_SECRET}. ?dry=1 returns the plan
// without sending; ?to=<email> sends one test copy (still needs auth).
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getWeeklyReport } from "@/lib/weeklyReport";
import { renderWeeklyReportEmail } from "@/lib/weeklyReportEmail";
import { listWeeklySubscribers, unsubscribeUrl } from "@/lib/alertSubscribers";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const testTo = req.nextUrl.searchParams.get("to");

  const report = await getWeeklyReport();
  if (!report || report.dealsSeen === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no report data" });
  }
  const subs = testTo ? [{ email: testTo, city: null }] : await listWeeklySubscribers();
  if (dry) {
    const sample = renderWeeklyReportEmail(report, { baseUrl: brand.url, unsubscribeUrl: "#", city: subs[0]?.city });
    return NextResponse.json({ ok: true, dry: true, subscribers: subs.length, subject: sample.subject, dealsSeen: report.dealsSeen });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, reason: "RESEND_API_KEY not set", subscribers: subs.length }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  const errors: string[] = [];
  for (const s of subs) {
    const unsub = unsubscribeUrl(brand.url, s.email);
    const m = renderWeeklyReportEmail(report, { baseUrl: brand.url, unsubscribeUrl: unsub, city: s.city });
    try {
      const r = await resend.emails.send({
        from: `${brand.name} <${brand.supportEmail}>`,
        to: s.email,
        subject: m.subject,
        html: m.html,
        text: m.text,
        headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      if ((r as { error?: unknown }).error) errors.push(String(JSON.stringify((r as { error?: unknown }).error)).slice(0, 200));
      else sent++;
    } catch (e) {
      errors.push(String(e).slice(0, 200));
    }
    await new Promise((res) => setTimeout(res, 550)); // Resend default rate limit: 2 req/s
  }
  return NextResponse.json({ ok: errors.length === 0, sent, failed: errors.length, errors: errors.slice(0, 5) });
}
