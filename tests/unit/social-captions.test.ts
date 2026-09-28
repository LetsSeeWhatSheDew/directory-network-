// Unit tests for lib/social — the social template builders and captions.
// Run: npx tsx --test tests/unit/social-captions.test.ts
// (or `npm run test:unit` once the test runner from PR #9 is on main).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildCheapest, buildCity, buildDriveThru, buildIndex, buildSaving, citiesWithDeals, type SocialDeal } from "../../lib/social/build";
import { BANNED, captionFor, cheapestCaption, cityCaption, driveThruCaption, hashtags, indexCaption, lawCaption, savingCaption } from "../../lib/social/captions";
import { LAW_FACTS, lawFactFor } from "../../lib/social/laws";
import { WEEK } from "../../lib/social/schedule";
import { SOCIAL_TEMPLATES, type SocialData } from "../../lib/social/types";
import { dayAsOfLabel } from "../../lib/social/time";
import { FIXTURE_BOARD, FIXTURE_DEALS, FIXTURE_FEATURES, FIXTURE_INDEX, FIXTURE_NOW, FIXTURE_STORES } from "../../lib/social/fixtures";

const law = (id?: string) => {
  const fact = lawFactFor(id, new Date(FIXTURE_NOW));
  return { status: "ok" as const, postable: true, asOf: dayAsOfLabel(fact.checked), fact };
};

function allData(): SocialData {
  return {
    saving: buildSaving(FIXTURE_DEALS, FIXTURE_NOW),
    city: buildCity(FIXTURE_DEALS, "Peoria", FIXTURE_NOW),
    index: buildIndex(FIXTURE_INDEX),
    cheapest: buildCheapest(FIXTURE_BOARD),
    law: law(),
    "drive-thru": buildDriveThru(FIXTURE_STORES, FIXTURE_FEATURES),
  };
}

/** Numbers in a caption, ignoring the as-of line, "21+", hashtags and 3.5g. */
function numbersIn(caption: string): string[] {
  const body = caption
    .split("\n")
    .filter((l) => !l.startsWith("As of ") && !l.startsWith("#"))
    .join("\n")
    .replace(/\b3\.5g\b/g, "")
    .replace(/\bAs of [^,]+, \d{4}(, \d+:\d+ [AP]M)? CT/g, "");
  return body.match(/\$?\d+(\.\d+)?%?/g) || [];
}

