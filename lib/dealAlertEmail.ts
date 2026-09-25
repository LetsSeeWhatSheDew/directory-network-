// lib/dealAlertEmail.ts — the two emails behind "Email me new deals":
// the confirm email (double opt-in) and the daily digest. Table layout,
// inline styles, Breathe palette (paper, haze, deep green). Plain words,
// every line from real data. Footer always carries the 21+ line and a
// one-click way out.
import { brand } from "./brand";

const C = {
  paper: "#F6F4EE",
  card: "#FFFFFF",
  ink: "#14201A",
  body: "#3A463F",
  muted: "#66706A",
  line: "#E4E1D8",
  green: "#1F4D36",
  onGreen: "#F6F4EE",
  hazeA: "#FBE9DC",
  hazeB: "#E9EFE1",
};
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";
const SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif";

export const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function alertsFrom(): string {
  return process.env.ALERTS_FROM || `${brand.name} <alerts@puffprice.com>`;
}

function shell(opts: { eyebrow: string; title: string; lede: string; body: string; footer: string }): string {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;background:${C.paper}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border:1px solid ${C.line};border-radius:20px;overflow:hidden">
  <tr><td style="background:${C.hazeA};background-image:linear-gradient(135deg,${C.hazeA},#F9EFE4,${C.hazeB});padding:24px 24px 20px;font-family:${SANS}">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.green}">${esc(opts.eyebrow)}</div>
    <div style="font-family:${SERIF};font-size:28px;line-height:1.15;color:${C.ink};margin-top:6px">${esc(opts.title)}</div>
    <div style="font-size:14px;line-height:1.5;color:${C.body};margin-top:8px">${opts.lede}</div>
  </td></tr>
  <tr><td style="padding:8px 24px 24px;font-family:${SANS};color:${C.ink}">
    ${opts.body}
    <p style="font-size:12px;color:${C.muted};margin:26px 0 0;line-height:1.55;border-top:1px solid ${C.line};padding-top:14px">${opts.footer}</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

const FOOT_21 = "For adults 21 and over. Independent: nobody pays us to rank. Deals are checked on each store's own site; confirm with the store before you go.";

// ---------------- confirm ----------------
export function renderConfirmEmail(o: { what: string; confirmUrl: string }): { subject: string; html: string; text: string } {
  const subject = `Confirm: email me new deals ${o.what}`;
  const body = `
    <p style="font-size:15px;line-height:1.6;margin:16px 0">Tap the button to start. After that, we'll send one short email on mornings when there's something new ${esc(o.what)}. Quiet days, no email.</p>
    <p style="margin:22px 0"><a href="${o.confirmUrl}" style="display:inline-block;background:${C.green};color:${C.onGreen};padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Yes, email me new deals</a></p>
    <p style="font-size:13px;color:${C.muted};line-height:1.55;margin:0">If you didn't ask for this, ignore this email. Nothing starts unless you tap the button. The link works for 7 days.</p>`;
  const html = shell({
    eyebrow: `${brand.name} · one more step`,
    title: "Confirm your email",
    lede: `You asked us to email you new deals ${esc(o.what)}.`,
    body,
    footer: FOOT_21,
  });
  const text = [
    `You asked ${brand.name} to email you new deals ${o.what}.`,
    "",
    `Confirm here: ${o.confirmUrl}`,
    "",
    "If you didn't ask for this, ignore this email. Nothing starts unless you confirm. The link works for 7 days.",
    "",
    FOOT_21,
  ].join("\n");
  return { subject, html, text };
}

// ---------------- digest ----------------
export type DigestDeal = {
  id: string;
  title: string;
  store: string;
  city: string;
  save: string | null; // "Save 25%"
  otd: string | null; // "About $151.80 out the door · $75.90 each"
  href: string; // absolute, with utm
};
export type DigestSection = { heading: string; deals: DigestDeal[]; stopUrl: string; stopLabel: string };

export function renderDigestEmail(o: {
  sections: DigestSection[];
  unsubscribeAllUrl: string;
  dayLabel: string; // "Thu, Sep 25"
}): { subject: string; html: string; text: string } {
  const all = o.sections.flatMap((s) => s.deals);
  const n = new Set(all.map((d) => d.id)).size;
  const lead = all[0];
  const subject =
    n === 1 && lead
      ? `New at ${lead.store}: ${lead.title}`.slice(0, 110)
      : `${n} new deals${o.sections.length === 1 ? ` ${o.sections[0].heading.replace(/^New /, "")}` : ""} this morning`;

  const row = (d: DigestDeal) => `
    <tr><td style="padding:12px 0;border-top:1px solid ${C.line}">
      <a href="${d.href}" style="color:${C.ink};text-decoration:none;display:block">
        <div style="font-weight:700;font-size:15px;line-height:1.35">${esc(d.title)}${d.save ? ` <span style="display:inline-block;font-size:12px;font-weight:700;color:${C.green};background:${C.hazeB};padding:2px 8px;border-radius:999px;margin-left:4px">${esc(d.save)}</span>` : ""}</div>
        <div style="font-size:13px;color:${C.muted};margin-top:2px">${esc(d.store)} · ${esc(d.city)}</div>
        ${d.otd ? `<div style="font-size:13px;color:${C.body};margin-top:3px">${esc(d.otd)}</div>` : ""}
        <div style="font-size:13px;color:${C.green};margin-top:5px;font-weight:600">See the deal &rarr;</div>
      </a>
    </td></tr>`;

  const sections = o.sections
    .map(
      (s) => `
    <div style="font-family:${SERIF};font-size:21px;color:${C.ink};margin:22px 0 4px">${esc(s.heading)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${s.deals.map(row).join("")}</table>`
    )
    .join("");

  const stops = o.sections.map((s) => `<a href="${s.stopUrl}" style="color:${C.muted}">${esc(s.stopLabel)}</a>`).join(" · ");
  const footer = `${FOOT_21}<br><br>You're getting this because you asked for it at puffprice.com. ${stops} · <a href="${o.unsubscribeAllUrl}" style="color:${C.muted}">Unsubscribe from all ${brand.name} email</a>`;

  const html = shell({
    eyebrow: `${brand.name} · ${o.dayLabel}`,
    title: n === 1 ? "One new deal" : `${n} new deals`,
    lede: "Posted on the store's own site since yesterday morning.",
    body: sections,
    footer,
  });

  const text = [
    `${brand.name} · ${o.dayLabel}`,
    n === 1 ? "One new deal since yesterday morning." : `${n} new deals since yesterday morning.`,
    "",
    ...o.sections.flatMap((s) => [
      s.heading.toUpperCase(),
      ...s.deals.map((d) => `- ${d.title}${d.save ? ` (${d.save})` : ""} · ${d.store}, ${d.city}${d.otd ? `\n  ${d.otd}` : ""}\n  ${d.href}`),
      `${s.stopLabel}: ${s.stopUrl}`,
      "",
    ]),
    FOOT_21,
    `Unsubscribe from all ${brand.name} email: ${o.unsubscribeAllUrl}`,
  ].join("\n");

  return { subject, html, text };
}
