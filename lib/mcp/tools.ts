// lib/mcp/tools.ts — the five read-only tools the PuffPrice MCP server exposes.
//
// Each tool returns a plain object with `source_url`, `as_of` (ISO 8601: a timestamp, or a date for facts checked by the day) and
// `cite_as` ("Source: PuffPrice (puffprice.com), checked <time CT>"). The
// server wraps it as structuredContent + a JSON text block.
import {
  u, ctLabel, ctDay, citeAs, resolveCity, isEmptyScopeCity, SCOPE_CITIES,
  findDeals, listDispensaries, outTheDoor, dealIndex,
  DEAL_CATEGORIES, OTD_CATEGORIES, type DealCategoryArg, type OtdCategory,
} from "./data";
import { RULES, RULE_TOPICS, type RuleTopic } from "./rules";
import { STORE_CAP } from "../storeCap";

export class ToolInputError extends Error {}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

const CITY_PROP = {
  type: "string",
  description: `A Central Illinois city: ${SCOPE_CITIES.join(", ")}. Omit for all of Central Illinois.`,
} as const;

export const TOOLS = [
  {
    name: "find_deals",
    title: "Find today's Central Illinois dispensary deals",
    description:
      "Live cannabis dispensary deals in Central Illinois (Peoria, East Peoria, Peoria Heights, Pekin, Bloomington, Normal, Champaign, Urbana, Springfield), checked daily on each store's own website. Ranked like puffprice.com: biggest discount first, at most 8 deals per store. Each deal has the store, city, discount, an out-the-door price when the deal states a real price, and links. Adults 21+ only.",
    inputSchema: {
      type: "object",
      properties: {
        city: CITY_PROP,
        category: { type: "string", enum: [...DEAL_CATEGORIES], description: "Product type. 'any' (default) includes storewide deals." },
        max_results: { type: "integer", minimum: 1, maximum: 25, description: "How many deals to return (1-25, default 10)." },
        min_discount: { type: "number", minimum: 0, maximum: 100, description: "Only percent-off deals at or above this percent (e.g. 25). Omit to include fixed-price and BOGO deals." },
      },
      additionalProperties: false,
    },
    annotations: { title: "Find deals", ...READ_ONLY },
  },
  {
    name: "list_dispensaries",
    title: "List Central Illinois dispensaries",
    description:
      "Licensed dispensaries PuffPrice tracks in Central Illinois, with address, phone, today's hours (Central Time) when listed, ways to buy (medical, curbside, order ahead, drive-thru) as confirmed on the store's own site with the exact wording, today's live deal count, and the store's PuffPrice page. A null ways-to-buy entry means not confirmed either way, not 'no'.",
    inputSchema: {
      type: "object",
      properties: { city: CITY_PROP },
      additionalProperties: false,
    },
    annotations: { title: "List dispensaries", ...READ_ONLY },
  },
  {
    name: "out_the_door_price",
    title: "Illinois cannabis out-the-door price",
    description:
      "What a recreational cannabis purchase really costs at the register in Central Illinois: state excise tier by product, 6.25% state sales tax, local sales tax, and county + city cannabis taxes, stacked the way the Illinois Department of Revenue says (the excise is itself taxed). Omit city to compare all nine Central Illinois cities with dispensaries. Not for medical-card purchases (1% state rate).",
    inputSchema: {
      type: "object",
      properties: {
        shelf_price: { type: "number", exclusiveMinimum: 0, maximum: 10000, description: "The price on the shelf/menu before tax, in US dollars." },
        category: { type: "string", enum: [...OTD_CATEGORIES], description: "Product type; decides the excise tier." },
        city: { type: "string", description: "One of the nine Central Illinois cities with dispensaries. Omit to get all nine." },
        thc_over_35: { type: "boolean", description: "True if the product is over 35% THC (25% excise). Flower/pre-rolls default to false; vapes/concentrates default to true. Ignored for edibles (always 20%)." },
      },
      required: ["shelf_price", "category"],
      additionalProperties: false,
    },
    annotations: { title: "Out-the-door price", ...READ_ONLY },
  },
  {
    name: "illinois_cannabis_rules",
    title: "Illinois cannabis rules (2026)",
    description:
      "Short, sourced answers on Illinois cannabis law as published on puffprice.com, with the date each was last checked and a link to the full page. Topics: possession (limits for residents and visitors), driving (car container rule, THC DUI limit), delivery, drive_thru, hemp (the Nov 12, 2026 delta-8 change), medical (card, fees, 1% tax), tax (how recreational cannabis is taxed). General information, not legal advice.",
    inputSchema: {
      type: "object",
      properties: { topic: { type: "string", enum: [...RULE_TOPICS], description: "Which rule to look up." } },
      required: ["topic"],
      additionalProperties: false,
    },
    annotations: { title: "Illinois cannabis rules", ...READ_ONLY },
  },
  {
    name: "deal_index",
    title: "Central Illinois Deal Index",
    description:
      "PuffPrice's daily Deal Index from its own deal log: how many deals are live, how many stores are discounting, and the average percentage discount, by Central Illinois city, plus the last 7 days' totals.",
    inputSchema: {
      type: "object",
      properties: { city: CITY_PROP },
      additionalProperties: false,
    },
    annotations: { title: "Deal Index", ...READ_ONLY },
  },
] as const;

