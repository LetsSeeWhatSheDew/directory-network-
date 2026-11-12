// Concept R2-3 "The Instrument" — PuffPrice as a well-made device
// (Teenage Engineering / Braun lane). Light grey body, white modules with
// soft corners, everything labeled the way a good product is labeled.
// One signal color, orange, and it means one thing: "go" (the button + the
// open-now light). Type: Afacad Flux (words) + Martian Mono (small labels).
export const INSTRUMENT_CSS = `
html.brx-on,html.brx-on body{background:#E7E7E3!important}
html.brx-on[data-daypart="night"],html.brx-on[data-daypart="night"] body{background:#121212!important}
.in{--body:#E7E7E3;--mod:#F8F8F6;--edge:#D3D3CD;--ink:#161616;--muted:#77776F;--sig:#FF5A1F;--sig-ink:#FFFFFF;
  background:var(--body);color:var(--ink);font-family:var(--brx-ins-sans),system-ui,sans-serif;font-size:17px;line-height:1.4;
  max-width:480px;margin:0 auto;padding:0 14px calc(20px + env(safe-area-inset-bottom));min-height:100dvh;display:flex;flex-direction:column}
html[data-daypart="night"] .in{--body:#121212;--mod:#1C1C1C;--edge:#2C2C2C;--ink:#EDEDEA;--muted:#8D8D86}
.in-m{font-family:var(--brx-vault-mono),ui-monospace,monospace;font-variant-numeric:tabular-nums}
.in-top{display:flex;justify-content:space-between;align-items:center;min-height:64px;padding:0 6px}
.in-word{font-weight:700;font-size:21px;letter-spacing:-.01em;text-decoration:none;display:inline-flex;align-items:center;gap:7px;min-height:44px;text-transform:lowercase}
.in-word i{width:9px;height:9px;border-radius:50%;background:var(--sig);display:inline-block}
.in-clock{font-family:var(--brx-vault-mono),monospace;font-size:12px;color:var(--muted)}
.in-mod{background:var(--mod);border:1px solid var(--edge);border-radius:22px;padding:16px 18px}
.in-mod+.in-mod,.in-grid+.in-mod,.in-mod+.in-grid{margin-top:8px}
.in-lbl{display:flex;justify-content:space-between;font-family:var(--brx-vault-mono),monospace;font-size:11px;color:var(--muted);letter-spacing:.02em}
.in-read{display:flex;align-items:flex-end;gap:10px;margin:22px 0 6px}
.in-num{margin:0;font-family:var(--brx-ins-sans),system-ui,sans-serif;font-weight:600;font-size:132px;line-height:.78;letter-spacing:-.05em;font-variant-numeric:tabular-nums}
.in-unit{font-family:var(--brx-vault-mono),monospace;font-size:20px;line-height:1.2;padding-bottom:4px}
.in-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.in-cell{background:var(--mod);border:1px solid var(--edge);border-radius:18px;padding:12px 14px;min-height:92px;display:flex;flex-direction:column;justify-content:space-between}
.in-name{font-weight:600;font-size:21px;line-height:1.1;letter-spacing:-.01em}
.in-cell .in-name small{display:block;font-weight:400;font-size:14px;color:var(--muted);margin-top:3px}
.in-led{display:inline-flex;align-items:center;gap:8px}
.in-led::before{content:"";width:10px;height:10px;border-radius:50%;background:var(--sig);box-shadow:0 0 0 3px color-mix(in srgb,var(--sig) 22%,transparent)}
.in-led.off::before{background:var(--edge);box-shadow:none}
.in-dx{display:block;width:100%;margin-top:8px;background:var(--mod);border:1px solid var(--edge);border-radius:18px;padding:0 18px}
.in-dx .dx-label{display:flex;justify-content:space-between;align-items:center;min-height:52px;font-size:16px}
.in-dx .dx-mark{width:28px;height:16px;border-radius:999px;background:var(--edge);position:relative;transition:background .25s}
.in-dx .dx-mark::after{content:"";position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--mod);transition:transform .25s}
.in-dx[aria-expanded="true"] .dx-mark{background:var(--ink)}
.in-dx[aria-expanded="true"] .dx-mark::after{transform:translateX(12px)}
.in-pmod{margin-top:8px;background:var(--mod);border:1px solid var(--edge);border-radius:18px;padding-top:4px}
.in-facts{list-style:none;margin:0;padding:0 18px 8px}
.in-facts li{display:grid;grid-template-columns:96px 1fr;gap:10px;padding:10px 0;border-top:1px dashed var(--edge);font-size:15px}
.in-facts li:first-child{border-top:0}
.in-facts li span{font-family:var(--brx-vault-mono),monospace;font-size:11px;color:var(--muted);padding-top:3px}
.in-facts a{color:inherit;text-underline-offset:3px;display:block;padding:12px 0;margin:-12px 0}
.in-spacer{flex:1;min-height:16px}
.in-act{position:sticky;bottom:0;padding:10px 0 calc(6px + env(safe-area-inset-bottom));background:linear-gradient(to bottom,transparent,var(--body) 30%)}
.in-btn{display:flex;align-items:center;justify-content:space-between;min-height:60px;padding:0 22px;border-radius:999px;background:var(--sig);color:var(--sig-ink)!important;text-decoration:none;font-weight:600;font-size:18px}
.in-btn span:last-child{font-family:var(--brx-vault-mono),monospace;font-size:20px}
.in-foot{display:flex;justify-content:space-between;gap:10px;padding:14px 6px 0;font-family:var(--brx-vault-mono),monospace;font-size:10.5px;color:var(--muted)}
.in-h2{font-family:var(--brx-vault-mono),monospace;font-weight:400;font-size:11px;color:var(--muted);margin:22px 6px 8px}
.in-row{display:block;width:100%;background:var(--mod);border:1px solid var(--edge);border-radius:18px;padding:12px 16px 0;margin-top:8px}
.in-row-in{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}
.in-row-in b{display:block;font-weight:600;font-size:18px;line-height:1.15}
.in-row-in small{display:block;font-size:14px;color:var(--muted)}
.in-row-in em{font-style:normal;font-weight:600;font-size:36px;letter-spacing:-.04em}
.in-row .dx-label{display:flex;justify-content:space-between;align-items:center;min-height:36px;font-family:var(--brx-vault-mono),monospace;font-size:11px;color:var(--muted)}
.in-row .dx-mark{width:6px;height:6px;border-radius:50%;background:var(--edge)}
.in-row[aria-expanded="true"] .dx-mark{background:var(--sig)}
@media (prefers-reduced-motion: reduce){.in-dx .dx-mark,.in-dx .dx-mark::after{transition:none}}
.in h1,.in h2{color:var(--ink)}
.in .in-h2{color:var(--muted)}
`;
