// /social — the owner's daily posting kit. Private: admin cookie required
// (same cookie as /admin, in every mode), noindex, not in the sitemap, not linked from any
// public page. Shows today's set of social images (feed + story, day or
// night), a Download button per image and a ready-to-paste caption drafted
// from the same data. How to use it: marketing/social/README.md.
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ADMIN_COOKIE, socialAccessAllowed } from "../../lib/social/access";
import { getAllSocialData } from "../../lib/social/data";
import { captionFor } from "../../lib/social/captions";
import { citySlug, SOCIAL_CITIES } from "../../lib/social/build";
import { LAW_FACTS } from "../../lib/social/laws";
import { META_FIT, WEEK } from "../../lib/social/schedule";
import { ctWeekday, isNightCT } from "../../lib/social/time";
import { SOCIAL_TEMPLATES, TEMPLATE_LABEL, type SocialTemplate } from "../../lib/social/types";
import CopyCaption from "./CopyCaption";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Social kit",
  robots: { index: false, follow: false, nocache: true },
};

const CSS = `
.so{max-width:1180px;margin:0 auto;padding:28px clamp(1rem,4vw,2rem) 72px;color:var(--pp-ink);font-family:var(--font-body)}
.so h1{font-family:var(--font-display);font-size:clamp(2rem,6vw,3rem);line-height:1.05;margin:0 0 8px;font-weight:400}
.so h1 em{font-style:italic;color:var(--pp-mark)}
.so-lede{color:var(--pp-body);max-width:680px;margin:0 0 18px;line-height:1.55}
.so-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}
.so-bar b{font-size:.8rem;color:var(--pp-muted);font-weight:600;margin-right:4px;text-transform:uppercase;letter-spacing:.08em}
.so-chip{display:inline-block;padding:6px 12px;border-radius:999px;border:1px solid var(--pp-border);background:var(--pp-surface);color:var(--pp-ink);text-decoration:none;font-size:.88rem}
.so-chip[aria-current="true"]{background:var(--pp-save-bg);color:var(--pp-save-fg);border-color:var(--pp-save-bg)}
.so-today{background:var(--pp-haze);border:1px solid var(--pp-haze-border);border-radius:18px;padding:14px 18px;margin:18px 0 8px;line-height:1.5}
.so-sec{border-top:1px solid var(--pp-border);padding-top:26px;margin-top:30px}
.so-sec h2{font-family:var(--font-display);font-weight:400;font-size:1.8rem;margin:0 0 4px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.so-pill{font-family:var(--font-body);font-size:.72rem;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--pp-best-tint);color:var(--pp-signal-ink)}
.so-pill.warn{background:var(--pp-note-bg);color:var(--pp-note-fg);border:1px solid var(--pp-note-edge)}
.so-pill.star{background:var(--pp-save-bg);color:var(--pp-save-fg)}
.so-note{color:var(--pp-muted);font-size:.9rem;margin:0 0 14px;max-width:760px;line-height:1.5}
.so-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.78fr) minmax(0,1.3fr);gap:16px;align-items:start}
@media (max-width:900px){.so-grid{grid-template-columns:1fr 1fr}.so-cap-col{grid-column:1/-1}}
.so-img{display:flex;flex-direction:column;gap:8px}
.so-img img{width:100%;height:auto;border-radius:12px;border:1px solid var(--pp-border);background:var(--pp-paper)}
.so-img span{font-size:.8rem;color:var(--pp-muted)}
.so-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:14px;border:1px solid var(--pp-btn-border);background:var(--pp-btn);color:var(--pp-btn-fg);font-weight:600;font-size:.95rem;text-decoration:none;cursor:pointer;font-family:inherit}
.so-cap{display:flex;flex-direction:column;gap:8px}
.so-cap textarea{width:100%;box-sizing:border-box;border:1px solid var(--pp-border);border-radius:14px;background:var(--pp-surface);color:var(--pp-ink);padding:12px 14px;font:inherit;font-size:.92rem;line-height:1.5;resize:vertical}
.so-stop{background:var(--pp-stop-bg);color:var(--pp-stop-fg);border:1px solid var(--pp-stop-edge);border-radius:14px;padding:12px 14px;line-height:1.5;font-size:.92rem}
.so-table{width:100%;border-collapse:collapse;font-size:.92rem;background:var(--pp-surface);border:1px solid var(--pp-border);border-radius:14px;overflow:hidden}
.so-table td,.so-table th{padding:9px 12px;border-top:1px solid var(--pp-border);text-align:left;vertical-align:top}
.so-table th{color:var(--pp-muted);font-weight:600;font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;border-top:none}
.so-table tr[aria-current="true"] td{background:var(--pp-haze)}
`;

type SP = { theme?: string; city?: string; fact?: string };