export type ToolName = (typeof TOOLS)[number]["name"];
export const TOOL_NAMES = TOOLS.map((t) => t.name) as readonly string[];

// ── Argument helpers (the model sees these messages, so make them useful) ─
type Args = Record<string, unknown>;
const known = (args: Args, keys: string[]) => {
  const extra = Object.keys(args).filter((k) => !keys.includes(k));
  if (extra.length) throw new ToolInputError(`Unknown argument(s): ${extra.join(", ")}. Allowed: ${keys.join(", ") || "none"}.`);
};
const num = (v: unknown, name: string): number | null => {
  if (v == null || v === "") return null;
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) throw new ToolInputError(`${name} must be a number.`);
  return n;
};
const cityArg = (v: unknown) => {
  const r = resolveCity(v);
  if (!r.ok) throw new ToolInputError(r.message);
  return r.city;
};
const enumArg = <T extends readonly string[]>(v: unknown, allowed: T, name: string, dflt?: T[number]): T[number] => {
  if ((v == null || v === "") && dflt) return dflt;
  const s = typeof v === "string" ? v.trim().toLowerCase().replace(/_/g, "-") : v;
  const norm: Record<string, string> = { preroll: "pre-roll", prerolls: "pre-roll", "pre-rolls": "pre-roll", vapes: "vape", edibles: "edible", concentrates: "concentrate", all: "any" };
  const val = typeof s === "string" ? norm[s] || s : s;
  if (typeof val !== "string" || !allowed.includes(val)) throw new ToolInputError(`${name} must be one of: ${allowed.join(", ")}.`);
  return val as T[number];
};

