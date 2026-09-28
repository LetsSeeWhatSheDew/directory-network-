// Unit tests for lib/answers.ts — the city answer pages.
// Run: npm run test:unit
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildAnswer,
  allAnswerParams,
  ANSWER_TOPICS,
  CHEAPEST_ITEMS,
  type AnswerData,
  type AnswerTopic,
} from "../../lib/answers";
import { cityCenter, type CheapestItem, type RefUnit } from "../../lib/menuPrices";
import { CENTRAL_IL_CITIES } from "../../lib/constants/regions";
import type { RegionStore, FeatureRow, TonightRow } from "../../lib/waysToBuy";
import type { LiveDeal } from "../../lib/guides";

// Sat Sep 26 2026, 8:00 PM CT
const NOW = new Date("2026-09-27T01:00:00Z");

const store = (slug: string, name: string, city: string, n: number): RegionStore => ({
  id: `id-${n}`, slug, name, city, address1: null, phone: null, website: null, logo_url: null,
});
const S = {
  noxx: store("noxx-east-peoria", "NOXX East Peoria", "East Peoria", 1),
  beyond: store("beyond-hello-peoria", "Beyond / Hello Peoria", "Peoria", 2),
  trinity: store("trinity-on-university", "Trinity on University", "Peoria", 3),
  cookiesPH: store("cookies-peoria-heights", "Cookies Peoria Heights", "Peoria Heights", 4),
  urbana: store("nuera-urbana", "nuEra Urbana", "Urbana", 5),
  sunny: store("sunnyside-champaign", "Sunnyside Champaign", "Champaign", 6),
  ascend: store("ascend-springfield", "Ascend Springfield", "Springfield", 7),
};
const STORES = Object.values(S);

const item = (ref: RefUnit, s: RegionStore, pretax: number, otd: number): CheapestItem => ({
  ref, listingSlug: s.slug, storeName: s.name, city: s.city, citySlug: s.city.toLowerCase().replace(/\s+/g, "-"),
  brand: "Brand", product: "Brand Thing", weight: null, regular: pretax, pretax, otd, onSale: false,
  checkedAt: "2026-09-26T17:00:00Z", sourceUrl: "https://example.com/menu",
});

const tonight = (s: RegionStore, closesAt: string | null, openNow = true): TonightRow => ({
  store: s, closesAt, closesLabel: closesAt ? `Open until ${closesAt}` : "Hours not listed", openNow, closedToday: false,
});

const deal = (s: RegionStore, title: string, value: number | null, unit: string | null, extra: Partial<LiveDeal> = {}): LiveDeal => ({
  deal_id: `${s.slug}-${title}`, deal_title: title, category: "flower", city: s.city, name: s.name, slug: s.slug, listing_slug: s.slug,
  discount_value: value, discount_unit: unit, discount_type: unit === "percent" ? "percent" : null, is_recurring: false, recurring_days: null,
  verified_at: "2026-09-26T12:00:00Z", source_url: null, ...extra,
});

const feature = (s: RegionStore, f: FeatureRow["feature"], status: FeatureRow["status"]): FeatureRow => ({
  listing_slug: s.slug, feature: f, status, evidence: "the store's words", source_url: "https://example.com", verified_at: "2026-09-25T12:00:00Z",
});

const EMPTY: AnswerData = {
  now: NOW,
  board: { byRef: { eighth: [], cart_1g: [], gummies_100mg: [] }, stores: 0, newest: null, oldest: null },
  stores: [], features: [], tonight: [], deals: [],
};

