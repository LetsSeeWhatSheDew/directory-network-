// lib/social/laws.ts — "Law you should know" cards.
// Static text taken from the existing law pages (/cannabis/illinois/laws,
// /illinois-hemp-law, /illinois-cannabis-delivery, /drive-thru), each with the
// outside source those pages cite. When one of those pages changes, change
// the matching fact here (and its `checked` date) in the same commit.

import type { LawFact } from "./types";
import { ctDay, ctDayOfYear, shortDay } from "./time";

export const LAW_FACTS: LawFact[] = [
  {
    id: "possession-limits",
    date: "2026-06-12",
    figure: "60 g",
    figureNote: "of flower, for Illinois residents",
    headline: "Possession limits doubled in June.",
    body: "Since June 12, 2026 (SB 3222), Illinois residents may possess up to 60 grams of cannabis flower, 1,000 milligrams of THC in infused products and 10 grams of concentrate. Non-residents are limited to half that.",
    sourceName: "Fox Rothschild",
    sourceUrl: "https://www.foxrothschild.com/publications/illinois-overhauls-its-cannabis-and-hemp-regulations",
    page: "/cannabis/illinois/laws",
    checked: "2026-09-23",
    tags: ["#IllinoisLaw"],
  },
  {
    id: "drive-thru-legal",
    date: "2026-06-12",
    figure: "June 12",
    figureNote: "2026: drive-thrus became legal",
    headline: "Drive-thrus are legal, with the state's sign-off.",
    body: "SB 3222, signed June 12, 2026, lets dispensaries serve customers through a drive-through once IDFPR reviews and approves the store's setup. You still show your ID at the window.",
    sourceName: "Marijuana Moment",
    sourceUrl: "https://www.marijuanamoment.net/illinois-officials-update-marijuana-dispensaries-on-increased-possession-limits-and-ability-to-add-drive-thru-windows/",
    page: "/drive-thru",
    checked: "2026-09-23",
    tags: ["#IllinoisLaw"],
  },
  {
    id: "city-ordinance",
    date: "2026-09-13",
    figure: "Step 1",
    figureNote: "your city council",
    headline: "A drive-thru starts at city hall.",
    body: "Most local cannabis rules were written in 2019–20 and don't allow a pickup window. Dixon's city council amended its ordinance on Sept 13, 2026 before its store could apply to the state for one.",
    sourceName: "Shaw Local",
    sourceUrl: "https://www.shawlocal.com/sauk-valley/2026/09/13/dixon-council-clears-way-for-cannabis-drive-thru/",
    page: "/drive-thru",
    checked: "2026-09-23",
    tags: ["#CityCouncil"],
  },
  {
    id: "hemp-cap",
    date: "2026-11-12",
    figure: "0.4 mg",
    figureNote: "total THC per container, the new hemp cap",
    headline: "Delta-8 leaves gas stations on Nov 12.",
    body: "From Nov 12, 2026, Illinois' Hemp Act caps finished hemp products at 0.4 mg of total THC per container, and delta-8, delta-10, HHC, THCP and THC-O all count toward it.",
    sourceName: "Fox Rothschild",
    sourceUrl: "https://www.foxrothschild.com/publications/illinois-overhauls-its-cannabis-and-hemp-regulations",
    page: "/illinois-hemp-law",
    checked: "2026-09-23",
    tags: ["#IllinoisLaw"],
  },
  {
    id: "hemp-21",
    date: "2026-06-12",
    figure: "21+",
    figureNote: "for hemp THC products too",
    headline: "Hemp THC products are 21 and over now.",
    body: "SB 3222 moved intoxicating hemp into the regulated system. The 21-and-over rule took effect immediately when it was signed in June 2026.",
    sourceName: "Chicago Sun-Times",
    sourceUrl: "https://chicago.suntimes.com/politics/2026/06/15/illinois-hemp-delta-8-cannabis-regulation-bill",
    page: "/illinois-hemp-law",
    checked: "2026-09-23",
    tags: ["#IllinoisLaw"],
  },
  {
    id: "no-delivery",
    date: "2026-06-01",
    figure: "Not yet",
    figureNote: "delivery is still not legal in Illinois",
    headline: "Cannabis delivery still isn't legal here.",
    body: "HB2557, the Cannabis Delivery License Act, never left the House Rules Committee and died June 1, 2026. SB 3222 added drive-thru and curbside pickup, but not delivery.",
    sourceName: "BillTrack50",
    sourceUrl: "https://www.billtrack50.com/billdetail/1816456",
    page: "/illinois-cannabis-delivery",
    checked: "2026-09-23",
    tags: ["#IllinoisLaw"],
  },
];

/** The hemp card reads in the future tense until Nov 12, then in the past. */
function withTense(f: LawFact, today: string): LawFact {
  if (f.id !== "hemp-cap" || today < f.date) return f;
  return {
    ...f,
    headline: "Delta-8 left gas stations on Nov 12.",
    body: f.body.replace(/^From Nov 12, 2026,/, "Since Nov 12, 2026,"),
  };
}

/** A fact by id, or the day's rotation (one per day, cycling through the list). */
export function lawFactFor(id: string | null | undefined, now: Date = new Date()): LawFact {
  const today = ctDay(now);
  const byId = id ? LAW_FACTS.find((f) => f.id === id) : undefined;
  const f = byId || LAW_FACTS[ctDayOfYear(now) % LAW_FACTS.length];
  return withTense(f, today);
}

export function lawDateLabel(f: LawFact): string {
  return shortDay(f.date);
}
