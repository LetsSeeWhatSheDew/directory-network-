// Direction A6 "The Scout" — a field notebook. We go out every morning and
// write down what we found. Ruled paper, a margin line, a check for every
// fact and where it came from. Type: Zilla Slab (the notebook's heading hand,
// sturdy, not cute) + Public Sans (the US government's plain typeface).
export const SCOUT_CSS = `
html.brx-on,html.brx-on body{background:#EEE6D3!important}
html.brx-on[data-daypart="night"],html.brx-on[data-daypart="night"] body{background:#161B18!important}
.sc{--paper:#EEE6D3;--rule:rgba(31,42,36,.075);--margin:#C8644A;--ink:#1F2A24;--body:#3E4740;--muted:#5F665E;--line:rgba(31,42,36,.18);--green:#2F5D3A;--green-ink:#F6F1E4;--stamp:#2F5D3A;--card:#F6F0E1;
  background-color:var(--paper);
  background-image:linear-gradient(var(--rule) 1px,transparent 1px);
  background-size:100% 28px;background-position:0 14px;
  color:var(--ink);font-family:var(--brx-scout-body),system-ui,sans-serif;font-size:17px;line-height:1.5;
  padding:0 20px calc(28px + env(safe-area-inset-bottom)) 34px;max-width:520px;margin:0 auto;position:relative}
.sc::before{content:"";position:absolute;top:0;bottom:0;left:22px;width:1.5px;background:var(--margin);opacity:.55}
html[data-daypart="night"] .sc{--paper:#161B18;--rule:rgba(220,230,220,.05);--margin:#B8705C;--ink:#ECE7DA;--body:#C9CCC2;--muted:#9EA59B;--line:rgba(236,231,218,.16);--green:#8CC79A;--green-ink:#121713;--stamp:#8CC79A;--card:#1D2420}
.sc-top{display:flex;align-items:flex-end;justify-content:space-between;padding:20px 0 10px;border-bottom:2px solid var(--ink)}
.sc-word{font-family:var(--brx-scout-display);font-weight:700;font-size:26px;letter-spacing:-.01em;line-height:1;text-decoration:none;display:inline-flex;align-items:center;min-height:44px}
.sc-meta{font-size:14px;color:var(--muted);text-align:right;line-height:1.3;padding-bottom:6px}
.sc-meta b{color:var(--ink);font-weight:700;display:block}
.sc-kick{margin:30px 0 4px;font-family:var(--brx-scout-display);font-weight:600;font-size:19px;color:var(--muted)}
.sc-entry{position:relative}
.sc-big{font-family:var(--brx-scout-display);font-weight:700;font-size:76px;line-height:.95;letter-spacing:-.02em;margin:6px 0 0;color:var(--ink)}
.sc-big small{font-size:34px;font-weight:600;margin-left:6px}
.sc-what{font-family:var(--brx-scout-display);font-weight:600;font-size:26px;line-height:1.15;margin:10px 0 0}
.sc-where{font-size:18px;color:var(--body);margin:4px 0 0}
.sc-stamp{position:absolute;right:0;top:4px;transform:rotate(-6deg);border:2px solid var(--stamp);color:var(--stamp);border-radius:6px;padding:5px 9px 4px;text-align:center;font-family:var(--brx-scout-body);font-weight:800;font-size:12px;line-height:1.15;letter-spacing:.06em;text-transform:uppercase;background:color-mix(in srgb,var(--paper) 70%,transparent)}
.sc-stamp span{display:block;font-weight:600;letter-spacing:.02em;text-transform:none;font-size:12px}
.sc-checks{list-style:none;margin:20px 0 0;padding:0}
.sc-checks li{display:grid;grid-template-columns:24px 1fr;gap:8px;padding:9px 0;border-top:1px solid var(--line);font-size:17px}
.sc-checks li:last-child{border-bottom:1px solid var(--line)}
.sc-ck{width:20px;height:20px;border:1.5px solid var(--ink);border-radius:3px;display:inline-flex;align-items:center;justify-content:center;margin-top:3px;color:var(--green)}
.sc-checks small{display:block;color:var(--muted);font-size:14px;line-height:1.35}
.sc-checks a{color:var(--green);font-weight:700;text-underline-offset:3px}
.sc-tap{display:flex;width:100%;align-items:center;justify-content:space-between;min-height:52px;margin-top:6px;font-family:var(--brx-scout-display);font-weight:600;font-size:19px;color:var(--ink)}
.sc-tap i{font-style:normal;font-family:var(--brx-scout-body);font-size:15px;color:var(--muted)}
.sc-more{display:grid;grid-template-rows:0fr;transition:grid-template-rows .32s cubic-bezier(.2,.8,.2,1)}
.sc-more.on{grid-template-rows:1fr}
.sc-more>div{overflow:hidden}
.sc-act{position:sticky;bottom:0;padding:14px 0 calc(10px + env(safe-area-inset-bottom));background:linear-gradient(to bottom,transparent,var(--paper) 24%);margin-top:22px}
.sc-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:58px;border-radius:10px;background:var(--green);color:var(--green-ink)!important;font-family:var(--brx-scout-body);font-weight:700;font-size:18px;text-decoration:none;box-shadow:0 2px 0 var(--ink)}
.sc-route{margin:18px 0 0;font-size:15px;color:var(--muted)}
.sc-route a{color:var(--ink);font-weight:700;text-underline-offset:3px}
.sc-foot{margin:26px 0 0;padding-top:12px;border-top:2px solid var(--ink);font-size:14px;color:var(--muted)}
.sc-foot b{color:var(--ink)}
.sc-h2{font-family:var(--brx-scout-display);font-weight:700;font-size:23px;margin:36px 0 2px}
.sc-row{display:block;width:100%;padding:14px 0;border-top:1px solid var(--line)}
.sc-row-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.sc-row b{font-family:var(--brx-scout-display);font-weight:700;font-size:30px;line-height:1}
.sc-row em{font-style:normal;font-size:15px;color:var(--muted)}
.sc-row span.w{display:block;font-size:17px;margin-top:4px}
.sc-row[aria-expanded="true"] em{color:var(--green);font-weight:700}
.sc-inline{padding:0 0 12px}
.sc-inline .sc-btn{min-height:50px;font-size:16px;margin-top:12px}
.sc-title{font-family:var(--brx-scout-display);font-weight:700;font-size:40px;line-height:1.05;margin:30px 0 0}
.sc-lede{font-size:19px;color:var(--body);margin:12px 0 0}
.sc-price{margin:26px 0 0;border:2px solid var(--ink);border-radius:8px;padding:18px;background:var(--card)}
.sc-price .amt{font-family:var(--brx-scout-display);font-weight:700;font-size:36px;line-height:1}
.sc-price .amt small{font-family:var(--brx-scout-body);font-size:16px;font-weight:600;color:var(--muted)}
.sc-price p{margin:8px 0 0;color:var(--body);font-size:16px}
.sc-pending{display:inline-block;margin-top:12px;font-weight:800;font-size:13px;letter-spacing:.05em;text-transform:uppercase;color:var(--margin);border:1.5px solid var(--margin);border-radius:5px;padding:4px 8px}
.sc-ledger{width:100%;border-collapse:collapse;margin:14px 0 0;font-size:15px;font-variant-numeric:tabular-nums}
.sc-ledger th{text-align:left;font-weight:700;font-size:13px;color:var(--muted);padding:0 0 6px;border-bottom:2px solid var(--ink)}
.sc-ledger th:not(:first-child),.sc-ledger td:not(:first-child){text-align:right}
.sc-ledger td{padding:0;height:42px;border-bottom:1px solid var(--line)}
.sc-ledger tr.me td{font-weight:800;color:var(--green)}
.sc-cap{font-size:14px;color:var(--muted);margin:10px 0 0}
.sc-tier{margin:14px 0 0;padding:16px;border-radius:8px;border:1.5px solid var(--line);background:var(--card)}
.sc-tier.pick{border:2px solid var(--ink);box-shadow:4px 4px 0 var(--ink)}
.sc-tier.later{background:transparent;border-style:dashed}
.sc-tier h3{margin:0;display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-family:var(--brx-scout-display);font-weight:700;font-size:22px}
.sc-tier h3 span{font-family:var(--brx-scout-body);font-size:16px;white-space:nowrap}
.sc-tier ul{list-style:none;margin:8px 0 0;padding:0}
.sc-tier li{position:relative;padding:4px 0 4px 26px;font-size:16px;color:var(--body)}
.sc-tier li::before{content:"✓";position:absolute;left:2px;top:4px;color:var(--green);font-weight:800}
.sc-tier.later li::before{content:"○";color:var(--muted)}
.sc-tier .why{display:block;margin-top:8px;font-size:14px;color:var(--muted)}
@media (prefers-reduced-motion: reduce){.sc-more{transition:none}}
.sc h1,.sc h2,.sc h3{color:var(--ink)}
`;
