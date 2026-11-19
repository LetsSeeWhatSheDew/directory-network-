// lib/priceCheck.ts: the Central Illinois Price Check, town by town. For each
// town and size, the "typical" price is the median of each store's cheapest
// out-the-door price there (from getCheapestBoard). Pure, so it's tested;
// used by /cheapest and scripts/price-check.ts.
import { REF_UNITS, type CheapestBoard, type RefUnit } from "./menuPrices";

export const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export type TownRow = { city: string; cells: Record<RefUnit, { typical: number; stores: number } | null> };

/** One row per town with any fresh menu price, plus the region row first. */
export function townTable(board: CheapestBoard): { region: TownRow; towns: TownRow[] } {
  const cell = (xs: number[]) => (xs.length ? { typical: median(xs), stores: xs.length } : null);
  const cities = new Set<string>();
  for (const r of REF_UNITS) for (const i of board.byRef[r]) cities.add(i.city);
  const row = (city: string | null): TownRow => ({
    city: city ?? "All Central IL",
    cells: Object.fromEntries(REF_UNITS.map((r) => [r, cell(board.byRef[r].filter((i) => !city || i.city === city).map((i) => i.otd))])) as TownRow["cells"],
  });
  const towns = [...cities].map((c) => row(c)).sort((a, b) => (a.cells.eighth?.typical ?? 999) - (b.cells.eighth?.typical ?? 999) || a.city.localeCompare(b.city));
  return { region: row(null), towns };
}
