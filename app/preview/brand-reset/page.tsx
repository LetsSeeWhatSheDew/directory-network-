// /preview/brand-reset — index of every preview screen (not public, noindex).
import Link from "next/link";

const DIRS = [
  {
    key: "best-bud",
    name: "A8 · Best Bud",
    line: "“Best Bud For Your Buck$.” A thrifty friend telling you the deal in one sentence, with a check under every claim.",
    pick: "My pick for the brand",
  },
  {
    key: "scout",
    name: "A6 · The Scout",
    line: "“We check 26 stores every morning so you don't.” A field notebook: ruled paper, a stamp, a check for every fact.",
    pick: "Strongest in a store meeting",
  },
];
const SCREENS = [
  ["", "1 · Free home", "One answer, open-now, one button"],
  ["/deal", "2 · Deal opened in place", "Tap any row; it opens right there"],
  ["/pro", "3 · What Pro gets you", "$2.99/mo or $19/yr, not on sale yet"],
  ["/stores", "4 · Dispensary pitch", "Free listing + one paid report"],
] as const;

const CSS = `
html.brx-on,html.brx-on body{background:#F4F2EC!important}
.bri{font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px 20px 60px;line-height:1.45}
.bri h1{font-size:26px;margin:0}
.bri p{color:#555;margin:6px 0 0}
.bri section{margin-top:28px;padding-top:16px;border-top:2px solid #1a1a1a}
.bri h2{font-size:21px;margin:0}
.bri .pick{display:inline-block;margin-top:6px;font-size:13px;font-weight:700;background:#1a1a1a;color:#fff;padding:3px 8px;border-radius:5px}
.bri ul{list-style:none;padding:0;margin:12px 0 0}
.bri li a{display:flex;justify-content:space-between;gap:12px;align-items:center;min-height:52px;padding:8px 0;border-bottom:1px solid #ddd;text-decoration:none;color:inherit}
.bri li a b{font-weight:700}
.bri li a span{font-size:14px;color:#666;text-align:right}
.bri .dn{display:flex;gap:10px;margin-top:10px}
.bri .dn a{flex:1;display:flex;align-items:center;justify-content:center;min-height:44px;border:1.5px solid #1a1a1a;border-radius:8px;text-decoration:none;color:inherit;font-weight:600;font-size:15px}
.bri .note{font-size:14px;margin-top:28px;color:#666}
`;

export default function BrandResetIndex() {
  return (
    <main className="brx bri">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <h1 data-keep-font="">Brand reset previews</h1>
      <p>Nov 10, 2026. Live deals from the database, duplicates removed. Not public, not indexed, not linked from the site.</p>
      {DIRS.map((d) => (
        <section key={d.key}>
          <h2 data-keep-font="">{d.name}</h2>
          <p>{d.line}</p>
          <span className="pick">{d.pick}</span>
          <ul>
            {SCREENS.map(([path, label, hint]) => (
              <li key={path}>
                <Link href={`/preview/brand-reset/${d.key}${path}`}>
                  <b>{label}</b>
                  <span>{hint}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="dn">
            <a href={`/preview/brand-reset/${d.key}?daypart=day`}>Day</a>
            <a href={`/preview/brand-reset/${d.key}?daypart=night`}>Night</a>
          </div>
        </section>
      ))}
      <p className="note">Night look: add ?daypart=night to any screen (it also switches on its own after 7 PM). Docs are in docs/brand-reset-2026-11-10/ on the branch.</p>
    </main>
  );
}
