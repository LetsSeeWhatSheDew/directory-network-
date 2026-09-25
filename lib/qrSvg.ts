// lib/qrSvg.ts — QR codes as inline SVG, rendered on the server.
// Used by the printable counter cards (app/for-dispensaries/**/card).
// Modules draw in currentColor so the page's print-ink token colors them;
// the background is transparent (the card is already white).
import QRCode from "qrcode";

export async function qrSvg(text: string): Promise<string> {
  const svg = await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#000000ff", light: "#00000000" },
  });
  return svg
    .replace(/stroke="#000000"/g, 'stroke="currentColor"')
    .replace(/fill="#000000"/g, 'fill="currentColor"')
    .replace("<svg ", '<svg role="img" aria-label="QR code" ');
}

/** Counter-card link with the campaign tags the analytics side expects. */
export function counterCardUrl(path: string, campaign: string): string {
  const u = new URL(path, "https://www.puffprice.com");
  u.searchParams.set("utm_source", "counter_card");
  u.searchParams.set("utm_medium", "qr");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}
