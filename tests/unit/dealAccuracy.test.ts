// Unit tests: deal accuracy scoring (lib/dealAccuracy.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { tallyReports, scoreAccuracy, freshShare, MIN_REPORTS, type ReportRow } from "../../lib/dealAccuracy";

const row = (o: Partial<ReportRow>): ReportRow => ({ deal_id: "d1", listing_slug: null, reason: "confirmed", user_agent: "ua-1", created_at: "2026-09-26T15:00:00Z", ...o });
const stores: Record<string, string> = { d1: "store-a", d2: "store-a", d3: "store-b" };
const lookup = (id: string) => stores[id] || null;

test("Yes/No reasons count; page-level reports don't", () => {
  const t = tallyReports(
    [
      row({ reason: "confirmed" }),
      row({ reason: "price_changed", user_agent: "ua-2" }),
      row({ reason: "expired", user_agent: "ua-3" }),
      row({ reason: "wrong_store", user_agent: "ua-4" }),
      row({ reason: "wrong_info", user_agent: "ua-5" }),
      row({ reason: "other", user_agent: "ua-6" }),
    ],
    lookup
  );
  assert.deepEqual(t.get("store-a"), { yes: 1, no: 3 });
});

test("one Yes and one No per deal, per browser, per Central-Time day", () => {
  const t = tallyReports(
    [
      row({}), row({}), row({}), // same browser, same day: 1
      row({ created_at: "2026-09-27T15:00:00Z" }), // next day: +1
      row({ created_at: "2026-09-27T04:00:00Z" }), // 11 PM CT on the 26th: same day as the first → no
      row({ user_agent: "ua-2" }), // another browser: +1
      row({ deal_id: "d2" }), // another deal: +1
      row({ reason: "expired" }), row({ reason: "price_changed" }), // No, same browser/day: 1
    ],
    lookup
  );
  assert.deepEqual(t.get("store-a"), { yes: 4, no: 1 });
});

test("listing_slug on the report wins; unknown deals are skipped", () => {
  const t = tallyReports([row({ listing_slug: "store-z", deal_id: "d3" }), row({ deal_id: "unknown" })], lookup);
  assert.deepEqual(t.get("store-z"), { yes: 1, no: 0 });
  assert.equal(t.has("store-b"), false);
  assert.equal(t.size, 1);
});

test(`thin below ${MIN_REPORTS} reports, scored at or above`, () => {
  assert.equal(scoreAccuracy({ yes: 4, no: 0 }, { fresh: 1, live: 1 }).status, "thin");
  const s = scoreAccuracy({ yes: 4, no: 1 }, { fresh: 2, live: 4 });
  assert.equal(s.status, "scored");
  // 0.8 * 0.8 + 0.2 * 0.5 = 0.74
  assert.equal(s.status === "scored" && s.score, 74);
});

test("people-only when there are no live deals to re-check", () => {
  const s = scoreAccuracy({ yes: 9, no: 1 }, { fresh: 0, live: 0 });
  assert.equal(s.status === "scored" && s.score, 90);
});

test("freshness counts deals re-found in the last 48 hours", () => {
  const now = Date.parse("2026-09-27T12:00:00Z");
  const f = freshShare(
    [{ verified_at: "2026-09-27T09:00:00Z" }, { verified_at: "2026-09-25T13:00:00Z" }, { verified_at: "2026-09-24T09:00:00Z" }, { verified_at: null }],
    now
  );
  assert.deepEqual(f, { fresh: 2, live: 4 });
});
