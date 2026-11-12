// Direction A8 "Best Bud" — the thrifty friend. Plain sentences, one answer,
// a highlighter swipe on the number, a "checked" receipt under every claim.
// Type: one family, Familjen Grotesk, in four weights. One voice, no mono labels.
export const BUD_CSS = `
html.brx-on,html.brx-on body{background:#FAF6EC!important}
html.brx-on[data-daypart="night"],html.brx-on[data-daypart="night"] body{background:#14170F!important}
.bud{--bg:#FAF6EC;--ink:#1B1E16;--body:#3D4034;--muted:#6B6A5C;--line:#E4DCC8;--green:#1E6B3A;--green-ink:#FFFFFF;--hi:#FFE14D;--hi-ink:#1B1E16;--card:#FFFDF7;--btn:#1B1E16;--btn-ink:#FAF6EC;
  background:var(--bg);color:var(--ink);font-family:var(--brx-bud),system-ui,sans-serif;font-size:17px;line-height:1.45;padding:0 20px calc(28px + env(safe-area-inset-bottom));max-width:520px;margin:0 auto}
html[data-daypart="night"] .bud{--bg:#14170F;--ink:#F3EFE2;--body:#D2CEBF;--muted:#A6A291;--line:#2C3024;--green:#7FD49B;--green-ink:#0F130C;--hi:#E8C93A;--hi-ink:#14170F;--card:#1B1F16;--btn:#F3EFE2;--btn-ink:#14170F}
.bud-top{display:flex;align-items:center;justify-content:space-between;padding:18px 0 0}
.bud-word{font-family:var(--brx-bud);font-weight:700;font-size:22px;letter-spacing:-.02em;text-decoration:none;line-height:1;display:inline-flex;align-items:center;min-height:44px}
.bud-word i{font-style:normal;color:var(--green)}
.bud-where{font-size:15px;color:var(--muted);text-decoration:none;min-height:44px;display:inline-flex;align-items:center}
.bud-line{font-family:var(--brx-bud);font-weight:600;font-size:15px;color:var(--muted);margin:-8px 0 0}
.bud-line b{color:var(--green);font-weight:700}
.bud-date{margin:44px 0 10px;font-size:16px;color:var(--muted)}
.bud-hero{display:block;width:100%;text-decoration:none}
.bud-say{font-family:var(--brx-bud);font-weight:600;font-size:42px;line-height:1.06;letter-spacing:-.025em;margin:0;color:var(--ink)}
.bud-hi{background:linear-gradient(176deg,transparent 0 46%,var(--hi) 46% 92%,transparent 92%);padding:0 .08em;margin:0 -.04em;-webkit-box-decoration-break:clone;box-decoration-break:clone;color:var(--hi-ink)}
html[data-daypart="night"] .bud-hi{color:var(--ink);background:linear-gradient(176deg,transparent 0 50%,color-mix(in srgb,var(--hi) 55%,transparent) 50% 92%,transparent 92%)}
.bud-sub{margin:18px 0 0;font-size:18px;color:var(--body);display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center}
.bud-open{display:inline-flex;align-items:center;gap:7px;font-weight:700;color:var(--green)}
.bud-open::before{content:"";width:9px;height:9px;border-radius:50%;background:currentColor}
.bud-closed{color:var(--muted);font-weight:700}
.bud-proof{margin:14px 0 0;font-size:15px;color:var(--muted);display:flex;gap:8px;align-items:flex-start}
.bud-proof svg{flex:none;margin-top:3px;color:var(--green)}
.bud-tap{margin:22px 0 0;display:flex;align-items:center;justify-content:space-between;width:100%;min-height:52px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);font-size:16px;font-weight:700;color:var(--ink)}
.bud-tap span:last-child{transition:transform .25s ease;font-size:20px;line-height:1}
.bud-tap[aria-expanded="true"] span:last-child{transform:rotate(45deg)}
.bud-more{display:grid;grid-template-rows:0fr;transition:grid-template-rows .32s cubic-bezier(.2,.8,.2,1)}
.bud-more.on{grid-template-rows:1fr}
.bud-more>div{overflow:hidden}
.bud-facts{list-style:none;margin:0;padding:6px 0 4px}
.bud-facts li{padding:14px 0;border-bottom:1px solid var(--line)}
.bud-facts li:last-child{border-bottom:0}
.bud-k{display:block;font-size:14px;color:var(--muted);margin-bottom:2px}
.bud-v{font-size:17px;color:var(--ink)}
.bud-v a{font-weight:700;color:var(--green);text-underline-offset:3px}
.bud-quote{font-family:var(--brx-bud);font-weight:500}
.bud-act{position:sticky;bottom:0;padding:14px 0 calc(10px + env(safe-area-inset-bottom));background:linear-gradient(to bottom,transparent,var(--bg) 22%);margin-top:28px}
.bud-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:58px;border-radius:16px;background:var(--btn);color:var(--btn-ink)!important;font-family:var(--brx-bud);font-weight:700;font-size:19px;text-decoration:none}
.bud-btn.ghost{background:transparent;color:var(--ink)!important;border:2px solid var(--ink)}
.bud-foot{margin:28px 0 0;font-size:14px;color:var(--muted);line-height:1.5}
.bud-foot b{color:var(--ink)}
.bud-h2{font-family:var(--brx-bud);font-weight:700;font-size:20px;margin:40px 0 4px;letter-spacing:-.01em}
.bud-row{display:block;width:100%;padding:16px 0;border-bottom:1px solid var(--line)}
.bud-row-say{font-family:var(--brx-bud);font-weight:600;font-size:21px;line-height:1.2;letter-spacing:-.01em}
.bud-row-sub{font-size:15px;color:var(--muted);margin-top:4px;display:flex;justify-content:space-between;gap:10px}
.bud-row-sub span:last-child{font-weight:700;color:var(--ink)}
.bud-row[aria-expanded="true"] .bud-row-sub span:last-child{color:var(--green)}
.bud-inline{padding:4px 0 6px}
.bud-inline a.bud-btn{min-height:52px;font-size:17px;margin-top:10px}
.bud-big{font-family:var(--brx-bud);font-weight:700;font-size:40px;line-height:1.05;letter-spacing:-.025em;margin:40px 0 0}
.bud-lede{font-size:19px;color:var(--body);margin:14px 0 0}
.bud-list{list-style:none;margin:26px 0 0;padding:0;border-top:1px solid var(--line)}
.bud-list li{padding:16px 0;border-bottom:1px solid var(--line);display:grid;grid-template-columns:28px 1fr;gap:4px 10px}
.bud-list .n{font-family:var(--brx-bud);font-weight:700;color:var(--green);font-size:18px;line-height:1.35}
.bud-list b{font-family:var(--brx-bud);font-weight:700;font-size:19px;display:block}
.bud-list p{margin:3px 0 0;color:var(--body);font-size:16px}
.bud-list .eg{display:block;margin-top:8px;padding:10px 12px;border-radius:10px;background:var(--card);border:1px solid var(--line);font-size:15px;color:var(--ink)}
.bud-price{margin:30px 0 0;padding:20px;border-radius:18px;background:var(--card);border:1px solid var(--line)}
.bud-price .amt{font-family:var(--brx-bud);font-weight:700;font-size:34px;letter-spacing:-.02em}
.bud-price .amt small{font-size:18px;font-weight:600;color:var(--muted)}
.bud-price p{margin:6px 0 0;color:var(--body);font-size:16px}
.bud-note{display:inline-block;margin-top:12px;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,var(--hi) 35%,transparent);font-size:14px;font-weight:700;color:var(--ink)}
.bud-free{margin:22px 0 0;font-size:16px;color:var(--body)}
.bud-free b{color:var(--ink)}
.bud-table{width:100%;border-collapse:collapse;margin:16px 0 0;font-size:15px}
.bud-table th{text-align:left;font-weight:700;color:var(--muted);font-size:13px;padding:0 0 8px;border-bottom:2px solid var(--ink)}
.bud-table th:not(:first-child),.bud-table td:not(:first-child){text-align:right}
.bud-table td{padding:12px 0;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}
.bud-table tr.me td{font-weight:700}
.bud-table tr.me td:first-child::after{content:" (you)";font-weight:400;color:var(--muted)}
.bud-cap{font-size:14px;color:var(--muted);margin:10px 0 0}
.bud-tiers{margin:26px 0 0;display:grid;gap:12px}
.bud-tier{padding:18px;border-radius:16px;border:1px solid var(--line);background:var(--card)}
.bud-tier.pick{border:2px solid var(--ink)}
.bud-tier.later{background:transparent;border-style:dashed;color:var(--muted)}
.bud-tier h3{margin:0;font-family:var(--brx-bud);font-weight:700;font-size:21px;display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.bud-tier h3 span{font-size:17px;white-space:nowrap}
.bud-tier ul{margin:10px 0 0;padding-left:18px;color:var(--body);font-size:16px}
.bud-tier.later ul{color:var(--muted)}
.bud-tier li{margin:4px 0}
.bud-tier .why{display:block;margin-top:10px;font-size:14px}
@media (prefers-reduced-motion: reduce){.bud-more{transition:none}}
.bud h1,.bud h2,.bud h3{color:var(--ink)}
`;
