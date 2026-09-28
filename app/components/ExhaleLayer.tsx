"use client";

// ExhaleLayer — the exhale moment on every deal card, not just the homepage.
// Mounted once in the root layout (which stays put across page changes):
//  • When a Save pill first comes into view, it releases one soft ring —
//    the same "breath out" the homepage orb makes.
//  • The puff: a ring (tap feedback) and a three-blob plume rise out of a
//    tapped card and melt into the haze. Cards fire it with releaseExhale()
//    (lib/motion.ts); older link cards holding a Save pill get it from the
//    click listener below. The plume's size follows the deal (exhaleSize).
//  • A warm wash carries across the page change when a tap navigates.
//  • Haze thinning on scroll for browsers without CSS scroll-driven animations.
//  • The ambient clock: haze drift and fireflies settle and stop after ~30s
//    of visible time (html.pp-still), and pause while the tab is hidden
//    (html.pp-away). Background motion never runs forever.
// Numbers never move. Everything here is off under reduce-motion.

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { EXHALE_EVENT, MOTION, dur, exhaleSize, exhaleVars, reducedMotion, type ExhaleDetail } from "../../lib/motion";

type Puff = { id: number; x: number; y: number; size: number };

export default function ExhaleLayer() {
  const pathname = usePathname();
  const [wash, setWash] = useState(0);
  const [puffs, setPuffs] = useState<Puff[]>([]);
  const docRef = useRef<HTMLDivElement | null>(null);
  const seq = useRef(0);

  // Ring release on first sight, re-armed on every page.
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const seen = new WeakSet<Element>();
    let n = 0;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || seen.has(e.target)) continue;
          seen.add(e.target);
          const el = e.target as HTMLElement;
          el.style.setProperty("--pp-in-delay", `${Math.min(n++, 5) * 140}ms`);
          el.classList.add("pp-in");
          io.unobserve(el);
        }
      },
      { threshold: 0.9 }
    );
    const scan = () => document.querySelectorAll(".pp-save:not(.pp-in)").forEach((el) => io.observe(el));
    scan();
    // Coalesce DOM changes (the map re-renders constantly) into one scan per frame.
    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    const reset = setTimeout(() => (n = 0), 1200);
    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(reset);
    };
  }, [pathname]);

  // Ambient clock: ~30s of visible time per page, then the haze and fireflies rest.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("pp-still");
    const budget = dur(MOTION.ambientBudget);
    let used = 0;
    let since = document.hidden ? 0 : performance.now();
    let t: ReturnType<typeof setTimeout> | null = null;
    const arm = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => root.classList.add("pp-still"), Math.max(0, budget - used));
    };
    const onVis = () => {
      if (document.hidden) {
        if (since) used += performance.now() - since;
        since = 0;
        if (t) clearTimeout(t);
        root.classList.add("pp-away");
      } else {
        since = performance.now();
        root.classList.remove("pp-away");
        if (!root.classList.contains("pp-still")) arm();
      }
    };
    if (document.hidden) root.classList.add("pp-away");
    else arm();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (t) clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pathname]);

  // Haze thins as you scroll. CSS scroll-driven animations do it where supported
  // (globals.css, .pp-band / .bh-band); Safari and older browsers get this
  // fallback: one passive scroll listener, one rAF write per frame, opacity
  // only. Follows the scroll, never drives it. Same curve: 1 → .5 over 90vh.
  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: scroll()")) return;
    if (reducedMotion()) return;
    const bands = Array.from(document.querySelectorAll<HTMLElement>(".pp-band, .bh-band"));
    if (!bands.length) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const t = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
      const o = String(1 - 0.5 * t);
      for (const b of bands) b.style.opacity = o;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const b of bands) b.style.opacity = "";
    };
  }, [pathname]);

  const release = useCallback((el: Element, size: number, withWash: boolean) => {
    if (reducedMotion()) return;
    const anchor = (el.closest(".pp-dc")?.querySelector(".pp-save") as Element | null) || el;
    const r = anchor.getBoundingClientRect();
    const id = ++seq.current;
    const puff: Puff = { id, x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY, size };
    setPuffs((p) => [...p.slice(-3), puff]);
    if (withWash) setWash((w) => w + 1);
    const life = dur(MOTION.release) * (0.6 + 0.4 * size) + dur(400) + 400;
    setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== id)), life);
  }, []);

  // Cards announce their exhale.
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<ExhaleDetail>).detail;
      if (d?.el) release(d.el, d.size, d.wash !== false);
    };
    window.addEventListener(EXHALE_EVENT, on);
    return () => window.removeEventListener(EXHALE_EVENT, on);
  }, [release]);

  // Older link cards (a link or button holding a Save pill, or data-exhale):
  // the puff rises from the pill and the wash carries across the page change.
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
      const t = ev.target as Element | null;
      if (!t || t.closest(".bh, .pp-dc")) return; // those run their own exhale
      const host = t.closest("[data-exhale]") || t.closest("a, button");
      if (!host) return;
      const pill = host.hasAttribute("data-exhale") ? host.querySelector(".pp-save") || host : host.querySelector(".pp-save");
      if (!pill) return;
      const v = parseFloat(((pill.textContent || "").match(/\d+(\.\d+)?/) || ["0"])[0]);
      const isPct = /%/.test(pill.textContent || "");
      release(pill, exhaleSize(isPct ? { percent: v } : { dollars: v }), true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [release]);

  // Keep the plume attached to the page while it scrolls.
  useEffect(() => {
    if (!puffs.length) return;
    let raf = 0;
    const sync = () => {
      raf = 0;
      if (docRef.current) docRef.current.style.transform = `translate(${-window.scrollX}px, ${-window.scrollY}px)`;
    };
    sync();
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [puffs.length]);

  return (
    <>
      {wash > 0 && <div key={wash} className="pp-wash on" aria-hidden="true" />}
      {puffs.length > 0 && (
        <div className="pp-fx" aria-hidden="true">
          <div className="pp-fx-doc" ref={docRef}>
            {puffs.map((p) => (
              <div key={p.id} className="pp-puff" style={{ left: p.x, top: p.y, ...exhaleVars(p.size) } as React.CSSProperties}>
                <span className="pp-plume-b b3" />
                <span className="pp-plume-b b2" />
                <span className="pp-plume-b b1" />
                <span className="pp-puff-ring" />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
