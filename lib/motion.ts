// lib/motion.ts — the one place PuffPrice motion is timed.
// Spec: "PuffPrice Motion Study" (Claude Design), build notes at pace 1.
// See docs/brand/2026-09-27-motion-system.md.
//
// PACE is the single dial. Every duration on the site multiplies by it:
//   • CSS reads --pp-pace (set on <html> from this constant in the root
//     layout; ?pace=1.5 overrides it for review sessions).
//   • JS timers read pace() below, which reads the same custom property.
// Slower = bigger number. 1 is the approved feel.
//
// Hard rules (not negotiable, not per-page):
//   • Prices, savings figures and counts render at frame 0 and never fade,
//     scale, blur or move. Animate the surface around them, not them.
//   • Only transform and opacity animate. No animated blur (use radial
//     gradients), no scroll-jacking, parallax, 3D or video.
//   • prefers-reduced-motion = a fully still page.
//   • No sound anywhere, ever.

export const PP_PACE = 1;

/** Build-note timings at pace 1, in milliseconds. */
export const MOTION = {
  inhale: 2000, // orb .86 → 1.05 on load
  release: 2600, // orb 1.05 → .86 when a deal is tapped; the plume rides on it
  breath: 8000, // resting breath cycle after the inhale
  ring: 1200, // puff ring (tap feedback)
  settle: 700, // deal cards settling in
  settleStagger: 120,
  open: 1400, // a card opening in place (cards below ease down)
  loadingPuff: 5600, // one loading puff incl. ~2s rest
  hazeA: 48000, // haze layer A drift period
  hazeB: 61000, // haze layer B drift period, opposite direction
  ambientBudget: 30000, // haze + fireflies settle and stop after this much visible time
} as const;

export const EASE = {
  inhale: "cubic-bezier(.4,0,.2,1)",
  release: "cubic-bezier(.16,.84,.3,1)",
  settle: "cubic-bezier(.22,.61,.36,1)", // no overshoot, no bounce
  open: "cubic-bezier(.16,.84,.3,1)",
} as const;

/** Current pace: the --pp-pace custom property on <html>, else PP_PACE. */
export function pace(): number {
  if (typeof window === "undefined") return PP_PACE;
  try {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pp-pace"));
    return Number.isFinite(v) && v > 0 ? v : PP_PACE;
  } catch {
    return PP_PACE;
  }
}

/** A build-note duration scaled by the current pace. */
export function dur(ms: number): number {
  return ms * pace();
}

export function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Inline script for <head>: honours ?pace=N (0.25–4) before first paint. */
export const PACE_SCRIPT = `(function(){try{var p=parseFloat(new URLSearchParams(location.search).get('pace'));if(p>=0.25&&p<=4)document.documentElement.style.setProperty('--pp-pace',String(p));}catch(e){}})();`;

/**
 * How big an exhale a deal earns, 0 (a small puff) … 1 (a long, full
 * exhale). Dollars saved when we know them, otherwise the percent.
 * Clamped: under $5 / 10% is the smallest puff, $40+ / 45%+ the fullest.
 * Only the plume and ring use this. The number never moves.
 */
export function exhaleSize(o: { dollars?: number | null; percent?: number | null }): number {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  if (o.dollars != null && Number.isFinite(o.dollars) && o.dollars > 0) return clamp((o.dollars - 5) / 35);
  if (o.percent != null && Number.isFinite(o.percent) && o.percent > 0) return clamp((o.percent - 10) / 35);
  return 0.5;
}

/** Plume + ring variables for a given exhale size (see .pp-plume in globals.css). */
export function exhaleVars(size: number): Record<string, string> {
  const s = Math.max(0, Math.min(1, size));
  return {
    "--pp-x-len": (0.6 + 0.4 * s).toFixed(3), // duration multiplier: short puff → full 2.6s
    "--pp-x-rise": (0.45 + 0.55 * s).toFixed(3), // how far it climbs: ~130px → 270–350px
    "--pp-x-spread": (0.55 + 0.45 * s).toFixed(3), // how wide it opens
  };
}

/** Event other components fire to release a puff ring + plume at an element. */
export const EXHALE_EVENT = "pp:exhale";
export type ExhaleDetail = { el: Element; size: number; wash?: boolean };

export function releaseExhale(el: Element | null, size = 0.5, wash = true) {
  if (!el || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ExhaleDetail>(EXHALE_EVENT, { detail: { el, size, wash } }));
}
