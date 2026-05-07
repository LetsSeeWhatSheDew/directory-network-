// SMS alert scaffold. Activates automatically when TWILIO_* env vars
// land in Vercel — no code change required. Until then, sendSMSAlert()
// returns false and logs what it would have sent so we can see the
// queue build up in Vercel logs.
//
// Required env vars (add in Vercel → puffprice → Settings → Env Vars):
//   TWILIO_ACCOUNT_SID   — starts with "AC…"
//   TWILIO_AUTH_TOKEN    — long opaque string
//   TWILIO_FROM_NUMBER   — the E.164-formatted Twilio-provisioned number
//                          we send FROM, e.g. "+15551234567"

import { brand } from "./brand";

/**
 * Send a deal alert SMS. Returns true on success.
 * Silently returns false when Twilio isn't configured — callers should
 * not treat that as an error.
 */
export async function sendSMSAlert(
  to: string,
  dispensaryName: string,
  dealTitle: string,
  savings: number | null | undefined,
  city: string,
  dealUrl: string
): Promise<boolean> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log("[SMS] Twilio not configured — would have sent to", redactPhone(to));
    return false;
  }

  const savingsPrefix =
    typeof savings === "number" && savings > 0 ? `Save $${savings} at ` : "";
  const message =
    `${brand.name}: ${savingsPrefix}${dispensaryName}` +
    (city ? ` in ${city}` : "") +
    `. ${dealTitle}. ${dealUrl}`;

  try {
    const authBasic = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authBasic}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: process.env.TWILIO_FROM_NUMBER ?? "",
          Body: message,
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[SMS] Twilio returned", res.status, body.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[SMS] Failed to send:", err);
    return false;
  }
}

/** Loose server-side check — accept anything that plausibly looks like a
 * US phone number. Real validation happens at Twilio. */
export function looksLikePhone(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

/** Normalize a user-typed US phone to E.164. Returns null if unparseable. */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function redactPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return "[redacted]";
  return `***-***-${digits.slice(-4)}`;
}
