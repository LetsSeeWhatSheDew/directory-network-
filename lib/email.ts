import { Resend } from "resend";
import { brand } from "./brand";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendWelcomeEmail(to: string) {
  const resend = getResend();
  return resend.emails.send({
    from: `${brand.name} <${brand.supportEmail}>`,
    to,
    subject: `Welcome to ${brand.name}`,
    html: `<p>You're now getting deal alerts from ${brand.name}. We'll notify you when new deals match your area.</p>`,
  });
}

export async function sendDealAlert(
  to: string,
  deals: Array<{ title: string; dispensary: string; savings: number; city: string }>
) {
  const resend = getResend();
  const dealList = deals
    .map(
      (d) =>
        `<li><strong>${d.dispensary}</strong> — ${d.title} — Save $${d.savings} (${d.city})</li>`
    )
    .join("");
  return resend.emails.send({
    from: `${brand.name} <${brand.supportEmail}>`,
    to,
    subject: `New deals near you — ${brand.name}`,
    html: `<p>New deals posted near you:</p><ul>${dealList}</ul><p><a href="https://${brand.domain}">See all deals</a></p>`,
  });
}
