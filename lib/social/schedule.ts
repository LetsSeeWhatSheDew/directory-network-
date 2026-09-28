// lib/social/schedule.ts — which template to post which day (mirrors
// marketing/social/README.md), and how Meta-safe each one is.

import type { SocialTemplate } from "./types";

export const WEEK: { day: string; template: SocialTemplate; why: string }[] = [
  { day: "Sunday", template: "law", why: "A quiet, useful civic fact to start the week." },
  { day: "Monday", template: "index", why: "Last week's market in one picture." },
  { day: "Tuesday", template: "law", why: "A different fact (the card rotates daily)." },
  { day: "Wednesday", template: "city", why: "Midweek is when stores run their day-of-week specials." },
  { day: "Thursday", template: "cheapest", why: "Shelf prices, city by city, ahead of the weekend." },
  { day: "Friday", template: "saving", why: "The single biggest everyday saving today." },
  { day: "Saturday", template: "drive-thru", why: "The civic story: where drive-thrus stand." },
];

/** Meta (Instagram/Facebook) fit. "civic" posts stay clear of Meta's
 *  restricted-goods rules; "price" posts name a store and a discount, which
 *  Meta can read as promoting a sale. See marketing/social/README.md. */
export const META_FIT: Record<SocialTemplate, "civic" | "price"> = {
  saving: "price",
  city: "price",
  cheapest: "price",
  index: "civic",
  law: "civic",
  "drive-thru": "civic",
};
