"use client";

// ExhaleCard — one deal card, used everywhere deals are listed (home, city
// pages, /deals/*, store pages). Tapping it never scrolls or jumps the page:
// the card opens in place to "You're saving $X." with Get directions, the
// cards below ease down out from under it (FLIP, transform only), and the
// puff ring + plume rise out of the card (ExhaleLayer). Everything in the
// opened card is on screen and tappable the instant it opens.
//
// Numbers never move: the Save pill and prices sit outside .pp-dc-words, so
// the settle-in (surface + words rise a few px and fade) never touches them.
// Motion timings come from lib/motion.ts (paced). Reduced motion: instant.

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { track } from "../../lib/track";
import { EASE, MOTION, dur, exhaleSize, reducedMotion, releaseExhale } from "../../lib/motion";
import { otdFor, usd } from "../../lib/otd";

export type ExhaleCardDeal = {
  id: string;
  slug?: string | null;
  city?: string | null;
};

type Props = {
  deal: ExhaleCardDeal;
  /** Where the card lives, for tap analytics ("home", "city", "deals", "store"). */
  from: string;
  /** Saving as shown on the pill: "$40", "25%", "up to 30%". Null = no figure. */
  saving: string | null;
  /** For the size of the exhale: dollars when known, else percent. */
  dollars?: number | null;
  percent?: number | null;
  /** Card face: the words (settle in) and the aside (Save pill / prices — static). */
  words: React.ReactNode;
  aside?: React.ReactNode;
  directionsHref: string;
  seeHref?: string | null;
  seeLabel?: string;
  line?: string;
  /** The deal as the out-the-door logic reads it (lib/otd.ts, same as /out-the-door).
   *  When it states a real price, the opened card shows the estimated total with tax. */
  otdDeal?: { deal_title?: string | null; title?: string | null; category?: string | null; city?: string | null; discount_unit?: string | null; discount_type?: string | null } | null;
  /** Always-visible content under the face (may hold links; store pages). */
  after?: React.ReactNode;
  /** Extra things in the opened card (website link, details, report). */
  children?: React.ReactNode;
  index?: number;
  className?: string;
  faceClassName?: string;
  /** Called when the card opens (the homepage orb breathes out with it). */
  onOpen?: () => void;
};

// Shared by every card on the page: the last tap owns the anchoring switch.
let anchorTimer: ReturnType<typeof setTimeout> | undefined;

/** Everything after this card in its list, plus what follows the list. */
function followersOf(el: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  const limit = window.innerHeight * 2;
  const push = (n: Element | null) => {
    for (; n; n = n.nextElementSibling) {
      if (!(n instanceof HTMLElement)) continue;
      if (n.getBoundingClientRect().top > limit) return;
      out.push(n);
    }
  };
  push(el.nextElementSibling);
  push(el.parentElement ? el.parentElement.nextElementSibling : null);
  return out;
}

export default function ExhaleCard({
  deal,
  from,
  saving,
  dollars,
  percent,
  words,
  aside,
  directionsHref,
  seeHref,
  seeLabel = "See the deal",
  line = "Go on, let your shoulders drop.",
  otdDeal = null,
  after,
  children,
  index = 0,
  className = "",
  faceClassName = "",
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const flip = useRef<{ els: HTMLElement[]; tops: number[] } | null>(null);
  const panelId = `pp-dc-${deal.id}`;

  const size = exhaleSize({ dollars, percent });
  // Only deals that state a shelf price get a number; percent deals never get a guess.
  const otd = otdDeal ? otdFor(otdDeal, otdDeal.city || deal.city) : null;

  const toggle = useCallback(
    (next: boolean) => {
      const el = ref.current;
      if (!el) return;
      // Scroll anchoring would nudge the page to keep a card below "still";
      // switch it off for the move so scrollY never changes on a tap.
      const root = document.documentElement;
      root.style.overflowAnchor = "none";
      clearTimeout(anchorTimer);
      anchorTimer = setTimeout(() => {
        root.style.overflowAnchor = "";
      }, dur(MOTION.open) + 100);
      if (!reducedMotion()) {
        const els = followersOf(el);
        flip.current = { els, tops: els.map((n) => n.getBoundingClientRect().top) };
      }
      setOpen(next);
    },
    []
  );

  // FLIP: after the card grows (or shrinks), ease everything below from where
  // it was to where it now is. Transform only; the page never scrolls.
  useLayoutEffect(() => {
    const f = flip.current;
    flip.current = null;
    if (!f) return;
    f.els.forEach((n, i) => {
      const dy = f.tops[i] - n.getBoundingClientRect().top;
      if (!dy) return;
      n.animate([{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], {
        duration: dur(MOTION.open),
        easing: EASE.open,
      });
    });
  }, [open]);

  const onFace = () => {
    if (open) {
      toggle(false);
      return;
    }
    track("deal_tap", { slug: deal.slug || null, dealId: deal.id, city: deal.city || null, meta: { from } });
    toggle(true);
    onOpen?.();
    releaseExhale(ref.current, size, true);
  };

  // Arrival from a watch-alert / price-drop email (?exhale=<deal id>): this
  // deal opens and plays its exhale once the card has settled.
  useEffect(() => {
    let id: string | null = null;
    try {
      id = new URLSearchParams(window.location.search).get("exhale");
    } catch {}
    if (!id || id !== deal.id) return;
    const t = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: "center", behavior: "auto" });
      setOpen(true);
      onOpen?.();
      releaseExhale(el, size, true);
    }, dur(MOTION.settle));
    return () => clearTimeout(t);
    // Run once on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={`pp-dc ${open ? "is-open" : ""} ${className}`}
      style={{ "--pp-i": index } as React.CSSProperties}
      data-deal-id={deal.id}
    >
      <span className="pp-dc-surface" aria-hidden="true" />
      <button type="button" className={`pp-dc-face ${faceClassName}`} aria-expanded={open} aria-controls={panelId} onClick={onFace}>
        <span className="pp-dc-words">{words}</span>
        {aside}
      </button>
      {after}
      <div id={panelId} className="pp-dc-panel" hidden={!open}>
        {open && (
          <>
            {saving ? (
              <p className="pp-dc-keep">
                You&rsquo;re saving <b>{saving}</b>.
              </p>
            ) : (
              <p className="pp-dc-keep">Here&rsquo;s the way there.</p>
            )}
            {otd && (
              // Static like every number: outside the fading .pp-dc-line.
              <p className="pp-dc-otd">
                Estimated out the door: <b>{usd(otd.total)}</b>
                {otd.each ? <> · {usd(otd.each)} each</> : null}
                <small> tax included, {otd.city} rates. The register has the final word.</small>
              </p>
            )}
            <p className="pp-dc-line">{line}</p>
            <div className="pp-dc-acts">
              <a
                href={directionsHref}
                className="pp-dc-act main"
                target="_blank"
                rel="noopener noreferrer"
                data-track="directions_tap"
                data-track-slug={deal.slug || undefined}
                data-track-deal={deal.id}
                data-track-city={deal.city || undefined}
                data-track-from={from}
              >
                Get directions
              </a>
              {seeHref && (
                <Link href={seeHref} className="pp-dc-act">
                  {seeLabel}
                </Link>
              )}
            </div>
            {children && <div className="pp-dc-more">{children}</div>}
          </>
        )}
      </div>
    </div>
  );
}
