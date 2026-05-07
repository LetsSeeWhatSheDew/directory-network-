// scripts/scrapers/__tests__/ingest.test.ts
//
// Run via: npm run test:scrapers
//
// Pure-function tests for buildDealRow. The full ingestDeals function
// touches Supabase, so we test only the row-shaping logic here.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { buildDealRow } from "../ingest";

const NOW = new Date("2026-11-06T09:00:00.000Z");

test("buildDealRow: percent discount → percent + value", () => {
  const row = buildDealRow({
    slug: "cookies-peoria-heights",
    platform: "dutchie",
    scraped: {
      title: "20% off flower",
      source_url: "https://example.com/d/1",
      discount_value: 20,
      discount_unit: "percent",
    },
    now: NOW,
  });
  assert.equal(row.discount_value, 20);
  assert.equal(row.discount_unit, "percent");
  assert.equal(row.source, "scraper:dutchie");
  assert.equal(row.is_active, true);
  assert.equal(row.verified_at, NOW.toISOString());
  assert.equal(row.last_independent_verification, NOW.toISOString());
  assert.equal(row.project_tag, "green");
  assert.equal(row.listing_slug, "cookies-peoria-heights");
});

test("buildDealRow: title regex backfills discount_value when scraped value is missing", () => {
  const row = buildDealRow({
    slug: "abc",
    platform: "leafly",
    scraped: { title: "30% off Munchie Monday", source_url: "u" },
    now: NOW,
  });
  assert.equal(row.discount_value, 30);
  assert.equal(row.discount_unit, "percent");
});

test("buildDealRow: recurring_days inferred from title", () => {
  const row = buildDealRow({
    slug: "abc",
    platform: "leafly",
    scraped: { title: "Munchie Monday: 25% off edibles", source_url: "u" },
    now: NOW,
  });
  assert.deepEqual(row.recurring_days, ["monday"]);
  assert.deepEqual(row.active_days, ["mon"]);
});

test("buildDealRow: no day match → recurring_days null, active_days null", () => {
  const row = buildDealRow({
    slug: "abc",
    platform: "generic",
    scraped: { title: "Veterans Discount 10% off", source_url: "u" },
    now: NOW,
  });
  assert.equal(row.recurring_days, null);
  assert.equal(row.active_days, null);
});

test("buildDealRow: dollar discount mapped correctly", () => {
  const row = buildDealRow({
    slug: "abc",
    platform: "dutchie",
    scraped: {
      title: "$5 off any cart",
      source_url: "u",
      discount_value: 5,
      discount_unit: "dollar",
    },
    now: NOW,
  });
  assert.equal(row.discount_unit, "dollars");
  assert.equal(row.discount_value, 5);
});

test("buildDealRow: bogo unit collapses to discount_unit=null since DB only allows percent/dollars", () => {
  const row = buildDealRow({
    slug: "abc",
    platform: "dutchie",
    scraped: {
      title: "BOGO half off concentrates",
      source_url: "u",
      discount_unit: "bogo",
    },
    now: NOW,
  });
  // The DB CHECK constraint is discount_unit IN ('percent','dollars').
  // We coerce non-percent/non-dollar units to null so inserts pass.
  assert.equal(row.discount_unit, null);
});

test("buildDealRow: title is whitespace-collapsed and trimmed", () => {
  const row = buildDealRow({
    slug: "abc",
    platform: "generic",
    scraped: { title: "   25%  off   pre-rolls   ", source_url: "u" },
    now: NOW,
  });
  assert.equal(row.title, "25% off pre-rolls");
});

test("buildDealRow: source string includes platform tag", () => {
  for (const p of ["dutchie", "leafly", "iheartjane", "generic"] as const) {
    const row = buildDealRow({
      slug: "abc",
      platform: p,
      scraped: { title: "x", source_url: "u" },
      now: NOW,
    });
    assert.equal(row.source, `scraper:${p}`);
  }
});
