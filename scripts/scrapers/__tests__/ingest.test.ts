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

test("buildDealRow: percent discount → percent + value + discount_pct", () => {
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
  assert.equal(row.discount_pct, 20);
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
  assert.equal(row.discount_pct, 30);
});

test("buildDealRow: '20% off Munchie Monday' → discount_pct=20, recurring_days=['monday'], no active_days", () => {
  const row = buildDealRow({
    slug: "abc",
    platform: "leafly",
    scraped: { title: "20% off Munchie Monday", source_url: "u" },
    now: NOW,
  });
  assert.equal(row.discount_pct, 20);
  assert.deepEqual(row.recurring_days, ["monday"]);
  // active_days is NOT a column on `deals` — confirm we don't write it.
  assert.equal((row as Record<string, unknown>).active_days, undefined);
});

test("buildDealRow: 'Wax Wednesday — buy 2 get 1' → discount_pct=null, recurring_days=['wednesday']", () => {
  const row = buildDealRow({
    slug: "abc",
    platform: "leafly",
    scraped: {
      title: "Wax Wednesday — buy 2 get 1",
      source_url: "u",
    },
    now: NOW,
  });
  assert.equal(row.discount_pct, null);
  assert.deepEqual(row.recurring_days, ["wednesday"]);
});

test("buildDealRow: '30% off everything' → discount_pct=30, recurring_days=null", () => {
  const row = buildDealRow({
    slug: "abc",
    platform: "leafly",
    scraped: { title: "30% off everything", source_url: "u" },
    now: NOW,
  });
  assert.equal(row.discount_pct, 30);
  assert.equal(row.recurring_days, null);
});

test("buildDealRow: no day match → recurring_days null", () => {
  const row = buildDealRow({
    slug: "abc",
    platform: "generic",
    scraped: { title: "Veterans Discount 10% off", source_url: "u" },
    now: NOW,
  });
  assert.equal(row.recurring_days, null);
});

test("buildDealRow: dollar discount mapped correctly, discount_pct stays null", () => {
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
  assert.equal(row.discount_pct, null);
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
  assert.equal(row.discount_pct, 25);
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
