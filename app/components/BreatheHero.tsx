"use client";

// BreatheHero — Breathe final (2026-09-23). Spec: docs/brand/2026-09-23-breathe-final-spec.md
// The page opens on an inhale (the orb swells, its ring draws itself in),
// then breathes on an 8-second cycle. The orb leads with today's longest
// exhale — the biggest everyday saving — from live data. Tapping a deal is
// the signature moment: the orb breathes out, a ring releases, warm light
// washes the screen, and "You're saving X." slides up into place.
// Numbers are never held back, faded or scaled. All motion is off under
// reduce-motion. Day/night copy both render; CSS picks by data-daypart.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
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

/* Orb stage */
.bh-stage{position:relative;width:100%;max-width:380px;height:350px;display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent}
.bh-stage>*{grid-area:1/1}
.bh-l{border-radius:50%;will-change:transform}
.bh-peach{width:200px;height:200px;background:#F3C3A0;filter:blur(38px);opacity:.75;transform-origin:center;translate:-44px -34px}
.bh-sage{width:200px;height:200px;background:#BCD0B3;filter:blur(40px);opacity:.85;translate:44px 34px}
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
.bh-upto{font-size:12px;color:var(--pp-muted)}
.bh-empty b{font-family:var(--font-mono);font-weight:500;font-size:72px;color:var(--pp-mark)}
.bh-cue{position:relative;height:16px;width:220px;margin-top:2px;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--pp-muted);text-align:center}
.bh-cue em{position:absolute;left:0;right:0;font-style:normal;opacity:0}
.bh-count{margin:10px 0 0;font-size:14px;color:var(--pp-body);text-align:center}
.bh-count b{font-family:var(--font-mono);font-weight:500;color:var(--pp-mark)}

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
.bh-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;text-decoration:none;transition:transform .16s ease}
.bh-btn:active{transform:scale(.97)}
.bh-btn.primary{min-height:56px;padding:0 24px;font-weight:600;font-size:17px;background:var(--pp-btn);border:1px solid var(--pp-btn-border);color:var(--pp-btn-fg)}
.bh-btn.secondary{min-height:50px;padding:0 20px;font-weight:500;font-size:15px;background:rgba(255,250,243,.7);border:1px solid var(--pp-border-2);color:var(--pp-ink)}
html[data-daypart="night"] .bh-btn.secondary{background:transparent;color:#EEF3EE}

/* Haze (day) / dusk (night) band */
.bh-band{position:relative;height:230px;margin-top:44px;overflow:hidden}
.bh-band>div{position:absolute}
.bh-dusk{display:none}
html[data-daypart="night"] .bh-haze{display:none}
html[data-daypart="night"] .bh-dusk{display:block}
.hz-sky{inset:0;background:linear-gradient(180deg,#F6F1E8 0%,#F8E5D5 20%,#F5DBC8 42%,#EFE2D3 60%,#E2E5D7 78%,#F6F1E8 100%)}
.hz-sun{left:58%;top:44%;width:300px;height:170px;margin:-85px 0 0 -150px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,240,222,1),rgba(255,210,172,.55) 45%,rgba(255,210,172,0))}
.hz-river{left:-10%;right:-10%;top:62%;height:30px;filter:blur(7px);background:linear-gradient(180deg,rgba(178,190,170,0),rgba(178,190,170,.6),rgba(178,190,170,0))}
.hz-w{border-radius:50%}
.hz-w1{left:-12%;width:80%;top:48%;height:20px;background:rgba(255,250,243,.75);filter:blur(10px);animation:pb-haze 16s ease-in-out infinite alternate}
.hz-w2{left:30%;width:86%;top:66%;height:26px;background:rgba(255,250,243,.7);filter:blur(12px);animation:pb-haze 20s ease-in-out infinite alternate-reverse}
.hz-w3{left:4%;width:60%;top:34%;height:14px;background:rgba(255,250,243,.55);filter:blur(9px);animation:pb-haze 24s ease-in-out infinite alternate}
.dk-sky{inset:0;background:linear-gradient(180deg,#0B1510 0%,#0E1B15 30%,#15291F 58%,#1D3527 70%,#0A130E 78%,#0B1510 100%)}
.dk-horizon{left:50%;top:68%;width:420px;height:120px;margin:-60px 0 0 -210px;border-radius:50%;background:radial-gradient(closest-side,rgba(120,176,140,.3),rgba(120,176,140,0))}
.dk-moon{right:40px;top:30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(closest-side,rgba(206,220,232,.2),rgba(206,220,232,0))}
.dk-ground{left:-10%;right:-10%;top:72%;bottom:0;background:#08110C;filter:blur(3px)}
.dk-mist{left:-10%;width:90%;top:62%;height:18px;border-radius:50%;background:rgba(168,210,184,.1);filter:blur(10px);animation:pb-haze 20s ease-in-out infinite alternate}
.dk-fade{inset:0;pointer-events:none;background:linear-gradient(180deg,#0B1510 0%,rgba(11,21,16,0) 24%,rgba(11,21,16,0) 76%,#0B1510 100%)}
.bh-ff{display:none;position:absolute;width:3px;height:3px;border-radius:50%;background:#EEF3B0;box-shadow:0 0 9px 3px rgba(238,243,176,.5);pointer-events:none}
html[data-daypart="night"] .bh-ff{display:block}

/* Lowest list */
.bh-list{max-width:620px;margin:0 auto;padding:10px clamp(1rem,4vw,2rem) 8px}
.bh-list h2{font-family:var(--font-breath) !important;font-weight:400 !important;font-size:25px !important;margin:0;color:var(--pp-ink);animation:none !important}
.bh-list-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.bh-help{margin:2px 0 12px;font-size:13px;color:var(--pp-muted)}
.bh-cards{display:flex;flex-direction:column;gap:10px}
.bh-card{position:relative;border-radius:20px;background:var(--pp-surface);border:1px solid var(--pp-border);transition:transform .16s ease}
html[data-daypart="night"] .bh-card{border-color:rgba(168,230,191,.12)}
.bh-card-btn{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;width:100%;padding:16px 16px 14px;background:none;border:none;text-align:left;color:inherit;font:inherit;cursor:pointer;border-radius:20px}
.bh-card-btn:active{transform:scale(.99)}
.bh-store{font-weight:600;font-size:16px;color:var(--pp-ink)}
.bh-store small{font-weight:400;color:var(--pp-muted);font-size:16px}
.bh-prod{font-size:14px;color:var(--pp-body);margin-top:2px}
.bh-pulse{position:absolute;inset:-1px;border-radius:21px;pointer-events:none}
.bh-reveal{overflow:hidden;padding:0 16px}
.bh-reveal-in{padding:0 0 14px}
.bh-mask{overflow:hidden}
.bh-keep{display:block;font-size:21px;color:var(--pp-ink)}
.bh-keep b{font-weight:700}
.bh-line{display:block;font-size:14px;color:var(--pp-body);margin-top:2px}
.bh-acts{display:flex;gap:8px;margin-top:12px}
.bh-act{flex:1;display:inline-flex;align-items:center;justify-content:center;min-height:44px;border-radius:14px;font-size:14px;text-decoration:none;border:1px solid var(--pp-border-2);color:var(--pp-ink);background:transparent}
.bh-act.main{font-weight:600;background:var(--pp-btn);border-color:var(--pp-btn-border);color:var(--pp-btn-fg)}
.bh-all{display:flex;align-items:center;justify-content:center;min-height:52px;margin-top:14px;border-radius:16px;font-weight:600;font-size:15px;text-decoration:none;color:var(--pp-ink);border:1px solid var(--pp-border-2);background:rgba(255,250,243,.6)}
html[data-daypart="night"] .bh-all{background:transparent;color:#EEF3EE}

/* Wash */
.bh-wash{position:fixed;inset:0;pointer-events:none;z-index:60;opacity:0;background:radial-gradient(90% 40% at 50% 72%,rgba(243,195,160,.42),rgba(243,195,160,0) 70%)}
html[data-daypart="night"] .bh-wash{background:radial-gradient(90% 40% at 50% 72%,rgba(238,243,176,.14),rgba(238,243,176,0) 70%)}

/* Motion */
@keyframes pb-inhale{0%{transform:scale(.78)}100%{transform:scale(1.05)}}
@keyframes pb-rest{0%,100%{transform:scale(1.05)}50%{transform:scale(.86)}}
@keyframes pb-breathe{0%,100%{transform:scale(.86)}50%{transform:scale(1.05)}}
@keyframes pb-exhale{0%{transform:scale(1.05)}100%{transform:scale(.86)}}
@keyframes pb-drawfull{0%{stroke-dashoffset:805}100%{stroke-dashoffset:0}}
@keyframes pb-release{0%{transform:scale(1);opacity:.9}100%{transform:scale(1.9);opacity:0}}
@keyframes pb-wash{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
@keyframes pb-land{0%{transform:translateY(110%)}100%{transform:translateY(0)}}
@keyframes pb-ringD{0%{box-shadow:0 0 0 0 rgba(31,77,51,.28)}100%{box-shadow:0 0 0 30px rgba(31,77,51,0)}}
@keyframes pb-ringN{0%{box-shadow:0 0 0 0 rgba(238,243,176,.35)}100%{box-shadow:0 0 0 30px rgba(238,243,176,0)}}
@keyframes pb-haze{0%{transform:translateX(-16px)}100%{transform:translateX(16px)}}
@keyframes pb-fly1{0%,100%{transform:translate(0,0);opacity:.25}25%{transform:translate(12px,-16px);opacity:1}50%{transform:translate(-4px,-30px);opacity:.35}75%{transform:translate(-14px,-12px);opacity:.9}}
@keyframes pb-fly2{0%,100%{transform:translate(0,0);opacity:.9}30%{transform:translate(-16px,10px);opacity:.3}60%{transform:translate(-6px,24px);opacity:1}80%{transform:translate(10px,8px);opacity:.4}}
@keyframes pb-cueFirst{0%,85%{opacity:1}100%{opacity:0}}
@keyframes pb-cueHalf{0%{opacity:0}8%,42%{opacity:1}50%,100%{opacity:0}}

@media (prefers-reduced-motion: no-preference){
  .bh-stage.load .bh-l{animation:pb-inhale 4s ease-in-out both,pb-rest 8s ease-in-out 4s infinite}
  .bh-stage.load .bh-ring circle{animation:pb-drawfull 4s ease-in-out both}
  .bh-stage.exhale .bh-l{animation:pb-exhale 4s cubic-bezier(.3,.6,.3,1) forwards}
  .bh-stage.after .bh-l{animation:pb-breathe 8s ease-in-out infinite}
  .bh-stage.exhale .bh-release{animation:pb-release 4s cubic-bezier(.2,.6,.3,1) forwards}
  .bh-stage.exhale .bh-release.r2{animation:pb-release 4s cubic-bezier(.2,.6,.3,1) .7s both}
  .bh-cue .c0{animation:pb-cueFirst 4s linear both}
  .bh-cue .c1{animation:pb-cueHalf 8s linear 4s infinite}
  .bh-cue .c2{animation:pb-cueHalf 8s linear 8s infinite}
  .bh-wash.on{animation:pb-wash 4s ease-out forwards}
  .bh-card.on .bh-pulse{animation:pb-ringD 4s ease-out forwards}
  html[data-daypart="night"] .bh-card.on .bh-pulse{animation-name:pb-ringN}
  .bh-card.on .land-1{animation:pb-land 1.2s .3s cubic-bezier(.2,.7,.2,1) both}
  .bh-card.on .land-2{animation:pb-land 1.2s .8s cubic-bezier(.2,.7,.2,1) both}
  .bh-card.on .land-3{animation:pb-land 1.2s 1.1s cubic-bezier(.2,.7,.2,1) both}
  .bh-ff.f1{animation:pb-fly1 14.4s ease-in-out infinite}
  .bh-ff.f2{animation:pb-fly2 17.6s ease-in-out -4s infinite}
  .bh-ff.f3{animation:pb-fly1 19.2s ease-in-out -7s infinite}
  .bh-ff.f4{animation:pb-fly2 12.8s ease-in-out -2s infinite}
}
@media (prefers-reduced-motion: reduce){
  .bh-cue .c0,.bh-cue .c2{display:none}
  .bh-cue .c1{opacity:1}
  .hz-w,.dk-mist{animation:none !important}
  .bh-ring circle{stroke-dashoffset:0 !important}
}
`;

export default function BreatheHero({ hero, cards, dealCount, storeCount, location }: Props) {
  const [phase, setPhase] = useState<"load" | "exhale" | "after">("load");
  const [open, setOpen] = useState<string | null>(null);
  const [wash, setWash] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedAt = useRef<number>(0);

  useEffect(() => {
    loadedAt.current = Date.now();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const exhale = useCallback(() => {
    // The page is still inhaling for the first 4s; a tap then just waits.
    const wait = Math.max(0, 4000 - (Date.now() - loadedAt.current));
    const run = () => {
      setPhase("exhale");
      setWash((w) => w + 1);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPhase("after"), 4000);
    };
    if (wait > 0) setTimeout(run, Math.min(wait, 400));
    else run();
  }, []);

  const onCard = (id: string) => {
    if (open === id) {
      setOpen(null);
      return;
    }
    setOpen(id);
    exhale();
  };

  const amt = hero ? amountOf(hero) : null;

  return (
    <section className="bh" aria-labelledby="bh-title">
      <style>{CSS}</style>
      <div className="bh-light" aria-hidden="true" />
      <div className="bh-shaft" aria-hidden="true" />
      <div className="bh-moon" aria-hidden="true" />
      {wash > 0 && <div key={wash} className="bh-wash on" aria-hidden="true" />}

      <div className="bh-wrap">
        <div className="bh-stagecol">
          <div className="bh-chip">{location}</div>
          <div
            className={`bh-stage ${phase}`}
            onClick={hero ? exhale : undefined}
            role={hero ? "button" : undefined}
            tabIndex={hero ? 0 : undefined}
            aria-label={hero && amt ? `Today's longest exhale: ${amt.big} off at ${storeWithCity(hero)}` : undefined}
            onKeyDown={(e) => {
              if (hero && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                exhale();
              }
            }}
          >
            <div className="bh-l bh-peach" aria-hidden="true" />
            <div className="bh-l bh-sage" aria-hidden="true" />
            <div className="bh-l bh-core" aria-hidden="true" />
            <div className="bh-l bh-glow" aria-hidden="true" />
            <svg className="bh-l bh-ring" viewBox="0 0 280 280" aria-hidden="true">
              <circle cx="140" cy="140" r="128" fill="none" strokeWidth="1.2" strokeDasharray="805 805" transform="rotate(-90 140 140)" />
            </svg>
            <div key={`r1-${wash}`} className="bh-release" aria-hidden="true" />
            <div key={`r2-${wash}`} className="bh-release r2" aria-hidden="true" />
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
                  <span className="bh-sub">
                    {productOf(hero)} at {storeWithCity(hero)}
                  </span>
                </>
              ) : (
                <span className="bh-empty">
                  <b>{dealCount ?? "—"}</b>
                  <span className="bh-sub" style={{ display: "block" }}>deals checked this morning</span>
                </span>
              )}
            </div>
          </div>
          <div className="bh-cue" aria-hidden="true">
            <em className="c0">Breathing in</em>
            <em className="c1">Breathe out</em>
            <em className="c2">Breathe in</em>
          </div>
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
              const isOpen = open === id;
              return (
                <div key={id} className={`bh-card ${isOpen ? "on" : ""}`}>
                  <span className="bh-pulse" aria-hidden="true" />
                  <button type="button" className="bh-card-btn" aria-expanded={isOpen} onClick={() => onCard(id)}>
                    <span>
                      <span className="bh-store">
                        {storeName(d)}
                        {d.city && !storeName(d).toLowerCase().includes(d.city.toLowerCase()) ? <small> · {d.city}</small> : null}
                      </span>
                      <span className="bh-prod" style={{ display: "block" }}>{productOf(d)}</span>
                    </span>
                    <span className="pp-save">Save {a.big}</span>
                  </button>
                  {isOpen && (
                    <div className="bh-reveal">
                      <div className="bh-reveal-in">
                        <span className="bh-mask" style={{ display: "block" }}>
                          <span className="bh-keep land-1">
                            You&rsquo;re saving <b>{a.big}</b>.
                          </span>
                        </span>
                        <span className="bh-mask" style={{ display: "block" }}>
                          <span className="bh-line land-2">{EXHALE_LINES[i % EXHALE_LINES.length]}</span>
                        </span>
                        <span className="bh-mask" style={{ display: "block" }}>
                          <span className="bh-acts land-3" style={{ display: "flex" }}>
                            <Link href={storeHref(d)} className="bh-act main">See the deal</Link>
                            <a href={directionsHref(d)} className="bh-act" target="_blank" rel="noopener noreferrer">Directions</a>
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
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
