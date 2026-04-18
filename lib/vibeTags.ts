// lib/vibeTags.ts
// Derive soft orientation tags for a dispensary from data we already have.
// Rule of the house: if the data doesn't support a tag, we return no tag.
// We never fake it, guess, or invent signals the user might rely on.

export type VibeTag =
  | "quick-visit"
  | "beginner-friendly"
  | "deal-heavy"
  | "local-favorite"
  | "chain-reliable"
  | "open-late"
  | "medical-rec";

export const VIBE_TAG_LABELS: Record<VibeTag, string> = {
  "quick-visit": "Quick visit",
  "beginner-friendly": "Beginner friendly",
  "deal-heavy": "Active deals",
  "local-favorite": "Local independent",
  "chain-reliable": "Established chain",
  "open-late": "Open late",
  "medical-rec": "Medical & Rec",
};

// Known IL chains to detect. Lowercased substring matches against the
// dispensary name. If a chain is missed here it just gets flagged as a
// local independent, which is the safer wrong answer.
const KNOWN_CHAINS = [
  "zen leaf",
  "sunnyside",
  "ascend",
  "pharmacann",
  "revolution",
  "dispensary 33",
  "native roots",
  "nuera",
  "verilife",
  "curaleaf",
  "cresco",
  "rise dispensary",
  "rise illinois",
  "rise mundelein",
  "rise naperville",
  "hana",
  "good news",
];

type ListingLike = {
  name?: string | null;
  short_description?: string | null;
  long_description?: string | null;
};

type HoursRow = {
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean | null;
};

function isChain(name: string): boolean {
  const n = name.toLowerCase();
  return KNOWN_CHAINS.some((c) => n.includes(c));
}

function closesAfter9pm(hours: HoursRow[] | null | undefined): boolean {
  if (!hours || hours.length === 0) return false;
  return hours.some((h) => {
    if (h.is_closed || !h.closes_at) return false;
    const [hh] = h.closes_at.split(":").map(Number);
    if (!Number.isFinite(hh)) return false;
    // closes_at is stored as 24h "HH:MM"; treat 21:00 and later as late
    return hh >= 21;
  });
}

export function deriveVibeTags(
  listing: ListingLike,
  dealCount: number,
  hours?: HoursRow[] | null
): VibeTag[] {
  const tags: VibeTag[] = [];
  const name = (listing.name || "").trim();
  const desc = `${listing.short_description ?? ""} ${listing.long_description ?? ""}`
    .toLowerCase()
    .trim();

  if (dealCount >= 3) tags.push("deal-heavy");

  if (name) {
    if (isChain(name)) tags.push("chain-reliable");
    else tags.push("local-favorite");
  }

  if (closesAfter9pm(hours)) tags.push("open-late");

  if (desc && /\b(medical|medicinal)\b/.test(desc)) {
    tags.push("medical-rec");
  }

  if (desc && /(education|guide|help you|first[- ]time|beginner)/.test(desc)) {
    tags.push("beginner-friendly");
  }

  return tags;
}
