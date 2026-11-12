// Concept R2-2 "The Gallery" — every deal is hung like a piece in a gallery:
// a color plate, and a wall label beside it (title, maker, medium, dates).
// Hospitality calm (Aesop / Le Labo lane): stone walls, ink, nothing shouting.
// Type: Hedvig Letters Serif (the plate + titles) + Hedvig Letters Sans (labels).
// Color comes only from the plate, keyed to the product type.
export const GALLERY_CSS = `
html.brx-on,html.brx-on body{background:#EAE6DF!important}
html.brx-on[data-daypart="night"],html.brx-on[data-daypart="night"] body{background:#171614!important}
.gl{--wall:#EAE6DF;--label:#F7F5F1;--ink:#1B1A18;--muted:#6E6A62;--line:rgba(27,26,24,.14);--plate:#C2A27E;--plate-ink:#1B1A18;
  background:var(--wall);color:var(--ink);font-family:var(--brx-gal-sans),system-ui,sans-serif;font-size:16px;line-height:1.5;
  max-width:480px;margin:0 auto;padding:0 20px calc(24px + env(safe-area-inset-bottom));min-height:100dvh;display:flex;flex-direction:column}
html[data-daypart="night"] .gl{--wall:#171614;--label:#211F1C;--ink:#EDE9E2;--muted:#A19C92;--line:rgba(237,233,226,.14);--plate-ink:#141311}
.gl[data-plate="flower"]{--plate:#A9B39A}.gl[data-plate="edible"]{--plate:#D1A08A}.gl[data-plate="vape"]{--plate:#9CA8B5}.gl[data-plate="concentrate"]{--plate:#CDAE72}.gl[data-plate="preroll"]{--plate:#B9A98F}
html[data-daypart="night"] .gl[data-plate="flower"]{--plate:#8E9A7E}html[data-daypart="night"] .gl[data-plate="edible"]{--plate:#B98670}html[data-daypart="night"] .gl[data-plate="vape"]{--plate:#7F8B98}html[data-daypart="night"] .gl[data-plate="concentrate"]{--plate:#B0924F}
.gl-top{display:flex;justify-content:space-between;align-items:baseline;padding:22px 0 18px}
.gl-word{font-family:var(--brx-gal-serif),Georgia,serif;font-size:26px;letter-spacing:-.01em;text-decoration:none;min-height:44px;display:inline-flex;align-items:center}
.gl-room{font-size:13px;color:var(--muted)}
.gl-plate{position:relative;background:var(--plate);color:var(--plate-ink);aspect-ratio:1/1;max-height:46vh;width:100%;display:flex;flex-direction:column;justify-content:space-between;padding:18px 20px 16px}
.gl-plate small{font-size:13px;opacity:.75}
.gl-num{margin:0;font-family:var(--brx-gal-serif),Georgia,serif;font-weight:400;font-size:148px;line-height:.82;letter-spacing:-.045em}
.gl-num span{font-size:54px;letter-spacing:0;margin-left:4px}
.gl-cap{display:flex;justify-content:space-between;font-size:13px;opacity:.8}
.gl-label{background:var(--label);padding:18px 20px 6px;border-left:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.gl-title{margin:0;font-family:var(--brx-gal-serif),Georgia,serif;font-size:27px;line-height:1.15;letter-spacing:-.01em}
.gl-maker{margin:6px 0 0;font-size:16px}
.gl-medium{margin:2px 0 12px;font-size:15px;color:var(--muted)}
.gl-medium b{font-weight:400;color:var(--ink)}
.gl-dx{display:block;width:100%;border-top:1px solid var(--line)}
.gl-dx .dx-label{display:flex;justify-content:space-between;align-items:center;min-height:48px;font-size:14px;color:var(--muted)}
.gl-dx .dx-mark{width:14px;height:14px;position:relative}
.gl-dx .dx-mark::before,.gl-dx .dx-mark::after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:currentColor;transition:transform .3s}
.gl-dx .dx-mark::after{transform:rotate(90deg)}
.gl-dx[aria-expanded="true"] .dx-mark::after{transform:rotate(0)}
.gl-facts{list-style:none;margin:0;padding:0 0 10px}
.gl-facts li{padding:10px 0;border-top:1px solid var(--line);font-size:15px}
.gl-facts li span{display:block;font-size:12px;color:var(--muted)}
.gl-facts a{display:inline-block;min-height:44px;padding:11px 0;margin:-11px 0;color:inherit;text-underline-offset:3px}
.gl-spacer{flex:1;min-height:20px}
.gl-act{position:sticky;bottom:0;padding:12px 0 calc(8px + env(safe-area-inset-bottom));background:linear-gradient(to bottom,transparent,var(--wall) 30%)}
.gl-btn{display:flex;align-items:center;justify-content:center;min-height:56px;background:var(--ink);color:var(--wall)!important;text-decoration:none;font-size:16px;letter-spacing:.01em}
.gl-foot{margin:16px 0 0;font-size:12px;color:var(--muted);text-align:center}
.gl-foot em{font-family:var(--brx-gal-serif),Georgia,serif;font-style:normal;font-size:15px;color:var(--ink);display:block;margin-bottom:2px}
.gl-h2{margin:40px 0 8px;font-family:var(--brx-gal-serif),Georgia,serif;font-weight:400;font-size:22px}
.gl-row{display:block;width:100%;border-top:1px solid var(--line)}
.gl-row-in{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px 0 2px}
.gl-swatch{width:64px;height:64px;background:var(--sw,#B7AE9F);display:flex;align-items:flex-end;padding:6px 7px;font-family:var(--brx-gal-serif),Georgia,serif;font-size:22px;line-height:1;color:#1B1A18}
.gl-row-in b{display:block;font-family:var(--brx-gal-serif),Georgia,serif;font-weight:400;font-size:19px;line-height:1.2}
.gl-row-in small{display:block;font-size:14px;color:var(--muted)}
.gl-row .dx-label{display:flex;justify-content:flex-end;font-size:12px;color:var(--muted);padding:2px 0 10px}
.gl-row .dx-mark{display:none}
@media (prefers-reduced-motion: reduce){.gl-dx .dx-mark::after{transition:none}}
.gl h1,.gl h2{color:var(--ink)}
.gl .gl-num{color:var(--plate-ink)}
`;

/** Plate color key from a deal's category / title. */
export function plateOf(category: string | null, title: string): string {
  const t = `${category || ""} ${title}`.toLowerCase();
  if (/pre-?roll/.test(t)) return "preroll";
  if (/vape|cart|pod|disposable/.test(t)) return "vape";
  if (/edible|gummies|gummy|chocolate/.test(t)) return "edible";
  if (/concentrate|wax|rosin|resin|shatter|badder|dab/.test(t)) return "concentrate";
  if (/flower|ounce|eighth|oz\b|1\/8|smalls/.test(t)) return "flower";
  return "house";
}
export const SWATCH: Record<string, string> = { flower: "#A9B39A", edible: "#D1A08A", vape: "#9CA8B5", concentrate: "#CDAE72", preroll: "#B9A98F", house: "#C2A27E" };
export const PLATE_NAME: Record<string, string> = { flower: "Flower", edible: "Edibles", vape: "Vapes", concentrate: "Concentrates", preroll: "Pre-rolls", house: "On sale" };