const RICH: AnswerData = {
  now: NOW,
  board: {
    byRef: {
      eighth: [item("eighth", S.noxx, 24, 29.38), item("eighth", S.beyond, 40, 49.66), item("eighth", S.ascend, 32, 39.68)],
      cart_1g: [item("cart_1g", S.beyond, 42, 57.06)],
      gummies_100mg: [],
    },
    stores: 3, newest: "2026-09-26T17:00:00Z", oldest: "2026-09-26T17:00:00Z",
  },
  stores: STORES,
  features: [feature(S.cookiesPH, "medical", "yes"), feature(S.noxx, "medical", "no"), feature(S.beyond, "order_ahead", "yes")],
  tonight: [tonight(S.noxx, "23:00:00"), tonight(S.beyond, "22:00:00"), tonight(S.trinity, "22:00:00"), tonight(S.cookiesPH, "21:00:00"), tonight(S.urbana, null, false)],
  deals: [
    deal(S.beyond, "First-time customers 40% off", 40, "percent"),
    deal(S.beyond, "20% off all flower", 20, "percent"),
    deal(S.trinity, "Buy 2 get 1 free edibles", null, null),
    deal(S.sunny, "$10 off $50", 10, "dollars"),
  ],
};

const BAD = /\bNaN\b|\bundefined\b|\bnull\b|\$0\.00|\[object Object\]/;

describe("registry", () => {
  test("7 questions × 12 cities", () => {
    assert.equal(ANSWER_TOPICS.length, 7);
    assert.equal(allAnswerParams().length, 7 * CENTRAL_IL_CITIES.length);
  });
  test("every scope city has a center, so 'near' works everywhere", () => {
    for (const c of CENTRAL_IL_CITIES) assert.ok(cityCenter(c.slug), c.slug);
  });
  test("paths are unique and cheapest items map to the three menu units", () => {
    const paths = allAnswerParams().map(({ topic, city }) => ANSWER_TOPICS.find((t) => t.topic === topic)!.path(city));
    assert.equal(new Set(paths).size, paths.length);
    assert.deepEqual(Object.values(CHEAPEST_ITEMS).map((v) => v.ref).sort(), ["cart_1g", "eighth", "gummies_100mg"]);
  });
  test("unknown city → null", () => {
    assert.equal(buildAnswer("medical", "chicago", RICH), null);
  });
});

describe("never invents or leaks a bad value", () => {
  for (const [label, data] of [["empty data", EMPTY], ["real-shaped data", RICH]] as const) {
    test(`no NaN / undefined / null / $0.00 in any answer (${label})`, () => {
      for (const { topic, city } of allAnswerParams()) {
        const a = buildAnswer(topic as AnswerTopic, city, data)!;
        const all = [a.answerText, a.metaTitle, a.metaDescription, a.h1, a.lede, ...a.faqs.flatMap((f) => [f.q, f.a]), ...a.rows.flatMap((r) => [r.title, r.sub, r.right || "", r.rightSub || ""])].join("\n");
        assert.doesNotMatch(all, BAD, `${topic}/${city}`);
        assert.match(a.answerText, /\b(As of|Yes\.|Not yet\.)/, `${topic}/${city} answer is dated`);
        assert.ok(a.faqs.length >= 3, `${topic}/${city} has a FAQ`);
      }
    });
  }
  test("with no data at all, nothing is indexable", () => {
    const indexable = allAnswerParams().filter(({ topic, city }) => buildAnswer(topic, city, EMPTY)!.indexable);
    assert.deepEqual(indexable, []);
  });
});