export default async function SocialPage({ searchParams }: { searchParams: Promise<SP> }) {
  // Private: the /admin password cookie, in every mode (fixtures included).
  // Middleware only guards /admin/*, so the check lives here, before any data
  // is read. tests/unit/social-access.test.ts fails if this ever loosens.
  const cookie = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await socialAccessAllowed(cookie, process.env.ADMIN_PASSWORD))) redirect("/admin-login?from=/social");

  const sp = await searchParams;
  const night = sp.theme ? sp.theme === "night" : isNightCT();
  const theme = night ? "night" : "day";
  const data = await getAllSocialData({ city: sp.city, fact: sp.fact });
  const cityNow = data.city.citySlug;
  const factNow = data.law.fact.id;
  const todayPick = WEEK[ctWeekday()];

  const q = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    const m = { theme, city: sp.city, fact: sp.fact, ...over };
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, v);
    return `/social?${p.toString()}`;
  };
  const src = (t: SocialTemplate, size: "feed" | "story", download = false) => {
    const p = new URLSearchParams({ size, theme });
    if (t === "city") p.set("city", cityNow);
    if (t === "law") p.set("fact", factNow);
    if (download) p.set("download", "1");
    return `/og/social/${t}?${p.toString()}`;
  };
  const order: SocialTemplate[] = [todayPick.template, ...SOCIAL_TEMPLATES.filter((t) => t !== todayPick.template)];

  return (
    <main className="so">
      <style>{CSS}</style>
      <p className="so-note" style={{ margin: "0 0 10px" }}>
        <Link href="/admin" style={{ color: "inherit" }}>← Admin</Link> · Private. Not indexed, not linked publicly.
      </p>
      <h1>
        Today&rsquo;s posts. <em>Save one, paste the caption, done.</em>
      </h1>
      <p className="so-lede">
        Every image and caption below is drawn from this morning&rsquo;s live data, the same numbers the site shows. If a
        template can&rsquo;t say something true today, it tells you instead of posting a number. Rules for where to post
        what: <code>marketing/social/README.md</code>.
      </p>

      <div className="so-bar">
        <b>Theme</b>
        <Link className="so-chip" aria-current={!night} href={q({ theme: "day" })}>Day</Link>
        <Link className="so-chip" aria-current={night} href={q({ theme: "night" })}>Night</Link>
      </div>

      <div className="so-today">
        <b>{todayPick.day}:</b> post <b>{TEMPLATE_LABEL[todayPick.template]}</b>. {todayPick.why}
        {META_FIT[todayPick.template] === "price" && " It names a store and a discount: post it on X, Bluesky, Reddit or a group text, not as an Instagram or Facebook post."}
      </div>

      {order.map((t) => {
        const d = data[t];
        const caption = captionFor(t, data);
        const fit = META_FIT[t];
        return (
          <section key={t} className="so-sec" id={t}>
            <h2>
              {TEMPLATE_LABEL[t]}
              {t === todayPick.template && <span className="so-pill star">Today&rsquo;s pick</span>}
              {fit === "civic" ? <span className="so-pill">OK for Instagram &amp; Facebook</span> : <span className="so-pill warn">Price post: keep off Meta</span>}
            </h2>
            {t === "city" && (
              <div className="so-bar">
                <b>City</b>
                {SOCIAL_CITIES.map((c) => (
                  <Link key={c} className="so-chip" aria-current={citySlug(c) === cityNow} href={`${q({ city: citySlug(c) })}#city`}>{c}</Link>
                ))}
              </div>
            )}
            {t === "law" && (
              <div className="so-bar">
                <b>Fact</b>
                {LAW_FACTS.map((f) => (
                  <Link key={f.id} className="so-chip" aria-current={f.id === factNow} href={`${q({ fact: f.id })}#law`}>{f.id.replace(/-/g, " ")}</Link>
                ))}
              </div>
            )}
            <div className="so-grid">
              {(["feed", "story"] as const).map((size) => (
                <div key={size} className="so-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src(t, size)} alt={`${TEMPLATE_LABEL[t]}, ${size}, ${theme}`} loading="lazy" width={1080} height={size === "feed" ? 1350 : 1920} />
                  <a className="so-btn" href={src(t, size, true)} download>
                    Download {size}
                  </a>
                  <span>{size === "feed" ? "Feed 4:5 · 1080×1350" : "Story 9:16 · 1080×1920"} · {theme}</span>
                </div>
              ))}
              <div className="so-cap-col">
                {caption ? (
                  <CopyCaption text={caption} />
                ) : (
                  <div className="so-stop">
                    Nothing true to post from this one right now{d.status === "unknown" ? ": the data couldn't be read. Try again in a few minutes." : ": there's nothing that qualifies today. Pick another template."}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      <section className="so-sec">
        <h2>The week</h2>
        <table className="so-table">
          <thead><tr><th>Day</th><th>Post</th><th>Why</th><th>Where</th></tr></thead>
          <tbody>
            {WEEK.map((w) => (
              <tr key={w.day} aria-current={w.day === todayPick.day}>
                <td>{w.day}</td>
                <td><a href={`#${w.template}`} style={{ color: "inherit" }}>{TEMPLATE_LABEL[w.template]}</a></td>
                <td>{w.why}</td>
                <td>{META_FIT[w.template] === "civic" ? "Anywhere, Instagram and Facebook included" : "X, Bluesky, Reddit, group texts. Not Meta."}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