// ── Tool implementations ─────────────────────────────────────────────────
export async function callTool(name: string, rawArgs: unknown): Promise<Record<string, unknown>> {
  const args: Args = rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs) ? (rawArgs as Args) : {};
  const now = new Date();

  switch (name) {
    case "find_deals": {
      known(args, ["city", "category", "max_results", "min_discount"]);
      const city = cityArg(args.city);
      const category = enumArg(args.category, DEAL_CATEGORIES, "category", "any") as DealCategoryArg;
      const maxRaw = num(args.max_results, "max_results");
      if (maxRaw != null && (!Number.isInteger(maxRaw) || maxRaw < 1 || maxRaw > 25)) throw new ToolInputError("max_results must be a whole number from 1 to 25.");
      const minDiscount = num(args.min_discount, "min_discount");
      if (minDiscount != null && (minDiscount < 0 || minDiscount > 100)) throw new ToolInputError("min_discount must be between 0 and 100.");
      const cityUrl = city ? `${u}/city/${city.toLowerCase().replace(/\s+/g, "-")}` : u;
      if (city && isEmptyScopeCity(city)) {
        return {
          city, category, count: 0, deals: [],
          note: `${city} has no licensed dispensary. Nearby options: call find_deals with city Peoria, East Peoria or Pekin.`,
          source_url: u, as_of: now.toISOString(), cite_as: citeAs(ctLabel(now)),
        };
      }
      const r = await findDeals({ city, category, max: maxRaw ?? 10, minDiscount });
      if (!r.ok) throw new Error("PuffPrice's deal data is temporarily unavailable. Try again shortly, or see https://www.puffprice.com.");
      const checked = r.latestVerified || now.toISOString();
      return {
        city: city || "Central Illinois",
        category,
        count: r.deals.length,
        total_matching: r.totalMatching,
        ranking: `Biggest discount first, at most ${STORE_CAP.feed} per store (${u}/how-we-rank). No store pays to rank.`,
        deals: r.deals,
        ...(r.deals.length === 0 ? { note: "No live deals match right now. Try category 'any' or drop min_discount." } : {}),
        source_url: category === "any" ? cityUrl : `${u}/deals/${{ flower: "flower", vape: "vapes", edible: "edibles", concentrate: "concentrate", "pre-roll": "flower" }[category as Exclude<DealCategoryArg, "any">]}${city ? `?city=${encodeURIComponent(city)}` : ""}`,
        as_of: checked,
        cite_as: citeAs(ctLabel(checked)),
        age_notice: "21+ only. Deals change daily; confirm with the store.",
      };
    }

    case "list_dispensaries": {
      known(args, ["city"]);
      const city = cityArg(args.city);
      const r = await listDispensaries(city);
      if (!r.storesOk) throw new Error("PuffPrice's store list is temporarily unavailable. Try again shortly.");
      return {
        city: city || "Central Illinois",
        count: r.stores.length,
        stores: r.stores,
        ...(city && r.stores.length === 0 ? { note: `${city} has no licensed dispensary. Try Peoria, East Peoria or Pekin.` } : {}),
        hours_note: "hours_today is today's listed hours in Central Time; null means not listed.",
        source_url: city ? `${u}/city/${city.toLowerCase().replace(/\s+/g, "-")}` : `${u}/ways-to-buy`,
        as_of: now.toISOString(),
        cite_as: citeAs(ctLabel(now)),
      };
    }

    case "out_the_door_price": {
      known(args, ["shelf_price", "category", "city", "thc_over_35"]);
      const shelf = num(args.shelf_price, "shelf_price");
      if (shelf == null || shelf <= 0 || shelf > 10000) throw new ToolInputError("shelf_price is required: a dollar amount above 0 (up to 10000).");
      const category = enumArg(args.category, OTD_CATEGORIES, "category") as OtdCategory;
      const city = cityArg(args.city);
      if (city && isEmptyScopeCity(city)) throw new ToolInputError(`${city} has no dispensary, so PuffPrice has no tax rates for it. Use one of: Peoria, East Peoria, Peoria Heights, Pekin, Bloomington, Normal, Champaign, Urbana, Springfield.`);
      let thc: boolean | null = null;
      if (args.thc_over_35 != null) {
        if (typeof args.thc_over_35 === "boolean") thc = args.thc_over_35;
        else if (args.thc_over_35 === "true" || args.thc_over_35 === "false") thc = args.thc_over_35 === "true";
        else throw new ToolInputError("thc_over_35 must be true or false.");
      }
      const r = outTheDoor(shelf, category, city, thc);
      const one = r.results.length === 1 ? r.results[0] : null;
      return {
        shelf_price: shelf,
        category,
        excise_tier: r.tierNote,
        ...(one
          ? { summary: `$${shelf.toFixed(2)} ${category} in ${one.city} is about $${one.out_the_door.toFixed(2)} out the door (${one.effective_tax_rate_percent}% total tax).`, result: one }
          : { summary: `$${shelf.toFixed(2)} ${category}: $${Math.min(...r.results.map((x) => x.out_the_door)).toFixed(2)}–$${Math.max(...r.results.map((x) => x.out_the_door)).toFixed(2)} out the door across Central Illinois.`, results: r.results }),
        method: "Excise on the shelf price; state sales, local sales, county and municipal cannabis taxes on shelf + excise (IL Department of Revenue stacking). Recreational only; registered medical patients pay the 1% state rate.",
        source_url: `${u}/illinois-cannabis-tax-calculator`,
        as_of: r.ratesUpdated, // ISO date the tax rates were last verified
        cite_as: citeAs(`${ctDay(r.ratesUpdated)} (tax rates)`),
      };
    }

    case "illinois_cannabis_rules": {
      known(args, ["topic"]);
      const t = typeof args.topic === "string" ? args.topic.trim().toLowerCase().replace(/[-\s]+/g, "_") : "";
      const alias: Record<string, RuleTopic> = { drivethru: "drive_thru", drive_through: "drive_thru", taxes: "tax", limits: "possession", delta_8: "hemp", delta8: "hemp" };
      const topic = (alias[t] || t) as RuleTopic;
      if (!RULE_TOPICS.includes(topic)) throw new ToolInputError(`topic must be one of: ${RULE_TOPICS.join(", ")}.`);
      const rule = RULES[topic];
      return {
        topic: rule.topic,
        question: rule.question,
        answer: rule.answer,
        details: rule.points,
        primary_sources: rule.primary_sources,
        also_see: rule.also_see,
        disclaimer: "General information, not legal advice.",
        source_url: rule.source_url,
        as_of: rule.checked, // ISO date the source page's facts were last checked
        cite_as: citeAs(ctDay(rule.checked)),
      };
    }

    case "deal_index": {
      known(args, ["city"]);
      const city = cityArg(args.city);
      const r = await dealIndex(city);
      if (!r.day) throw new Error("The Deal Index is temporarily unavailable. See https://www.puffprice.com/deal-index.");
      return {
        day: r.day,
        central_illinois: r.total ? { deals_live: r.total.deals, stores_with_deals: r.total.stores, avg_discount_percent: r.total.avgPct } : null,
        cities: r.cities,
        ...(city && r.cities.length === 0 ? { note: `No deals were logged in ${city} on ${ctDay(r.day)}.` } : {}),
        last_7_days: r.trend,
        method: "From PuffPrice's daily deal log. Average discount is over percentage-off deals only, weighted by deals live.",
        source_url: `${u}/deal-index`,
        as_of: now.toISOString(),
        cite_as: citeAs(ctLabel(now)),
      };
    }
  }
  throw new ToolInputError(`Unknown tool: ${name}`);
}
