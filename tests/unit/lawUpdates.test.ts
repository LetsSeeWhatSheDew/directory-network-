import { test } from "node:test";
import assert from "node:assert/strict";
import { dueLawMoments, lawCursorOf, momentsOf, lawTimeline } from "../../lib/lawUpdates";
import type { LawFact } from "../../lib/social/types";

const f = (id: string, date: string, checked: string, published?: string): LawFact => ({
  id, date, checked, published, figure: "", figureNote: "", headline: id, body: "", sourceName: "", sourceUrl: "", page: "/", tags: [],
});
const hemp = f("hemp", "2026-11-12", "2026-09-23");
const peoria = f("peoria", "2026-10-01", "2026-10-04", "2026-10-04");
const old = f("old", "2026-06-12", "2026-09-23");

test("a future effective date is its own moment", () => {
  assert.deepEqual(momentsOf(hemp).map((m) => [m.kind, m.day]), [["new", "2026-09-23"], ["effective", "2026-11-12"]]);
  assert.equal(momentsOf(peoria).length, 1); // dated before it was published: one moment
});

test("a new sign-up gets nothing from the back catalogue", () => {
  assert.deepEqual(dueLawMoments([hemp, peoria, old], "2026-10-04", "2026-10-04"), []);
});

test("watchers from before Oct 4 get the Peoria item once", () => {
  const due = dueLawMoments([hemp, peoria, old], "2026-10-01", "2026-10-05");
  assert.deepEqual(due.map((m) => m.fact.id), ["peoria"]);
  assert.deepEqual(dueLawMoments([hemp, peoria, old], "2026-10-05", "2026-10-06"), []);
});

test("Nov 12: the hemp cap goes out as 'takes effect'", () => {
  const due = dueLawMoments([hemp, peoria, old], "2026-11-11", "2026-11-12");
  assert.deepEqual(due.map((m) => [m.fact.id, m.kind]), [["hemp", "effective"]]);
});

test("cursor falls back to the created day", () => {
  assert.equal(lawCursorOf(["law", "ok:x"], "2026-10-04T05:00:00Z"), "2026-10-04");
  assert.equal(lawCursorOf(["law", "law:2026-10-09"], "2026-10-04T05:00:00Z"), "2026-10-09");
  assert.equal(lawCursorOf(["law", "law:garbage"], "2026-10-04T05:00:00Z"), "2026-10-04");
});

test("timeline hides effective days that haven't come yet", () => {
  const ids = lawTimeline([hemp, peoria, old], "2026-10-04").map((m) => `${m.fact.id}:${m.kind}`);
  assert.deepEqual(ids, ["peoria:new", "hemp:new", "old:new"]);
  assert.ok(lawTimeline([hemp], "2026-11-12").some((m) => m.kind === "effective"));
});

import { renderLawEmail } from "../../lib/dealAlertEmail";
const item = (headline: string, effective = false) => ({ headline, body: "b <x>", sourceName: "S", sourceUrl: "https://s.example", pageUrl: "https://www.puffprice.com/drive-thru", effective });
test("law email: subject, escaping, both unsubscribe links", () => {
  const one = renderLawEmail({ items: [item("Peoria wants a hearing")], stopUrl: "https://x/stop", unsubscribeAllUrl: "https://x/all", dayLabel: "Mon", hubUrl: "https://www.puffprice.com/law-updates" });
  assert.equal(one.subject, "Illinois cannabis law: Peoria wants a hearing");
  assert.ok(one.html.includes("b &lt;x&gt;") && !one.html.includes("b <x>"));
  assert.ok(one.html.includes("https://x/stop") && one.html.includes("https://x/all") && one.text.includes("Not legal advice"));
  const eff = renderLawEmail({ items: [item("Delta-8 leaves", true)], stopUrl: "s", unsubscribeAllUrl: "a", dayLabel: "Thu", hubUrl: "h" });
  assert.equal(eff.subject, "Takes effect today: Delta-8 leaves");
  assert.equal(renderLawEmail({ items: [item("a"), item("b")], stopUrl: "s", unsubscribeAllUrl: "a", dayLabel: "d", hubUrl: "h" }).subject, "2 Illinois cannabis law changes");
});
