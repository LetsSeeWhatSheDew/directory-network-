#!/usr/bin/env node
// tests/fixtures/mock-supabase.mjs
// =============================================================================
// A tiny PostgREST look-alike that serves tests/fixtures/data.mjs, so the app
// can be built and smoke-tested with no Supabase credentials and no network.
//
// Supports what the app actually sends (see `grep -r rest/v1 app lib`):
//   select (top-level columns; embeds return []), order (asc/desc, nulls),
//   limit, offset, or=(...), and column filters eq neq gt gte lt lte like
//   ilike in is cs, each optionally prefixed with not. JSON paths
//   (raw_payload->>puffprice_ref) work as filter keys. Prefer: count=exact
//   sets Content-Range; Accept: application/vnd.pgrst.object+json returns one
//   object. Writes are accepted and discarded, so every run sees the same data.
//   Unknown tables return [] (an empty table), never an error.
//
// Usage:  node tests/fixtures/mock-supabase.mjs           (port 54329)
//         MOCK_SUPABASE_PORT=6000 node tests/fixtures/mock-supabase.mjs
// =============================================================================

import http from "node:http";
import { buildTables } from "./data.mjs";

export const MOCK_PORT = Number(process.env.MOCK_SUPABASE_PORT || 54329);

// ---------- query parsing ----------

