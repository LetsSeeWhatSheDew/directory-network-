// /share/loop — the orb's exhale as a seamless 4.6s loop, for social video.
// Orb and wordmark only: no deals, no prices, nothing about consuming.
// One cycle = the release (1.05 → .86, 2.6s, the plume rising out of it)
// then the inhale back (.86 → 1.05, 2s), so the last frame meets the first.
// tests/motion/record-loop.mjs steps through it frame by frame and encodes
// marketing/social/*.mp4. ?daypart=night for the night version. noindex.

import type { Metadata } from "next";
import Logo from "../../components/Logo";

export const metadata: Metadata = {
  title: "Exhale loop",
  robots: { index: false, follow: false },
};

const CSS = `
body::after{display:none}
.lp{position:fixed;inset:0;overflow:hidden;background:linear-gradient(180deg,#FBE9DC 0%,#F8EDE2 38%,#F6F1E8 70%)}
html[data-daypart="night"] .lp{background:radial-gradient(900px 760px at 88% 0,rgba(176,204,228,.11),rgba(176,204,228,0) 70%),#0B1510}
.lp-light{position:absolute;left:-18%;top:-10%;width:90%;height:48%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,224,192,.8),rgba(255,224,192,0))}
html[data-daypart="night"] .lp-light{display:none}
.lp-stage{position:absolute;left:50%;top:46%;width:380px;height:380px;margin:-190px 0 0 -190px;display:grid;place-items:center;zoom:2.35}
@media (max-width:760px){.lp-stage{zoom:1}}
.lp-stage>*{grid-area:1/1}
.lp-l{border-radius:50%;transform:scale(1.05)}
.lp-peach{width:320px;height:320px;background:radial-gradient(closest-side,rgba(243,195,160,1) 22%,rgba(243,195,160,.5) 56%,rgba(243,195,160,0));opacity:.75;translate:-44px -34px}
.lp-sage{width:320px;height:320px;background:radial-gradient(closest-side,rgba(188,208,179,1) 22%,rgba(188,208,179,.5) 56%,rgba(188,208,179,0));opacity:.85;translate:44px 34px}
.lp-core{width:268px;height:268px;background:radial-gradient(circle,#FFFAF3 0%,#FBF1E6 48%,rgba(226,236,218,.9) 74%,rgba(226,236,218,0) 100%)}
.lp-glow{display:none;width:340px;height:340px;background:radial-gradient(circle,rgba(72,150,104,.45) 0%,rgba(40,94,64,.22) 45%,rgba(11,21,16,0) 72%)}
html[data-daypart="night"] .lp-peach,html[data-daypart="night"] .lp-sage,html[data-daypart="night"] .lp-core{display:none}
html[data-daypart="night"] .lp-glow{display:block}
.lp-ring{width:300px;height:300px;overflow:visible}
.lp-ring circle{stroke:#1F4D33;stroke-opacity:.3}
html[data-daypart="night"] .lp-ring circle{stroke:#A8E6BF;stroke-opacity:.28}
.lp-rel{width:268px;height:268px;border-radius:50%;border:1.5px solid rgba(31,77,51,.35);opacity:0}
.lp-rel.r2{border-width:1px;border-color:rgba(31,77,51,.25)}
html[data-daypart="night"] .lp-rel{border-color:rgba(168,230,191,.4)}
html[data-daypart="night"] .lp-rel.r2{border-color:rgba(238,243,176,.3)}
.lp-plume{position:relative;width:0;height:0;mix-blend-mode:var(--pp-fx-blend)}
.lp-plume i{position:absolute;border-radius:50%;opacity:0;left:calc(var(--w) / -2);top:calc(var(--w) / -2);width:var(--w);height:var(--w);
  background:radial-gradient(closest-side,var(--pp-plume-core),var(--pp-plume-mid) 48%,rgba(0,0,0,0))}
.lp-plume .b1{--w:170px;--rise:270px;--sx:1.9;--sy:1.5;--dx:-6px;--o:.9;animation-delay:0s}
.lp-plume .b2{--w:210px;--rise:300px;--sx:2.2;--sy:1.6;--dx:10px;--o:.75;animation-delay:.15s}
.lp-plume .b3{--w:250px;--rise:350px;--sx:2.5;--sy:1.7;--dx:-14px;--o:.6;animation-delay:.32s}
.lp-ff{display:none;position:absolute;width:3px;height:3px;border-radius:50%;background:#EEF3B0;box-shadow:0 0 9px 3px rgba(238,243,176,.5);opacity:.4}
html[data-daypart="night"] .lp-ff{display:block}
.lp-mark{position:absolute;left:0;right:0;bottom:13%;display:flex;justify-content:center}

/* One 4.6s cycle: release 2.6s (56.52%) + inhale 2s. */
@keyframes lp-orb{0%{transform:scale(1.05);animation-timing-function:cubic-bezier(.16,.84,.3,1)}56.52%{transform:scale(.86);animation-timing-function:cubic-bezier(.4,0,.2,1)}100%{transform:scale(1.05)}}
@keyframes lp-rel{0%{transform:scale(1);opacity:0}4%{opacity:.9;animation-timing-function:cubic-bezier(.16,.84,.3,1)}56.52%{transform:scale(1.9);opacity:0}100%{transform:scale(1.9);opacity:0}}
@keyframes lp-plume{
  0%{opacity:0;transform:translate(0,0) scale(.5);animation-timing-function:cubic-bezier(.16,.84,.3,1)}
  6.8%{opacity:var(--o)}
  27%{opacity:calc(var(--o) * .5)}
  56.52%{opacity:0;transform:translate(var(--dx),calc(var(--rise) * -1)) scale(var(--sx),var(--sy))}
  100%{opacity:0;transform:translate(var(--dx),calc(var(--rise) * -1)) scale(var(--sx),var(--sy))}
}
@keyframes lp-ff{0%,100%{transform:translate(0,0)}25%{transform:translate(8px,-10px)}50%{transform:translate(-3px,-18px)}75%{transform:translate(-9px,-7px)}}
@keyframes lp-pulse{0%,100%{opacity:.35}50%{opacity:1}}
.lp-orb{animation:lp-orb 4.6s linear infinite}
.lp-rel{animation:lp-rel 4.6s linear infinite}
.lp-rel.r2{animation-delay:.7s}
.lp-plume i{animation:lp-plume 4.6s linear infinite}
.lp-ff{animation:lp-ff 4.6s ease-in-out infinite,lp-pulse 2.3s ease-in-out infinite}
.lp-ff.f2{animation-delay:-1.9s,-.8s}
.lp-ff.f3{animation-delay:-3.1s,-1.7s}
.lp-ff.f4{animation-delay:-.6s,-1.2s}
`;

export default function ExhaleLoopPage() {
  return (
    <main className="lp" aria-label="PuffPrice exhale loop">
      <style>{CSS}</style>
      <div className="lp-light" aria-hidden="true" />
      <div className="lp-stage" aria-hidden="true">
        <div className="lp-l lp-orb lp-peach" />
        <div className="lp-l lp-orb lp-sage" />
        <div className="lp-l lp-orb lp-core" />
        <div className="lp-l lp-orb lp-glow" />
        <svg className="lp-l lp-orb lp-ring" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r="128" fill="none" strokeWidth="1.2" />
        </svg>
        <div className="lp-rel" />
        <div className="lp-rel r2" />
        <div className="lp-plume">
          <i className="b3" />
          <i className="b2" />
          <i className="b1" />
        </div>
        <span className="lp-ff" style={{ left: "10%", top: "20%", width: 4, height: 4 }} />
        <span className="lp-ff f2" style={{ left: "88%", top: "60%" }} />
        <span className="lp-ff f3" style={{ left: "8%", top: "78%" }} />
        <span className="lp-ff f4" style={{ left: "82%", top: "12%", width: 2, height: 2 }} />
      </div>
      <div className="lp-mark">
        <Logo size={120} />
      </div>
    </main>
  );
}
