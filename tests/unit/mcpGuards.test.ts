// Public MCP server guard rails — run with `npm run test:unit`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { POST, OPTIONS } from "../../app/mcp/route";

const rpc = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://www.puffprice.com/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "x-real-ip": "198.51.100.1", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("oversized body is refused before parsing", async () => {
  const res = await POST(rpc("{}", { "content-length": String(200 * 1024) }));
  assert.equal(res.status, 413);
});

test("bad origin is refused", async () => {
  const res = await POST(rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, { origin: "null" }));
  assert.equal(res.status, 403);
});

test("tools/list answers without touching data and with CORS for any origin", async () => {
  const res = await POST(rpc({ jsonrpc: "2.0", id: 1, method: "tools/list" }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  assert.equal(res.headers.get("access-control-allow-credentials"), null, "never credentialed CORS");
  const j = await res.json();
  assert.ok(Array.isArray(j.result.tools) && j.result.tools.length > 0);
  for (const t of j.result.tools) assert.equal(t.annotations?.readOnlyHint, true, `${t.name} must be read-only`);
});

test("unknown tool arguments are rejected (no pass-through to queries)", async () => {
  const res = await POST(rpc({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "find_deals", arguments: { city: "Peoria", project_tag: "rent" } } }));
  const j = await res.json();
  assert.equal(j.result?.isError, true);
  assert.match(j.result.content[0].text, /Unknown argument/);
});

test("preflight allows the MCP headers", () => {
  const res = OPTIONS();
  assert.equal(res.status, 204);
  assert.match(res.headers.get("access-control-allow-headers") || "", /MCP-Protocol-Version/);
});

test("every MCP data query is scoped to PuffPrice (project_tag=green) data", () => {
  // Views that are already green-only in SQL: active_deals_with_listings
  // (WHERE d.project_tag = 'green') and daily_market_stats (built from
  // deal_observations, which only logs green deals).
  const GREEN_VIEWS = new Set(["active_deals_with_listings", "daily_market_stats"]);
  for (const f of ["lib/mcp/data.ts", "lib/waysToBuy.ts", "lib/dealIndex.ts"]) {
    const src = readFileSync(join(__dirname, "../..", f), "utf8");
    const queries = src.match(/rest\/v1\/[a-z_]+\?[^`]*/g) || [];
    assert.ok(queries.length > 0, `${f} has no queries?`);
    for (const q of queries) {
      const table = q.slice("rest/v1/".length, q.indexOf("?"));
      if (GREEN_VIEWS.has(table)) continue;
      assert.match(q, /project_tag=eq\.green/, `${f}: ${table} query must filter project_tag=eq.green`);
    }
  }
});