describe("cheapest", () => {
  test("names the cheapest store near the city with its out-the-door price", () => {
    const a = buildAnswer("cheapest-eighth", "peoria", RICH)!;
    assert.match(a.answerText, /\$29\.38 out the door \(\$24\.00 on the shelf\) at NOXX East Peoria in East Peoria/);
    assert.equal(a.rows.length, 2); // Springfield's store is 60+ miles away
    assert.equal(a.indexable, true);
  });
  test("one store only → says so and stays noindex", () => {
    const a = buildAnswer("cheapest-vape-cart", "peoria", RICH)!;
    assert.match(a.answerText, /only store within 15 miles/);
    assert.equal(a.indexable, false);
  });
  test("nothing nearby → points to the nearest city that has it", () => {
    const a = buildAnswer("cheapest-eighth", "champaign", RICH)!;
    assert.match(a.answerText, /don't have a menu price/);
    assert.ok(a.answer.some((s) => typeof s !== "string" && s.href === "/cheapest/springfield/eighth"), a.answerText);
    assert.equal(a.indexable, false);
  });
  test("storeless city uses stores within 15 miles", () => {
    const a = buildAnswer("cheapest-eighth", "bartonville", RICH)!;
    assert.match(a.answerText, /near Bartonville is \$29\.38/);
  });
});

describe("open late", () => {
  test("latest closing store in the city, ties named together", () => {
    const a = buildAnswer("open-late", "peoria", RICH)!;
    assert.match(a.answerText, /in Peoria today is Beyond \/ Hello Peoria and Trinity on University, open until 10:00 PM/);
    assert.equal(a.indexable, true);
  });
  test("mentions a later store just outside the city", () => {
    const a = buildAnswer("open-late", "peoria", RICH)!;
    const notes = a.notes.map((n) => n.map((s) => (typeof s === "string" ? s : s.text)).join("")).join(" ");
    assert.match(notes, /NOXX East Peoria in East Peoria .* until 11:00 PM/);
  });
  test("a 1 AM close sorts after an 11 PM close", () => {
    const data = { ...RICH, tonight: [tonight(S.noxx, "01:00:00"), tonight(S.beyond, "23:00:00")].sort(() => 0) };
    // getClosingTonight sorts latest-first; mirror that order here.
    const a = buildAnswer("open-late", "washington", data)!;
    assert.match(a.answerText, /NOXX East Peoria in East Peoria, open until 1:00 AM/);
  });
  test("no hours on file → honest, noindex", () => {
    const a = buildAnswer("open-late", "urbana", RICH)!;
    assert.match(a.answerText, /don't have today's hours/);
    assert.equal(a.indexable, false);
  });
  test("after the last close it says everyone has closed", () => {
    const late = { ...RICH, now: new Date("2026-09-27T04:30:00Z") }; // 11:30 PM CT
    const a = buildAnswer("open-late", "peoria", { ...late, tonight: [tonight(S.beyond, "22:00:00", false)] })!;
    assert.match(a.answerText, /closed for the night/);
  });
});

describe("medical", () => {
  test("confirmed store → yes, indexable", () => {
    const a = buildAnswer("medical", "peoria-heights", RICH)!;
    assert.match(a.answerText, /^Yes\. .*Cookies Peoria Heights/);
    assert.equal(a.indexable, true);
  });
  test("none confirmed → nearest confirmed store, noindex", () => {
    const a = buildAnswer("medical", "springfield", RICH)!;
    assert.match(a.answerText, /Ascend Springfield doesn't say .* nearest store that does is Cookies Peoria Heights/);
    assert.equal(a.indexable, false);
  });
});

describe("best deals", () => {
  test("a conditional deal never leads", () => {
    const a = buildAnswer("best-deals", "peoria", RICH)!;
    assert.match(a.answerText, /biggest everyday discount in Peoria is 20% off/);
    assert.equal(a.rows[0].title, "20% off all flower");
    assert.equal(a.rows.find((r) => r.title.startsWith("First-time"))?.pill, "Conditions apply");
  });
  test("no deals in the city → nearest city with deals, noindex", () => {
    const a = buildAnswer("best-deals", "urbana", RICH)!;
    assert.match(a.answerText, /no dispensary in Urbana has a deal .* nearest city with live deals is Champaign/);
    assert.equal(a.indexable, false);
  });
});

describe("drive-thru", () => {
  test("none nearby → 'Not yet', fastest pickup instead, noindex", () => {
    const a = buildAnswer("drive-thru", "peoria", RICH)!;
    assert.match(a.answerText, /^Not yet\./);
    assert.match(a.listHeading, /Fastest pickup/);
    assert.equal(a.indexable, false);
  });
  test("an open drive-thru → 'Yes', indexable", () => {
    const data = { ...RICH, features: [...RICH.features, feature(S.noxx, "drive_thru", "yes")] };
    const a = buildAnswer("drive-thru", "peoria", data)!;
    assert.match(a.answerText, /^Yes\. .*NOXX East Peoria in East Peoria has a drive-thru/);
    assert.equal(a.indexable, true);
  });
});
