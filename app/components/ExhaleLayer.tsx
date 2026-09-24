"use client";

// ExhaleLayer — the exhale moment on every deal card, not just the homepage.
// Mounted once in the root layout (which stays put across page changes):
//  • When a Save pill first comes into view, it releases one soft ring —
//    the same "breath out" the homepage orb makes.
//  • Tapping a deal card (any link or button that holds a Save pill, or any
//    element marked data-exhale) washes the screen in warm light for 4s.
//    The layout survives client navigation, so the wash keeps playing while
//    the store page arrives underneath it.
// Numbers never move. Everything here is off under reduce-motion (CSS).

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ExhaleLayer() {
  const pathname = usePathname();
  const [wash, setWash] = useState(0);

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
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    const reset = setTimeout(() => (n = 0), 1200);
    return () => {
      io.disconnect();
      mo.disconnect();
      clearTimeout(reset);
    };
  }, [pathname]);

  // Warm wash when a deal is tapped.
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
      const t = ev.target as Element | null;
      if (!t || t.closest(".bh")) return; // the homepage hero runs its own exhale
      const host = t.closest("[data-exhale]") || t.closest("a, button");
      if (!host) return;
      const pill = host.hasAttribute("data-exhale") ? host.querySelector(".pp-save") || host : host.querySelector(".pp-save");
      if (!pill) return;
      pill.classList.remove("pp-tap");
      void (pill as HTMLElement).offsetWidth;
      pill.classList.add("pp-tap");
      setWash((w) => w + 1);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return wash > 0 ? <div key={wash} className="pp-wash on" aria-hidden="true" /> : null;
}
