"use client";

// BreatheHero — Breathe final (2026-09-23). Spec: docs/brand/2026-09-23-breathe-final-spec.md
// Motion: docs/brand/2026-09-27-motion-system.md (timings in lib/motion.ts, paced).
// The page opens on an inhale (the orb swells .86 → 1.05 over 2s, its ring
// draws itself in), breathes slowly three times, then rests. The orb leads
// with today's longest exhale — the biggest everyday saving — from live data.
// Tapping a deal is the signature moment: the card opens in place to
// "You're saving X.", the orb breathes out, and a puff ring and plume rise
// out of the card. With no deals the orb holds still, like a held breath.
// Numbers are never held back, faded, scaled or moved. All motion is off
// under reduce-motion. Day/night copy both render; CSS picks by data-daypart.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import ExhaleCard from "./ExhaleCard";
import { MOTION, dur, exhaleSize, releaseExhale } from "../../lib/motion";
import {
  amountOf,
  productOf,
  storeWithCity,
  storeName,
  storeHref,
  directionsHref,
  EXHALE_LINES,
  type ExDeal,
} from "../../lib/exhale";

type Props = {
  hero: ExDeal | null;
  /** Orb subline from lib/exhale nearSubline(): always names the city or the distance. */
  heroLine?: string | null;
  /** The city the server rendered for (pp_loc cookie), or null. */
  serverCity?: string | null;
  cards: ExDeal[];
  dealCount: number | null;
  storeCount: number | null;
  location: React.ReactNode;
};

