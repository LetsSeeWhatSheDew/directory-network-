// Concept R2-1 "The Vault" — finance-grade calm (Mercury / Apple Card lane).
// One enormous number, set thin; everything else small and quiet.
// Two typefaces: Host Grotesk (words + the big number) + Martian Mono (small figures).
// One accent, warm gold, and it appears in exactly one place per screen:
// the button that does the thing.
export const VAULT_CSS = `
html.brx-on,html.brx-on body{background:#F4F1EA!important}
html.brx-on[data-daypart="night"],html.brx-on[data-daypart="night"] body{background:#0C0E0D!important}
.vt{--bg:#F4F1EA;--fg:#121412;--muted:#6B675E;--faint:#9C978C;--line:rgba(18,20,18,.1);--btn:#121412;--btn-fg:#F4F1EA;--gold:#9A7428;--open:#2F6B45;
  background:var(--bg);color:var(--fg);font-family:var(--brx-vault-sans),system-ui,sans-serif;font-size:16px;line-height:1.45;
  max-width:480px;margin:0 auto;padding:0 24px calc(24px + env(safe-area-inset-bottom));min-height:100dvh;display:flex;flex-direction:column}
html[data-daypart="night"] .vt{--bg:#0C0E0D;--fg:#F2EDE3;--muted:#99948A;--faint:#6A665E;--line:rgba(242,237,227,.1);--btn:#E6C47A;--btn-fg:#0C0E0D;--gold:#E6C47A;--open:#8FD3A6}
.vt-n{font-family:var(--brx-vault-mono),ui-monospace,monospace;font-variant-numeric:tabular-nums}
.vt-top{display:flex;justify-content:space-between;align-items:center;min-height:64px}
.vt-word{font-weight:600;font-size:18px;letter-spacing:-.02em;text-decoration:none;display:inline-flex;align-items:center;min-height:44px}
.vt-where{font-size:14px;color:var(--muted)}
.vt-hero{padding-top:9vh}
.vt-label{font-size:14px;color:var(--muted);margin:0}
.vt-big{margin:6px 0 0 -6px;font-family:var(--brx-vault-sans),system-ui,sans-serif;font-weight:300;font-size:152px;line-height:.88;letter-spacing:-.065em;font-variant-numeric:tabular-nums lining-nums}
.vt-big span{font-size:64px;letter-spacing:-.03em;margin-left:6px;vertical-align:top;line-height:1.5}
.vt-what{margin:14px 0 0;font-size:30px;line-height:1.1;font-weight:500;letter-spacing:-.025em}
.vt-store{display:flex;align-items:center;gap:12px;margin:34px 0 0;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.vt-logo{width:40px;height:40px;border-radius:50%;object-fit:contain;padding:4px;background:#fff;flex:none;border:1px solid var(--line)}
.vt-mono{width:40px;height:40px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid var(--line);font-weight:600;font-size:15px}
.vt-store b{display:block;font-weight:600;font-size:17px;letter-spacing:-.01em}
.vt-store small{display:flex;gap:8px;align-items:center;font-size:14px;color:var(--muted)}
.vt-dot{width:7px;height:7px;border-radius:50%;background:var(--open);display:inline-block}
.vt-dx{display:block;width:100%;min-height:52px}
.vt-dx .dx-label{display:flex;justify-content:space-between;align-items:center;font-size:15px;color:var(--muted);min-height:52px}
.vt-dx .dx-mark{width:10px;height:10px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-3px);transition:transform .3s}
.vt-dx[aria-expanded="true"] .dx-mark{transform:rotate(-135deg) translateY(-2px)}
.vt-facts{margin:0;padding:0 0 8px;list-style:none}
.vt-facts li{display:grid;grid-template-columns:118px 1fr;gap:12px;padding:11px 0;border-top:1px solid var(--line);font-size:15px}
.vt-facts li span{color:var(--muted);font-size:13px;line-height:1.5}
.vt-facts a{display:inline-block;min-height:44px;padding:11px 0;margin:-11px 0;color:inherit;text-underline-offset:3px;text-decoration-color:var(--faint)}
.vt-spacer{flex:1;min-height:24px}
.vt-act{position:sticky;bottom:0;padding:12px 0 calc(8px + env(safe-area-inset-bottom));background:linear-gradient(to bottom,transparent,var(--bg) 30%)}
.vt-btn{display:flex;justify-content:space-between;align-items:center;min-height:58px;padding:0 22px;border-radius:14px;background:var(--btn);color:var(--btn-fg)!important;text-decoration:none;font-weight:600;font-size:17px;letter-spacing:-.01em}
.vt-btn i{font-style:normal;font-weight:400;font-size:15px;opacity:.7}
.vt-foot{margin:18px 0 0;font-size:13px;color:var(--faint);display:flex;justify-content:space-between;gap:12px}
.vt-h2{font-size:14px;color:var(--muted);font-weight:500;margin:44px 0 6px}
.vt-row{display:block;width:100%;border-top:1px solid var(--line)}
.vt-row:last-of-type{border-bottom:1px solid var(--line)}
.vt-row-in{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:baseline;padding:16px 0 4px}
.vt-row-in b{font-weight:500;font-size:18px;letter-spacing:-.015em}
.vt-row-in small{display:block;color:var(--muted);font-size:14px}
.vt-row-in em{font-style:normal;font-family:var(--brx-vault-mono),monospace;font-weight:300;font-size:30px;letter-spacing:-.04em}
.vt-row .dx-label{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--faint);padding:0 0 12px}
.vt-row .dx-mark{display:none}
@media (prefers-reduced-motion: reduce){.vt-dx .dx-mark{transition:none}}
.vt h1,.vt h2{color:var(--fg)}
.vt .vt-h2{color:var(--muted)}
`;
