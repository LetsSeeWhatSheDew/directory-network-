// lib/weeklyConfirm.ts (server-only) — the one-step-left email for the Monday
// report (double opt-in). Used by /api/alerts/signup and /api/alerts/preferences.
import "server-only";
import { Resend } from "resend";
import { brand } from "./brand";
import { weeklyConfirmUrl } from "./alertSubscribers";
import { alertsFrom } from "./dealAlertEmail";
import { escapeHtml } from "./validation";
import { firstTimeWithin, forgetSeen } from "./rateLimit";

export function renderWeeklyConfirmEmail(confirmUrl: string): { subject: string; html: string; text: string } {
  const subject = `Confirm your ${brand.name} Monday report`;
  const url = escapeHtml(confirmUrl);
  const html = `<!doctype html><html><body style="margin:0;background:#F6F4EE;font-family:system-ui,-apple-system,sans-serif;color:#14201A">
<div style="max-width:520px;margin:0 auto;padding:28px 22px">
<p style="font-size:13px;color:#66706A;margin:0 0 6px">${escapeHtml(brand.name)} · one more step</p>
<h1 style="font-size:22px;margin:0 0 12px">Confirm your email</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 18px">Someone (hopefully you) asked for the ${escapeHtml(brand.name)} Monday report at this address: one email a week with the best Central Illinois dispensary deals.</p>
<p style="margin:0 0 22px"><a href="${url}" style="display:inline-block;background:#1F4D36;color:#F6F4EE;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Yes, send me Mondays</a></p>
<p style="font-size:13px;color:#66706A;line-height:1.55;margin:0">If you didn't ask for this, ignore this email. Nothing starts unless you tap the button. The link works for 7 days.</p>
<p style="font-size:12px;color:#66706A;margin-top:24px">For adults 21 and over.</p>
</div></body></html>`;
  const text = [
    `Someone (hopefully you) asked for the ${brand.name} Monday report at this address.`,
    "",
    `Confirm here: ${confirmUrl}`,
    "",
    "If you didn't ask for this, ignore this email. Nothing starts unless you confirm. The link works for 7 days.",
  ].join("\n");
  return { subject, html, text };
}

export type ConfirmSendResult = "sent" | "throttled" | "unavailable" | "failed";

/**
 * Send the confirm email for weekly row `id`. At most one per address per
 * 10 minutes per instance, so the form can't be used to flood someone's inbox.
 */
export async function sendWeeklyConfirm(email: string, id: string): Promise<ConfirmSendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "unavailable";
  const onceKey = `weekly-confirm:${email.trim().toLowerCase()}`;
  if (!firstTimeWithin(onceKey, 10 * 60_000)) return "throttled";
  const m = renderWeeklyConfirmEmail(weeklyConfirmUrl(brand.url, id));
  try {
    const r = await new Resend(key).emails.send({
      from: alertsFrom(),
      to: email,
      replyTo: brand.supportEmail,
      subject: m.subject,
      html: m.html,
      text: m.text,
    });
    if ((r as { error?: unknown }).error) throw new Error(JSON.stringify((r as { error?: unknown }).error).slice(0, 200));
    return "sent";
  } catch (e) {
    forgetSeen(onceKey);
    console.error("[weekly-confirm] send failed", String(e).slice(0, 200));
    return "failed";
  }
}