describe("house rules on every caption", () => {
  const data = allData();
  for (const t of SOCIAL_TEMPLATES) {
    test(`${t}: 21+, puffprice.com, as-of CT, 3–5 hashtags, no banned words, no emoji`, () => {
      const c = captionFor(t, data);
      assert.ok(c, `${t} should have a caption with fixture data`);
      assert.match(c, /21\+/);
      assert.match(c, /puffprice\.com/);
      assert.match(c, /As of [A-Z][a-z]{2} \d{1,2}, \d{4}(, \d{1,2}:\d{2} [AP]M)? CT/);
      const tags = c.match(/#[A-Za-z]+/g) || [];
      assert.ok(tags.length >= 3 && tags.length <= 5, `${t}: ${tags.length} hashtags`);
      assert.equal(new Set(tags).size, tags.length, "no duplicate hashtags");
      assert.doesNotMatch(c, BANNED);
      assert.doesNotMatch(c, /\p{Extended_Pictographic}/u);
      assert.doesNotMatch(c, /#(weed|cannabis|marijuana|420|stoner)/i);
    });
  }
});

describe("today's biggest saving", () => {
  test("picks the biggest fresh everyday deal, skipping first-time, buy-several and stale deals", () => {
    const d = buildSaving(FIXTURE_DEALS, FIXTURE_NOW);
    assert.equal(d.status, "ok");
    if (d.status !== "ok") return;
    // 50% (stale, 9 days), 40% (buy 3+) and 30% (first-time) are all skipped.
    assert.equal(d.deal.saving, "35%");
    assert.equal(d.deal.store, "Riverfront Dispensary");
    assert.equal(d.deal.city, "Peoria");
    assert.equal(d.live, FIXTURE_DEALS.length);
  });

  test("caption only uses numbers from the data", () => {
    const d = buildSaving(FIXTURE_DEALS, FIXTURE_NOW);
    const c = savingCaption(d)!;
    if (d.status !== "ok") throw new Error("expected ok");
    const allowed = new Set([d.deal.saving, String(d.live), String(d.stores)]);
    for (const n of numbersIn(c)) assert.ok(allowed.has(n), `unexpected number ${n} in: ${c}`);
    assert.match(c, /35% off all house flower, at Riverfront Dispensary in Peoria/);
  });

  test("unreadable data → no caption, no number", () => {
    const d = buildSaving(null, FIXTURE_NOW);
    assert.equal(d.status, "unknown");
    assert.equal(d.postable, false);
    assert.equal(savingCaption(d), null);
  });

  test("nothing qualifies → honest count, no headline number", () => {
    const onlyConditional: SocialDeal[] = FIXTURE_DEALS.filter((x) => /first-time|buy 3/.test(String(x.deal_title)));
    const d = buildSaving(onlyConditional, FIXTURE_NOW);
    assert.equal(d.status, "none");
    const c = savingCaption(d)!;
    assert.match(c, /no headline number today/);
    for (const n of numbersIn(c)) assert.ok(["2"].includes(n), `unexpected number ${n}`);
  });

  test("expired deals don't count as live", () => {
    const expired = { ...FIXTURE_DEALS[0], deal_id: "x", expires_at: new Date(FIXTURE_NOW - 3600_000).toISOString() };
    const d = buildSaving([expired], FIXTURE_NOW);
    assert.equal(d.status, "none");
    if (d.status === "none") assert.equal(d.live, 0);
  });
});

describe("city roundup", () => {
  test("top 3 in the city only, one per store, biggest first", () => {
    const d = buildCity(FIXTURE_DEALS, "Peoria", FIXTURE_NOW);
    assert.equal(d.status, "ok");
    assert.deepEqual(d.deals.map((x) => x.saving), ["35%", "25%", "$10"]);
    assert.ok(d.deals.every((x) => x.city === "Peoria"));
    assert.equal(new Set(d.deals.map((x) => x.store)).size, d.deals.length);
    const c = cityCaption(d)!;
    assert.match(c, /^Peoria, today\./);
    assert.match(c, /1\. 35% off all house flower, Riverfront Dispensary/);
    assert.match(c, /#PeoriaIL/);
  });

  test("never pads a city with another city's deals", () => {
    const d = buildCity(FIXTURE_DEALS, "Urbana", FIXTURE_NOW);
    assert.equal(d.status, "none");
    assert.equal(d.deals.length, 0);
    assert.equal(cityCaption(d), null);
  });

  test("default city is the one with the most stores discounting", () => {
    assert.equal(citiesWithDeals(FIXTURE_DEALS, FIXTURE_NOW)[0], "Peoria");
    assert.equal(buildCity(FIXTURE_DEALS, null, FIXTURE_NOW).city, "Peoria");
  });

  test("as-of is the oldest check among the deals shown", () => {
    const d = buildCity(FIXTURE_DEALS, "Peoria", FIXTURE_NOW);
    // Prospect Road ($10) was checked 6 hours before FIXTURE_NOW (9:05 AM CT).
    assert.equal(d.asOf, "Sep 27, 2026, 3:05 AM CT");
  });
});

describe("Deal Index weekly", () => {
  test("same numbers as /deal-index, with the Sept 25 coverage note", () => {
    const d = buildIndex(FIXTURE_INDEX);
    assert.equal(d.status, "ok");
    if (d.status !== "ok") return;
    assert.equal(d.deals, 41);
    assert.equal(d.stores, 19);
    assert.equal(d.avgPct, 23);
    assert.equal(d.week.length, 7);
    assert.match(d.coverageNote || "", /Sept 25/);
    const c = indexCaption(d)!;
    assert.match(c, /41 deals live at 19 stores/);
    assert.match(c, /23% off/);
    assert.match(c, /Peoria 12 \(avg 24% off\)/);
    assert.match(c, /As of Sep 26, 2026 CT/);
  });

  test("no log yet → unknown, no caption", () => {
    const d = buildIndex({ days: [], latest: [], latestDay: null });
    assert.equal(d.status, "unknown");
    assert.equal(indexCaption(d), null);
  });
});

describe("cheapest eighth by city", () => {
  test("one row per city, lowest out-the-door, only cities with menus", () => {
    const d = buildCheapest(FIXTURE_BOARD);
    assert.equal(d.status, "ok");
    if (d.status !== "ok") return;
    assert.deepEqual(d.rows.map((r) => r.city), ["Peoria", "Springfield", "Peoria Heights", "Bloomington", "Champaign"]);
    assert.equal(d.rows[0].otd, 33.88);
    const c = cheapestCaption(d)!;
    assert.match(c, /Peoria: Riverfront Dispensary, \$25\.00 on the shelf, about \$33\.88 out the door/);
    assert.match(c, /our estimate/, "out-the-door is labeled as an estimate");
    assert.doesNotMatch(c, /^(Urbana|Normal|Pekin):/m);
    const allowed = new Set(d.rows.flatMap((r) => [`$${r.pretax.toFixed(2)}`, `$${r.otd.toFixed(2)}`]));
    for (const n of numbersIn(c)) assert.ok(allowed.has(n), `unexpected number ${n}`);
  });

  test("no fresh menus → unknown", () => {
    const d = buildCheapest({ byRef: { eighth: [], cart_1g: [], gummies_100mg: [] }, stores: 0, newest: null, oldest: null });
    assert.equal(d.postable, false);
    assert.equal(cheapestCaption(d), null);
  });
});

describe("law card", () => {
  test("every fact is dated, sourced and links a PuffPrice page", () => {
    for (const f of LAW_FACTS) {
      assert.match(f.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(f.checked, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(f.sourceUrl, /^https:\/\//);
      assert.match(f.page, /^\//);
      const c = lawCaption(law(f.id))!;
      assert.match(c, new RegExp(`Source: ${f.sourceName}`));
      assert.match(c, /Not legal advice/);
    }
  });

  test("hemp card switches to past tense after Nov 12, 2026", () => {
    assert.match(lawFactFor("hemp-cap", new Date("2026-10-01T15:00:00Z")).body, /^From Nov 12, 2026/);
    const after = lawFactFor("hemp-cap", new Date("2026-11-13T15:00:00Z"));
    assert.match(after.body, /^Since Nov 12, 2026/);
    assert.match(after.headline, /left/);
  });

  test("rotation always lands on a real fact", () => {
    for (let i = 0; i < 20; i++) assert.ok(LAW_FACTS.some((f) => f.id === lawFactFor(null, new Date(FIXTURE_NOW + i * 86_400_000)).id));
  });
});

describe("drive-thru tracker", () => {
  test("counts open and announced from listing_features", () => {
    const d = buildDriveThru(FIXTURE_STORES, FIXTURE_FEATURES);
    assert.equal(d.status, "ok");
    if (d.status !== "ok") return;
    assert.equal(d.open.length, 0);
    assert.equal(d.announced, 1);
    assert.equal(d.tracked, 26);
    const c = driveThruCaption(d)!;
    assert.match(c, /none of the 26 Central Illinois dispensaries we track has opened one/);
    assert.match(c, /1 more store has announced one/);
  });

  test("an open drive-thru is named", () => {
    const rows = [{ ...FIXTURE_FEATURES[0], status: "yes" as const }];
    const d = buildDriveThru(FIXTURE_STORES, rows);
    const c = driveThruCaption(d)!;
    assert.match(c, /1 of the 26 .* has one open: Sample Store 10 in Pekin/);
  });

  test("no stores read → unknown, never '0 of 0'", () => {
    const d = buildDriveThru([], []);
    assert.equal(d.status, "unknown");
    assert.equal(driveThruCaption(d), null);
  });
});

describe("hashtags and schedule", () => {
  test("hashtags are local, 3–5, deduped", () => {
    assert.equal(hashtags(["East Peoria"]), "#EastPeoria #PeoriaIL #CentralIllinois");
    const many = hashtags(["Peoria", "Bloomington", "Champaign", "Springfield", "Pekin"]).split(" ");
    assert.equal(many.length, 5);
    assert.ok(hashtags([]).split(" ").length >= 3);
  });

  test("the week covers every template and every day once", () => {
    assert.equal(WEEK.length, 7);
    for (const t of SOCIAL_TEMPLATES) assert.ok(WEEK.some((w) => w.template === t), `${t} is scheduled`);
  });
});
