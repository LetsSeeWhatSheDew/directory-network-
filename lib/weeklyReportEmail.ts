// lib/weeklyReportEmail.ts — renders the WeeklyReport as an email.
// Table-based, inline styles, PuffPrice palette. Every number comes from
// the report (deal_observations), nothing is estimated.
import type { WeeklyReport, ReportDeal } from "./weeklyReport";
import { reportRangeLabel } from "./weeklyReport";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderWeeklyReportEmail(
  r: WeeklyReport,
  opts: { baseUrl: string; unsubscribeUrl: string; city?: string | null }
): { subject: string; html: string; text: string } {
  const range = reportRangeLabel(r);
  const top = r.biggest[0];
  const subject = top?.pct != null
    ? `This week: up to ${top.pct}% off at ${top.store} + ${Math.max(r.dealsSeen - 1, 0)} more Central IL deals`
    : `This week in Central Illinois dispensary deals (${range})`;

  const cityKey = (opts.city || "").toLowerCase();
  const local = cityKey
    ? r.biggest.filter((d) => d.city.toLowerCase() === cityKey).slice(0, 3)
    : [];

  const row = (d: ReportDeal) => `
    <tr><td style="padding:10px 0;border-top:1px solid #DCDED2">
      <a href="${opts.baseUrl}/dispensary/${d.slug}" style="color:#15231A;text-decoration:none">
        <div style="font-weight:700;font-size:15px">${esc(d.title)}${d.pct != null ? ` <span style="font-family:monospace;color:#2E5320;background:#E8F0DF;padding:1px 6px;border-radius:5px">${d.pct}%</span>` : ""}</div>
        <div style="font-size:13px;color:#6B7268">${esc(d.store)} · ${esc(d.city)}${d.alsoAt.length ? ` + ${esc(d.alsoAt.join(", "))}` : ""}</div>
      </a>
    </td></tr>`;

  const section = (title: string, list: ReportDeal[]) =>
    list.length === 0 ? "" : `
    <h2 style="font-family:Arial,sans-serif;font-size:16px;margin:24px 0 4px;color:#15231A">${title}</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif">${list.map(row).join("")}</table>`;

  const html = `<!doctype html><html><body style="margin:0;background:#F4F5EF">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FCFCFA;border:1px solid #DCDED2;border-radius:14px;overflow:hidden">
    <tr><td style="background:#1C3A22;padding:22px 24px;color:#F4F1E8;font-family:Arial,sans-serif">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9DBE7E">PuffPrice weekly · ${esc(range)}</div>
      <div style="font-size:22px;font-weight:700;margin-top:6px">This week in Central Illinois deals</div>
      <div style="font-size:14px;margin-top:8px;color:#F4F1E8">${r.dealsSeen} deals at ${r.storesWithDeals} stores${top?.pct != null ? ` · biggest ${top.pct}% off` : ""}${r.newCount ? ` · ${r.newCount} new` : ""}</div>
    </td></tr>
    <tr><td style="padding:4px 24px 24px">
      ${section(opts.city ? `Near you in ${esc(opts.city.replace(/\b\w/g, (c) => c.toUpperCase()))}` : "", local)}
      ${section("Biggest discounts live now", r.biggest.slice(0, 6))}
      ${section("New this week", r.newDeals.slice(0, 5))}
      <p style="text-align:center;margin:28px 0 8px"><a href="${opts.baseUrl}/this-week" style="background:#1C3A22;color:#F4F1E8;padding:12px 20px;border-radius:10px;text-decoration:none;font-family:Arial,sans-serif;font-weight:700">See the full week</a></p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#6B7268;margin-top:22px;line-height:1.5">
        Checked on each store's own site. No store pays to rank. Always confirm with the dispensary before you go.<br>
        You're getting this because you signed up at puffprice.com. <a href="${opts.unsubscribeUrl}" style="color:#6B7268">Unsubscribe</a>.
      </p>
    </td></tr>
  </table></td></tr></table></body></html>`;

  const text = [
    `PuffPrice weekly — ${range}`,
    `${r.dealsSeen} deals at ${r.storesWithDeals} stores`,
    "",
    "BIGGEST DISCOUNTS",
    ...r.biggest.slice(0, 6).map((d) => `- ${d.title}${d.pct != null ? ` (${d.pct}%)` : ""} — ${d.store}, ${d.city}`),
    "",
    `Full week: ${opts.baseUrl}/this-week`,
    `Unsubscribe: ${opts.unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}