const CSS = `
.bh{position:relative;overflow:hidden;color:var(--pp-ink);padding:6px 0 8px;isolation:isolate}
.bh-light{position:absolute;left:-140px;top:-120px;width:460px;height:380px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,224,192,.85),rgba(255,224,192,0));pointer-events:none;z-index:-1}
.bh-shaft{position:absolute;inset:0 0 auto 0;height:560px;background:linear-gradient(118deg,rgba(255,244,230,0) 28%,rgba(255,244,230,.6) 40%,rgba(255,244,230,0) 52%);pointer-events:none;z-index:-1}
.bh-moon{display:none;position:absolute;right:-160px;top:-140px;width:460px;height:400px;border-radius:50%;background:radial-gradient(closest-side,rgba(176,204,228,.13),rgba(176,204,228,0));pointer-events:none;z-index:-1}
html[data-daypart="night"] .bh-light,html[data-daypart="night"] .bh-shaft{display:none}
html[data-daypart="night"] .bh-moon{display:block}
.bh-wrap{max-width:1100px;margin:0 auto;padding:0 clamp(1rem,4vw,2rem);display:grid;grid-template-columns:minmax(0,1fr);gap:0}
@media(min-width:960px){.bh-wrap{grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:48px;align-items:center}.bh-stagecol{order:2}.bh-textcol{order:1}}
.bh-stagecol{display:flex;flex-direction:column;align-items:center}
.bh-chip{display:inline-flex;align-items:center;background:rgba(255,250,243,.85);border:1px solid var(--pp-border);border-radius:999px;padding:6px 12px;font-size:.9rem;max-width:100%}
html[data-daypart="night"] .bh-chip{background:rgba(255,255,255,.04);border-color:rgba(238,243,238,.14)}

/* Orb stage. Blobs are radial gradients (nothing that moves is blurred). */
.bh-stage{position:relative;width:100%;max-width:380px;height:350px;display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent}
.bh-stage.held{cursor:default}
.bh-stage>*{grid-area:1/1}
.bh-l{border-radius:50%;will-change:transform;transform:scale(1.05)}
.bh-peach{width:320px;height:320px;background:radial-gradient(closest-side,rgba(243,195,160,1) 22%,rgba(243,195,160,.5) 56%,rgba(243,195,160,0));opacity:.75;translate:-44px -34px}
.bh-sage{width:320px;height:320px;background:radial-gradient(closest-side,rgba(188,208,179,1) 22%,rgba(188,208,179,.5) 56%,rgba(188,208,179,0));opacity:.85;translate:44px 34px}
.bh-core{width:268px;height:268px;background:radial-gradient(circle,#FFFAF3 0%,#FBF1E6 48%,rgba(226,236,218,.9) 74%,rgba(226,236,218,0) 100%)}
.bh-glow{display:none;width:340px;height:340px;background:radial-gradient(circle,rgba(72,150,104,.45) 0%,rgba(40,94,64,.22) 45%,rgba(11,21,16,0) 72%)}
html[data-daypart="night"] .bh-peach,html[data-daypart="night"] .bh-sage,html[data-daypart="night"] .bh-core{display:none}
html[data-daypart="night"] .bh-glow{display:block}
.bh-ring{width:300px;height:300px;overflow:visible;pointer-events:none}
.bh-ring circle{stroke:#1F4D33;stroke-opacity:.3}
html[data-daypart="night"] .bh-ring circle{stroke:#A8E6BF;stroke-opacity:.28}
.bh-release{width:268px;height:268px;border-radius:50%;border:1.5px solid rgba(31,77,51,.35);opacity:0;pointer-events:none}
.bh-release.r2{border-width:1px;border-color:rgba(31,77,51,.25)}
html[data-daypart="night"] .bh-release{border-color:rgba(168,230,191,.4)}
html[data-daypart="night"] .bh-release.r2{border-color:rgba(238,243,176,.3)}
.bh-center{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;max-width:250px}
.bh-label{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--pp-body)}
.bh-num{display:flex;align-items:baseline;gap:6px;margin:6px 0 4px;color:var(--pp-big)}
.bh-num b{font-family:var(--font-body);font-weight:700;font-size:clamp(72px,24vw,96px);line-height:.95;letter-spacing:-.055em}
.bh-num span{font-weight:600;font-size:24px}
html[data-daypart="night"] .bh-num b{text-shadow:0 0 28px rgba(238,243,176,.25)}
.bh-sub{font-size:14px;line-height:1.35;color:var(--pp-body)}
.bh-empty b{font-family:var(--font-mono);font-weight:500;font-size:72px;color:var(--pp-mark)}
.bh-held-t{font-family:var(--font-breath);font-size:30px;line-height:1.08;color:var(--pp-ink);margin:8px 0 6px}
.bh-cue{position:relative;height:16px;width:220px;margin-top:2px;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--pp-muted);text-align:center}
.bh-cue em{position:absolute;left:0;right:0;font-style:normal;opacity:0}
.bh-count{margin:10px 0 0;font-size:14px;color:var(--pp-body);text-align:center}
.bh-count b{font-family:var(--font-mono);font-weight:500;color:var(--pp-mark)}
.bh-count a{color:var(--pp-mark);font-weight:600}

/* Text */
.bh-textcol{display:flex;flex-direction:column;gap:14px;padding-top:22px}
.bh h1.bh-h1{font-size:clamp(40px,11.5vw,56px) !important;line-height:1.02 !important;letter-spacing:-.015em !important;margin:0;text-align:center;text-wrap:balance}
.bh-h1 em{color:var(--pp-mark);font-style:italic}
.bh-body{margin:0;font-size:16px;line-height:1.55;color:var(--pp-body);text-align:center}
.bh-body b{color:var(--pp-ink);font-weight:600}
@media(min-width:960px){.bh h1.bh-h1,.bh-body{text-align:left}}
.bh-night{display:none}
html[data-daypart="night"] .bh-day{display:none}
html[data-daypart="night"] .bh-night{display:inline}
.bh-ctas{display:flex;flex-direction:column;gap:10px;margin-top:4px}
@media(min-width:960px){.bh-ctas{flex-direction:row}}
.bh-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;text-decoration:none;transition:transform var(--pp-t-quick) ease}
.bh-btn:active{transform:scale(.97)}
.bh-btn.primary{min-height:56px;padding:0 24px;font-weight:600;font-size:17px;background:var(--pp-btn);border:1px solid var(--pp-btn-border);color:var(--pp-btn-fg)}
.bh-btn.secondary{min-height:50px;padding:0 20px;font-weight:500;font-size:15px;background:rgba(255,250,243,.7);border:1px solid var(--pp-border-2);color:var(--pp-ink)}
html[data-daypart="night"] .bh-btn.secondary{background:transparent;color:#EEF3EE}

/* Haze (day) / dusk (night) band — layers styled in globals.css (HazeBand). */
.bh-band{position:relative;height:230px;margin-top:44px;overflow:hidden}
.bh-band>div{position:absolute}
.bh-dusk{display:none}
html[data-daypart="night"] .bh-haze{display:none}
html[data-daypart="night"] .bh-dusk{display:block}
.bh-band .dk-moon{right:40px;top:30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(closest-side,rgba(206,220,232,.2),rgba(206,220,232,0))}
.bh-ff{display:none;position:absolute;width:3px;height:3px;border-radius:50%;background:#EEF3B0;box-shadow:0 0 9px 3px rgba(238,243,176,.5);pointer-events:none;opacity:.4}
html[data-daypart="night"] .bh-ff{display:block}

/* Lowest list — cards are ExhaleCard (.pp-dc, globals.css). */
.bh-list{max-width:620px;margin:0 auto;padding:10px clamp(1rem,4vw,2rem) 8px}
.bh-list h2{font-family:var(--font-breath) !important;font-weight:400 !important;font-size:25px !important;margin:0;color:var(--pp-ink);animation:none !important}
.bh-list-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.bh-help{margin:2px 0 12px;font-size:13px;color:var(--pp-muted)}
.bh-cards{display:flex;flex-direction:column;gap:10px}
.bh-face{display:flex !important;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 16px 14px}
.bh-store{display:block;font-weight:600;font-size:16px;color:var(--pp-ink)}
.bh-store small{font-weight:400;color:var(--pp-muted);font-size:16px}
.bh-prod{display:block;font-size:14px;color:var(--pp-body);margin-top:2px}
.bh-all{display:flex;align-items:center;justify-content:center;min-height:52px;margin-top:14px;border-radius:16px;font-weight:600;font-size:15px;text-decoration:none;color:var(--pp-ink);border:1px solid var(--pp-border-2);background:rgba(255,250,243,.6)}
html[data-daypart="night"] .bh-all{background:transparent;color:#EEF3EE}

/* Motion — build notes at pace 1 (lib/motion.ts); every duration is paced. */
@keyframes pb-inhale{0%{transform:scale(.86)}100%{transform:scale(1.05)}}
@keyframes pb-rest{0%,100%{transform:scale(1.05)}50%{transform:scale(.86)}}
@keyframes pb-exhale{0%{transform:scale(1.05)}100%{transform:scale(.86)}}
@keyframes pb-drawfull{0%{stroke-dashoffset:805}100%{stroke-dashoffset:0}}
@keyframes pb-release{0%{transform:scale(1);opacity:.9}100%{transform:scale(1.9);opacity:0}}
@keyframes pb-cueFirst{0%,85%{opacity:1}100%{opacity:0}}
@keyframes pb-cueHalf{0%{opacity:0}8%,42%{opacity:1}50%,100%{opacity:0}}

@media (prefers-reduced-motion: no-preference){
  /* Inhale on load (.86 → 1.05, 2s), then three slow resting breaths, then still. */
  .bh-stage.load .bh-l{animation:pb-inhale var(--pp-t-inhale) var(--pp-e-inhale) both,pb-rest var(--pp-t-breath) ease-in-out var(--pp-t-inhale) 3}
  .bh-stage.load .bh-ring circle{animation:pb-drawfull var(--pp-t-inhale) var(--pp-e-inhale) both}
  /* Release (1.05 → .86, 2.6s, long soft tail), then a quiet inhale back and hold. */
  .bh-stage.exhale .bh-l{animation:pb-exhale var(--pp-t-release) var(--pp-e-release) both}
  .bh-stage.after .bh-l{animation:pb-inhale var(--pp-t-inhale) var(--pp-e-inhale) both}
  .bh-stage.exhale .bh-release{animation:pb-release var(--pp-t-release) var(--pp-e-release) both}
  .bh-stage.exhale .bh-release.r2{animation:pb-release var(--pp-t-release) var(--pp-e-release) calc(700ms * var(--pp-pace)) both}
  .bh-cue .c0{animation:pb-cueFirst var(--pp-t-inhale) linear both}
  .bh-cue .c1{animation:pb-cueHalf var(--pp-t-breath) linear var(--pp-t-inhale) 3}
  .bh-cue .c2{animation:pb-cueHalf var(--pp-t-breath) linear calc(var(--pp-t-inhale) + var(--pp-t-breath) / 2) 3}
}
@media (prefers-reduced-motion: reduce){
  .bh-cue .c0,.bh-cue .c2{display:none}
  .bh-cue .c1{opacity:1}
  .bh-ring circle{stroke-dashoffset:0 !important}
}
`;

