// lib/social/types.ts — the data each social template draws from.
// Every shape carries `postable`: false means the data couldn't be read (or
// there's nothing true to say), and the /social page shows a note instead of
// a caption. Numbers only ever come from live rows; nothing here is a default.

export type SocialTemplate = "saving" | "city" | "index" | "cheapest" | "law" | "drive-thru";
export type SocialSize = "feed" | "story";
export type SocialTheme = "day" | "night";

export const SOCIAL_TEMPLATES: SocialTemplate[] = ["saving", "city", "index", "cheapest", "law", "drive-thru"];

export const SOCIAL_SIZES: Record<SocialSize, [number, number]> = {
  feed: [1080, 1350],
  story: [1080, 1920],
};

export const TEMPLATE_LABEL: Record<SocialTemplate, string> = {
  saving: "Today's biggest saving",
  city: "City roundup",
  index: "Deal Index, weekly",
  cheapest: "Cheapest eighth by city",
  law: "Law you should know",
  "drive-thru": "Drive-thru tracker",
};

type Base = { postable: boolean; asOf: string; sample?: boolean };

export type DealLine = {
  /** "30%" or "$20" — the savings figure exactly as the store states it. */
  saving: string;
  product: string;
  store: string;
  city: string;
};

export type SavingData = Base &
  (
    | { status: "ok"; deal: DealLine; live: number; stores: number }
    | { status: "none"; live: number; stores: number }
    | { status: "unknown" }
  );

export type CityData = Base & {
  status: "ok" | "none" | "unknown";
  city: string;
  citySlug: string;
  deals: DealLine[];
  /** Every live deal in the city today, all kinds. */
  live: number;
};

export type IndexCity = { city: string; deals: number; stores: number; avgPct: number | null };
export type IndexData = Base &
  (
    | {
        status: "ok";
        day: string; // YYYY-MM-DD, the latest logged day
        deals: number;
        stores: number;
        avgPct: number | null;
        week: { day: string; deals: number }[]; // up to 7 days, oldest first
        cities: IndexCity[];
        coverageNote: string | null;
      }
    | { status: "unknown" }
  );

export type CheapestRow = { city: string; store: string; pretax: number; otd: number; onSale: boolean };
export type CheapestData = Base & ({ status: "ok"; rows: CheapestRow[]; stores: number } | { status: "unknown" });

export type LawFact = {
  id: string;
  /** YYYY-MM-DD the law/event is dated. */
  date: string;
  /** The one bold figure on the card ("60 g", "0.4 mg", "June 12"). */
  figure: string;
  figureNote: string;
  headline: string;
  body: string;
  sourceName: string;
  sourceUrl: string;
  /** The PuffPrice page the fact is taken from. */
  page: string;
  /** YYYY-MM-DD the fact was last checked (the source page's "checked" date). */
  checked: string;
  tags: string[];
};
export type LawData = Base & { status: "ok"; fact: LawFact };

export type DriveThruData = Base &
  (
    | { status: "ok"; open: { store: string; city: string }[]; announced: number; tracked: number }
    | { status: "unknown" }
  );

export type SocialData = {
  saving: SavingData;
  city: CityData;
  index: IndexData;
  cheapest: CheapestData;
  law: LawData;
  "drive-thru": DriveThruData;
};