/** Split on commas that are not inside parentheses, braces or quotes. */
function splitTop(s) {
  const out = [];
  let depth = 0, quote = false, cur = "";
  for (const ch of s) {
    if (ch === '"') quote = !quote;
    if (!quote && (ch === "(" || ch === "{")) depth++;
    if (!quote && (ch === ")" || ch === "}")) depth--;
    if (ch === "," && depth === 0 && !quote) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

const unquote = (v) => (v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v);

function listOf(v) {
  const inner = v.replace(/^[({]/, "").replace(/[)}]$/, "");
  return inner === "" ? [] : splitTop(inner).map((x) => unquote(x.trim()));
}

function getPath(row, key) {
  const parts = key.split(/->>|->/);
  let v = row;
  for (const p of parts) v = v == null ? undefined : v[p];
  return v;
}

const num = (x) => (typeof x === "number" ? x : typeof x === "string" && x.trim() !== "" && !Number.isNaN(Number(x)) ? Number(x) : null);

function cmp(a, b) {
  const na = num(a), nb = num(b);
  if (na != null && nb != null) return na - nb;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

const likeRe = (pat, flags) => new RegExp("^" + pat.split("*").map((p) => p.replace(/[.+?^${}()|[\]\\%]/g, (c) => (c === "%" ? ".*" : "\\" + c))).join(".*") + "$", flags);

function test(row, key, expr) {
  let neg = false;
  if (expr.startsWith("not.")) { neg = true; expr = expr.slice(4); }
  const dot = expr.indexOf(".");
  const op = expr.slice(0, dot);
  const val = expr.slice(dot + 1);
  const v = getPath(row, key);
  let ok;
  switch (op) {
    case "eq": ok = v != null && String(v) === unquote(val); break;
    case "neq": ok = v != null && String(v) !== unquote(val); break;
    case "gt": ok = v != null && cmp(v, val) > 0; break;
    case "gte": ok = v != null && cmp(v, val) >= 0; break;
    case "lt": ok = v != null && cmp(v, val) < 0; break;
    case "lte": ok = v != null && cmp(v, val) <= 0; break;
    case "like": ok = v != null && likeRe(val, "").test(String(v)); break;
    case "ilike": ok = v != null && likeRe(val, "i").test(String(v)); break;
    case "in": ok = v != null && listOf(val).includes(String(v)); break;
    case "is": ok = val === "null" ? v == null : String(v) === val; break;
    case "cs": ok = Array.isArray(v) && listOf(val).every((x) => v.map(String).includes(x)); break;
    case "ov": ok = Array.isArray(v) && listOf(val).some((x) => v.map(String).includes(x)); break;
    default: ok = true; // unknown operator: don't filter
  }
  return neg ? !ok : ok;
}

/** "(a.eq.1,b.ilike.*x*)" → row matches any. */
function testOr(row, group) {
  return listOf(group).some((cond) => {
    if (/^and\(/.test(cond)) return listOf(cond.slice(3)).every((c) => testCond(row, c));
    return testCond(row, cond);
  });
}
function testCond(row, cond) {
  const m = cond.match(/^([^.]+)\.(.*)$/);
  return m ? test(row, m[1], m[2]) : true;
}

function project(rows, select) {
  if (!select || select === "*") return rows;
  const cols = splitTop(select).map((c) => c.trim()).filter(Boolean);
  if (cols.includes("*")) return rows;
  return rows.map((r) => {
    const o = {};
    for (const c of cols) {
      const embed = c.match(/^(?:(\w+):)?(\w+)\(/);
      if (embed) { o[embed[1] || embed[2]] = []; continue; }
      const [alias, col] = c.includes(":") ? c.split(":") : [c, c];
      const key = col.replace(/::\w+$/, "");
      o[alias.split(/->>|->/).pop()] = getPath(r, key) ?? null;
    }
    return o;
  });
}

function order(rows, spec) {
  if (!spec) return rows;
  const keys = spec.split(",").map((s) => {
    const [col, ...mods] = s.split(".");
    const desc = mods.includes("desc");
    const nullsFirst = mods.includes("nullsfirst") ? true : mods.includes("nullslast") ? false : desc;
    return { col, desc, nullsFirst };
  });
  return [...rows].sort((a, b) => {
    for (const k of keys) {
      const va = getPath(a, k.col), vb = getPath(b, k.col);
      if (va == null && vb == null) continue;
      if (va == null) return k.nullsFirst ? -1 : 1;
      if (vb == null) return k.nullsFirst ? 1 : -1;
      const c = cmp(va, vb);
      if (c !== 0) return k.desc ? -c : c;
    }
    return 0;
  });
}

const RESERVED = new Set(["select", "order", "limit", "offset", "or", "and", "on_conflict", "columns"]);

export function query(tables, table, params) {
  let rows = tables[table] || [];
  for (const [k, v] of params) {
    if (RESERVED.has(k)) continue;
    rows = rows.filter((r) => test(r, k, v));
  }
  for (const g of params.getAll("or")) rows = rows.filter((r) => testOr(r, g));
  const total = rows.length;
  rows = order(rows, params.get("order"));
  const offset = Number(params.get("offset") || 0);
  const limit = params.get("limit") != null ? Number(params.get("limit")) : Infinity;
  rows = rows.slice(offset, offset + limit);
  return { rows: project(rows, params.get("select")), total, offset };
}

// ---------- server ----------

function send(res, status, body, headers = {}) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", ...headers });
  res.end(res.req.method === "HEAD" ? undefined : payload);
}

export function createMockServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "OPTIONS") return send(res, 204, undefined, { "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" });
    if (url.pathname === "/health") return send(res, 200, { ok: true });

    const rest = url.pathname.match(/^\/rest\/v1\/([^/]+)\/?(.*)$/);
    if (!rest) {
      if (url.pathname.startsWith("/auth/v1")) return send(res, 200, {});
      return send(res, 404, { message: "not found" });
    }
    const table = rest[1];
    if (table === "rpc") return send(res, 200, null);

    if (req.method !== "GET" && req.method !== "HEAD") {
      // Accept and discard writes.
      let body = "";
      for await (const chunk of req) body += chunk;
      const prefer = String(req.headers.prefer || "");
      if (prefer.includes("return=representation")) {
        let parsed = [];
        try { parsed = JSON.parse(body || "[]"); } catch {}
        return send(res, req.method === "POST" ? 201 : 200, Array.isArray(parsed) ? parsed : [parsed]);
      }
      return send(res, req.method === "POST" ? 201 : 204, undefined);
    }

    const tables = buildTables(Date.now());
    const { rows, total, offset } = query(tables, table, url.searchParams);
    const headers = {};
    if (String(req.headers.prefer || "").includes("count=")) {
      headers["Content-Range"] = rows.length ? `${offset}-${offset + rows.length - 1}/${total}` : `*/${total}`;
    }
    if (String(req.headers.accept || "").includes("vnd.pgrst.object")) {
      if (rows.length !== 1) return send(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `Results contain ${rows.length} rows`, hint: null });
      return send(res, 200, rows[0], headers);
    }
    return send(res, 200, rows, headers);
  });
}

export function startMockServer(port = MOCK_PORT) {
  return new Promise((resolve, reject) => {
    const server = createMockServer();
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startMockServer().then(() => console.log(`mock supabase on http://127.0.0.1:${MOCK_PORT}`));
}