export default function BreatheHero({ hero, heroLine, serverCity = null, cards, dealCount, storeCount, location }: Props) {
  const [phase, setPhase] = useState<"load" | "exhale" | "after">("load");
  const [breaths, setBreaths] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // The location chip and the orb read the same pp_loc cookie. When the chip
  // settles on a different city than the server rendered for (first visit, or
  // a new pick in the city picker), re-render so the orb follows the chip.
  useEffect(() => {
    const on = (e: Event) => {
      const c = (e as CustomEvent<{ city?: string } | null>).detail?.city || null;
      if (c && c.toLowerCase() !== (serverCity || "").toLowerCase()) router.refresh();
      // Chip fell back to "Central Illinois" and the cookie is gone: follow it.
      if (!c && serverCity && !/(?:^|;\s*)pp_loc=[^;]/.test(document.cookie)) router.refresh();
    };
    window.addEventListener("cl:location-resolved", on);
    return () => window.removeEventListener("cl:location-resolved", on);
  }, [serverCity, router]);
  const loadedAt = useRef<number>(0);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadedAt.current = Date.now();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // The orb breathes out (1.05 → .86 over the release), then quietly back in.
  const exhale = useCallback(() => {
    // Mid-inhale on load, a tap waits a beat (at most 400ms) so the breath isn't cut.
    const wait = Math.max(0, dur(MOTION.inhale) - (Date.now() - loadedAt.current));
    const run = () => {
      setPhase("exhale");
      setBreaths((n) => n + 1);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPhase("after"), dur(MOTION.release));
    };
    if (wait > 0) setTimeout(run, Math.min(wait, 400));
    else run();
  }, []);

  const amt = hero ? amountOf(hero) : null;
  // Nothing at all today: the orb holds still, like a held breath.
  const held = !hero && !(dealCount && dealCount > 0);
  const heroSize = amt ? exhaleSize(amt.kind === "dollars" ? { dollars: amt.value } : { percent: amt.value }) : 0.5;

  // Tapping the orb itself: it breathes out and the plume rises out of it.
  const onOrb = () => {
    exhale();
    releaseExhale(stageRef.current, heroSize, true);
  };

  return (
    <section className="bh" aria-labelledby="bh-title">
      <style>{CSS}</style>
      <div className="bh-light" aria-hidden="true" />
      <div className="bh-shaft" aria-hidden="true" />
      <div className="bh-moon" aria-hidden="true" />

      <div className="bh-wrap">
        <div className="bh-stagecol">
          <div className="bh-chip">{location}</div>
          <div
            ref={stageRef}
            className={`bh-stage ${held ? "held" : phase}`}
            onClick={hero ? onOrb : undefined}
            role={hero ? "button" : undefined}
            tabIndex={hero ? 0 : undefined}
            aria-label={hero && amt ? `Today's longest exhale: ${amt.big} off. ${heroLine || `at ${storeWithCity(hero)}`}` : undefined}
            onKeyDown={(e) => {
              if (hero && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onOrb();
              }
            }}
          >
            <div className="bh-l bh-peach" aria-hidden="true" />
            <div className="bh-l bh-sage" aria-hidden="true" />
            <div className="bh-l bh-core" aria-hidden="true" />
            <div className="bh-l bh-glow" aria-hidden="true" />
            <svg className="bh-l bh-ring" viewBox="0 0 280 280" aria-hidden="true">
              <circle cx="140" cy="140" r="128" fill="none" strokeWidth="1.2" strokeDasharray="805 805" transform="rotate(-90 140 140)" style={held ? { strokeDashoffset: 0 } : undefined} />
            </svg>
            <div key={`r1-${breaths}`} className="bh-release" aria-hidden="true" />
            <div key={`r2-${breaths}`} className="bh-release r2" aria-hidden="true" />
            <span className="bh-ff f1" style={{ left: "12%", top: "18%", width: 4, height: 4 }} aria-hidden="true" />
            <span className="bh-ff f2" style={{ left: "86%", top: "62%" }} aria-hidden="true" />
            <span className="bh-ff f3" style={{ left: "9%", top: "77%" }} aria-hidden="true" />
            <span className="bh-ff f4" style={{ left: "80%", top: "12%", width: 2, height: 2 }} aria-hidden="true" />
            <div className="bh-center">
              {hero && amt ? (
                <>
                  <span className="bh-label">Today&rsquo;s longest exhale</span>
                  <span className="bh-num">
                    <b>{amt.big}</b>
                    <span>off</span>
                  </span>
                  <span className="bh-sub">{heroLine || `${productOf(hero)} at ${storeWithCity(hero)}`}</span>
                </>
              ) : !held ? (
                <span className="bh-empty">
                  <b>{dealCount}</b>
                  <span className="bh-sub" style={{ display: "block" }}>deals checked this morning</span>
                </span>
              ) : (
                <>
                  <span className="bh-label">Holding our breath</span>
                  <span className="bh-held-t">Nothing worth exhaling about yet.</span>
                  <span className="bh-sub">We check every store&rsquo;s own site each morning.</span>
                </>
              )}
            </div>
          </div>
          {!held ? (
            <div className="bh-cue" aria-hidden="true">
              <em className="c0">Breathing in</em>
              <em className="c1">Breathe out</em>
              <em className="c2">Breathe in</em>
            </div>
          ) : (
            <p className="bh-count">
              <Link href="/alerts">Get Monday&rsquo;s best deals by email</Link> and we&rsquo;ll tell you when there&rsquo;s one worth it.
            </p>
          )}
          {dealCount != null && dealCount > 0 && (
            <p className="bh-count">
              {hero ? "One of " : ""}
              <b>{dealCount}</b> deals found this morning{storeCount ? ` — we checked ${storeCount} stores` : ""}.
            </p>
          )}
        </div>

        <div className="bh-textcol">
          <h1 id="bh-title" className="bh-h1">
            Take a breath. <em>We found the deal.</em>
          </h1>
          <p className="bh-body">
            <b>Best Bud For Your Buck$.</b>{" "}
            <span className="bh-day">
              {storeCount ?? "Every"} Central Illinois stores, checked on their own sites every morning. You can close the other tabs.
            </span>
            <span className="bh-night">
              Evening. Everything here was checked on the stores&rsquo; own sites this morning, and none of it needs you to hurry.
            </span>
          </p>
          <div className="bh-ctas">
            <Link href="/cannabis/illinois/open-now" className="bh-btn primary">
              <MapPin size={18} strokeWidth={2.25} aria-hidden="true" /> Find deals near me
            </Link>
            <Link href="/ways-to-buy" className="bh-btn secondary">
              Drive-thru, medical &amp; more
            </Link>
          </div>
        </div>
      </div>

      <div className="bh-band bh-haze" aria-hidden="true">
        <div className="hz-sky" />
        <div className="hz-sun" />
        <div className="hz-river" />
        <div className="hz-w hz-w1" />
        <div className="hz-w hz-w2" />
        <div className="hz-w hz-w3" />
      </div>
      <div className="bh-band bh-dusk" aria-hidden="true">
        <div className="dk-sky" />
        <div className="dk-horizon" />
        <div className="dk-moon" />
        <div className="dk-ground" />
        <div className="dk-mist" />
        <span className="bh-ff f1" style={{ left: 80, top: 160 }} />
        <span className="bh-ff f2" style={{ left: 250, top: 176 }} />
        <span className="bh-ff f3" style={{ left: 170, top: 190, width: 2, height: 2 }} />
        <div className="dk-fade" />
      </div>

      {cards.length > 0 && (
        <div className="bh-list">
          <div className="bh-list-head">
            <h2>
              <span className="bh-day">Lowest this morning</span>
              <span className="bh-night">Lowest right now</span>
            </h2>
          </div>
          <p className="bh-help">Tap one to see what you keep.</p>
          <div className="bh-cards">
            {cards.map((d, i) => {
              const id = String(d.deal_id || d.id || i);
              const a = amountOf(d)!;
              return (
                <ExhaleCard
                  key={id}
                  index={i}
                  from="home"
                  deal={{ id, slug: d.slug || d.listing_slug, city: d.city }}
                  saving={a.big}
                  dollars={a.kind === "dollars" ? a.value : null}
                  percent={a.kind === "percent" ? a.value : null}
                  faceClassName="bh-face"
                  words={
                    <>
                      <span className="bh-store">
                        {storeName(d)}
                        {d.city && !storeName(d).toLowerCase().includes(d.city.toLowerCase()) ? <small> · {d.city}</small> : null}
                      </span>
                      <span className="bh-prod">{productOf(d)}</span>
                    </>
                  }
                  aside={<span className="pp-save">Save {a.big}</span>}
                  line={EXHALE_LINES[i % EXHALE_LINES.length]}
                  otdDeal={d}
                  directionsHref={directionsHref(d)}
                  seeHref={storeHref(d)}
                  onOpen={exhale}
                />
              );
            })}
          </div>
          <Link href="/deals/all" className="bh-all">
            See all {dealCount ?? ""} Central IL deals &rarr;
          </Link>
        </div>
      )}
    </section>
  );
}
