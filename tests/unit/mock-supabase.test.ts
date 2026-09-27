// The fixture backend must answer the way PostgREST does, or the smoke suite
// tests something production never sees. Run: npm run test:unit
import { test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../fixtures/mock-supabase.mjs";

const T = {
  t: [
    { id: 1, city: "Peoria", v: 10, tag: "green", arr: ["a", "b"], j: { ref: "eighth" }, at: "2026-09-26T10:00:00Z" },
    { id: 2, city: "East Peoria", v: null, tag: "green", arr: ["b"], j: { ref: "cart_1g" }, at: "2026-09-27T10:00:00Z" },
    { id: 3, city: "Chicago", v: 30, tag: "rent", arr: [], j: {}, at: "2026-09-25T10:00:00Z" },
  ],
};
const q = (s: string) => query(T, "t", new URLSearchParams(s)).rows.map((r: { id: number }) => r.id);

test("eq / neq / in with quoted values", () => {
  assert.deepEqual(q("tag=eq.green"), [1, 2]);
  assert.deepEqual(q("tag=neq.green"), [3]);
  assert.deepEqual(q(`city=in.("Peoria","East Peoria")`), [1, 2]);
});
test("comparisons, is, not", () => {
  assert.deepEqual(q("v=gte.10"), [1, 3]);
  assert.deepEqual(q("v=is.null"), [2]);
  assert.deepEqual(q("v=not.is.null"), [1, 3]);
  assert.deepEqual(q("at=gt.2026-09-26T00:00:00Z&at=lt.2026-09-27T00:00:00Z"), [1]);
});
test("ilike, or, cs, JSON path", () => {
  assert.deepEqual(q("city=ilike.*peoria*"), [1, 2]);
  assert.deepEqual(q("or=(city.eq.Chicago,v.eq.10)"), [1, 3]);
  assert.deepEqual(q("arr=cs.{b}"), [1, 2]);
  assert.deepEqual(q("j->>ref=in.(eighth)"), [1]);
});
test("order with nulls, limit, offset, select", () => {
  assert.deepEqual(q("order=v.desc.nullslast"), [3, 1, 2]);
  assert.deepEqual(q("order=v.asc"), [1, 3, 2]); // PostgREST: asc → nulls last
  assert.deepEqual(q("order=id.asc&limit=1&offset=1"), [2]);
  assert.deepEqual(query(T, "t", new URLSearchParams("select=id,city&id=eq.1")).rows, [{ id: 1, city: "Peoria" }]);
});
test("unknown table is empty, not an error", () => {
  assert.deepEqual(query(T, "nope", new URLSearchParams("")).rows, []);
});
