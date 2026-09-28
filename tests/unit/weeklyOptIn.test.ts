// Monday report double opt-in + unsubscribe tokens — run with `npm run test:unit`.
// Supabase is replaced by an in-memory fetch stub; nothing touches the network.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  subscribeWeekly,
  confirmWeekly,
  listWeeklySubscribers,
  isWeeklyConfirmed,
  weeklyConfirmTag,
  weeklyConfirmToken,
  unsubscribeToken,
} from "../../lib/alertSubscribers";

type Row = { id: string; email: string; city: string | null; categories: string[] | null; is_active: boolean; created_at: string; alert_type?: string | null };
let rows: Row[] = [];
let writes: Array<{ method: string; body: Record<string, unknown> }> = [];
const origFetch = globalThis.fetch;
const env = { ...process.env };

function uuid(n: number) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  process.env.UNSUBSCRIBE_SECRET = "test-unsub-secret";
  rows = [];
  writes = [];
  let next = 1;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = (init?.method || "GET").toUpperCase();
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
    const p = url.searchParams;
    const byEmail = p.get("email")?.replace(/^ilike\./, "");
    const byId = p.get("id")?.replace(/^eq\./, "");
    const match = (r: Row) => (!byEmail || r.email === byEmail) && (!byId || r.id === byId) && (p.get("is_active") !== "eq.true" || r.is_active);
    if (method === "GET") return Response.json(rows.filter(match));
    writes.push({ method, body });
    if (method === "POST") {
      const r = { id: uuid(next++), created_at: new Date().toISOString(), city: null, categories: null, is_active: false, ...body } as Row;
      rows.push(r);
      return Response.json([r], { status: 201 });
    }
    if (method === "PATCH") {
      for (const r of rows.filter(match)) Object.assign(r, body);
      return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 405 });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = origFetch;
  process.env = { ...env };
});

test("a new address is saved inactive and needs the confirm link", async () => {
  const r = await subscribeWeekly({ email: "New@Example.com", city: "peoria", categories: ["all"] });
  assert.equal(r.ok && r.status, "pending");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, "new@example.com");
  assert.equal(rows[0].is_active, false);
  assert.deepEqual(await listWeeklySubscribers(), [], "unconfirmed address gets nothing");
});

test("confirming turns it on and it then receives the report", async () => {
  const r = await subscribeWeekly({ email: "a@example.com", city: "peoria" });
  assert.ok(r.ok && r.status === "pending");
  assert.equal(await confirmWeekly(rows[0].id), true);
  assert.equal(rows[0].is_active, true);
  assert.ok(rows[0].categories!.includes(weeklyConfirmTag(rows[0].id, "a@example.com")!));
  assert.deepEqual(await listWeeklySubscribers(), [{ email: "a@example.com", city: "peoria" }]);
  // Signing up again while confirmed just updates preferences.
  const again = await subscribeWeekly({ email: "a@example.com", city: "normal" });
  assert.equal(again.ok && again.status, "active");
  assert.equal(rows[0].is_active, true);
  assert.equal(rows[0].city, "normal");
});

test("a stranger can't switch an unsubscribe back on", async () => {
  rows.push({ id: uuid(9), email: "gone@example.com", city: "peoria", categories: ["all"], is_active: false, created_at: "2026-05-01T00:00:00Z" });
  const r = await subscribeWeekly({ email: "gone@example.com", city: "peoria" });
  assert.equal(r.ok && r.status, "pending");
  assert.equal(rows[0].is_active, false, "stays off until the owner of the address confirms");
  assert.ok(writes.every((w) => w.body.is_active !== true));
});

test("existing single-opt-in subscribers (no tag) keep getting the report", async () => {
  rows.push({ id: uuid(7), email: "legacy@example.com", city: "urbana", categories: ["all"], is_active: true, created_at: "2026-06-01T00:00:00Z" });
  assert.deepEqual(await listWeeklySubscribers(), [{ email: "legacy@example.com", city: "urbana" }]);
  const r = await subscribeWeekly({ email: "legacy@example.com", city: "champaign" });
  assert.equal(r.ok && r.status, "active");
});

test("a forged confirm tag doesn't count", async () => {
  const row = { id: uuid(3), email: "x@example.com", city: null, categories: ["all", "ok:000000000000000000000000"], is_active: true, created_at: new Date().toISOString() };
  assert.equal(isWeeklyConfirmed(row), false);
  rows.push(row);
  assert.deepEqual(await listWeeklySubscribers(), []);
});

test("confirm/unsubscribe tokens need a secret; none configured → empty (never valid)", () => {
  assert.match(weeklyConfirmToken(uuid(1), 123), /^[0-9a-f]{32}$/);
  assert.match(unsubscribeToken("a@example.com"), /^[0-9a-f]{32}$/);
  assert.notEqual(unsubscribeToken("a@example.com"), unsubscribeToken("b@example.com"));
  delete process.env.UNSUBSCRIBE_SECRET;
  delete process.env.CRON_SECRET;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_KEY;
  assert.equal(weeklyConfirmToken(uuid(1), 123), "");
  assert.equal(unsubscribeToken("a@example.com"), "");
  assert.equal(weeklyConfirmTag(uuid(1), "a@example.com"), null);
});
