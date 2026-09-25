// lib/mcp/server.ts — PuffPrice's public MCP server: Streamable HTTP, JSON
// responses only, no sessions, no auth, read-only.
//
// Dual-era (https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning):
//   • Modern (2026-07-28): every request carries
//     params._meta["io.modelcontextprotocol/protocolVersion" | "…/clientCapabilities"]
//     and the MCP-Protocol-Version / Mcp-Method / Mcp-Name headers. Served
//     statelessly; results carry resultType:"complete" and _meta serverInfo.
//   • Legacy (2025-11-25, 2025-06-18, 2025-03-26): `initialize` handshake,
//     then tools/list and tools/call. We never mint Mcp-Session-Id (sessions
//     are optional in those revisions), so every POST stands alone — which is
//     what a serverless function wants anyway.
// Hand-written instead of @modelcontextprotocol/sdk: the latest SDK on npm
// (1.30.1, checked 2026-09-25) tops out at 2025-11-25 and can't answer
// modern requests; this file is small enough to keep spec-exact by hand.
import { brand } from "../brand";
import { TOOLS, TOOL_NAMES, callTool, ToolInputError } from "./tools";

export const MODERN_VERSIONS = ["2026-07-28"] as const;
export const LEGACY_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26"] as const;
export const SUPPORTED_VERSIONS: string[] = [...MODERN_VERSIONS, ...LEGACY_VERSIONS];

export const SERVER_INFO = {
  name: "puffprice",
  title: "PuffPrice: Central Illinois cannabis deals",
  version: "1.0.0",
  websiteUrl: `${brand.url}/developers`,
  icons: [{ src: `${brand.url}/icon-192.png`, mimeType: "image/png", sizes: ["192x192"] }],
};

export const INSTRUCTIONS =
  "PuffPrice tracks licensed cannabis dispensaries and their deals in Central Illinois (Peoria, East Peoria, Peoria Heights, Pekin, Bloomington, Normal, Champaign, Urbana, Springfield), checked daily on each store's own website. No store pays to rank. " +
  "Use find_deals for today's deals, list_dispensaries for stores, hours and ways to buy, out_the_door_price for the real price after Illinois tax, illinois_cannabis_rules for sourced law answers, and deal_index for market-wide numbers. " +
  "Every result has source_url and cite_as: please cite PuffPrice with that link. Adults 21+ only. Not legal advice.";

const K_VERSION = "io.modelcontextprotocol/protocolVersion";
const K_CAPS = "io.modelcontextprotocol/clientCapabilities";
const K_SERVER = "io.modelcontextprotocol/serverInfo";

const MAX_BODY = 64 * 1024;

// ── Response helpers ─────────────────────────────────────────────────────
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id, Last-Event-ID, *",
  "Access-Control-Max-Age": "86400",
};

type Id = string | number | null;

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS_HEADERS, ...extra },
  });
}
function rpcError(id: Id | undefined, code: number, message: string, status: number, data?: unknown): Response {
  const err: Record<string, unknown> = { code, message };
  if (data !== undefined) err.data = data;
  const body: Record<string, unknown> = { jsonrpc: "2.0" };
  if (id !== undefined && id !== null) body.id = id;
  body.error = err;
  return json(body, status);
}
function accepted(): Response {
  return new Response(null, { status: 202, headers: { ...CORS_HEADERS } });
}

/** Mcp-Name / Mcp-Param-* values may be `=?base64?…?=` (2026-07-28 Value Encoding). */
function decodeHeaderValue(v: string): string | null {
  const m = v.match(/^=\?base64\?(.*)\?=$/);
  if (!m) return v;
  try {
    const bin = atob(m[1]);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
const headerSafe = (v: string) => /^[\x20-\x7E\t]*$/.test(v);

// ── Origin (DNS-rebinding guard) ─────────────────────────────────────────
/** Public, no-auth, read-only server meant to be called from anywhere, so
 *  any well-formed http(s) origin is valid; anything else ("null",
 *  file://, chrome-extension://, garbage) gets the spec's 403. */
export function originOk(origin: string | null): boolean {
  if (origin == null) return true;
  try {
    const o = new URL(origin);
    return (o.protocol === "https:" || o.protocol === "http:") && o.origin === origin.replace(/\/$/, "");
  } catch {
    return false;
  }
}
export function forbiddenOrigin(): Response {
  return rpcError(undefined, -32600, "Forbidden: invalid Origin header", 403);
}

// ── Tool plumbing ────────────────────────────────────────────────────────
function toolList() {
  return TOOLS.map((t) => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, annotations: t.annotations }));
}

async function runTool(params: Record<string, unknown>, structured: boolean): Promise<{ result?: Record<string, unknown>; error?: { code: number; message: string } }> {
  const name = params.name;
  if (typeof name !== "string" || !TOOL_NAMES.includes(name)) {
    return { error: { code: -32602, message: `Unknown tool: ${typeof name === "string" ? name : "(missing name)"}. Tools: ${TOOL_NAMES.join(", ")}` } };
  }
  try {
    const out = await callTool(name, params.arguments);
    const result: Record<string, unknown> = { content: [{ type: "text", text: JSON.stringify(out, null, 1) }], isError: false };
    if (structured) result.structuredContent = out;
    return { result };
  } catch (e) {
    // Bad arguments and temporary data outages are tool execution errors, so
    // the model sees the message and can correct itself (2025-11-25 tools spec).
    const msg = e instanceof ToolInputError ? `Invalid arguments: ${e.message}` : e instanceof Error ? e.message : "Tool failed";
    return { result: { content: [{ type: "text", text: msg }], isError: true } };
  }
}

// ── Main entry: one POST = one JSON-RPC message ──────────────────────────
export async function handlePost(req: Request): Promise<Response> {
  const ctype = (req.headers.get("content-type") || "").toLowerCase();
  if (!ctype.includes("application/json")) return rpcError(undefined, -32600, "Content-Type must be application/json", 415);
  const accept = (req.headers.get("accept") || "").toLowerCase();
  // Clients MUST send both application/json and text/event-stream; we only
  // ever answer with application/json, so only refuse a client that can't take it.
  if (accept && !/(application\/json|application\/\*|\*\/\*)/.test(accept)) {
    return rpcError(undefined, -32600, "Not Acceptable: this server responds with application/json", 406);
  }

  const text = await req.text();
  if (text.length > MAX_BODY) return rpcError(undefined, -32600, "Request body too large", 413);
  let msg: unknown;
  try {
    msg = JSON.parse(text);
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }
  if (Array.isArray(msg)) return rpcError(null, -32600, "Invalid Request: JSON-RPC batches are not supported", 400);
  if (!msg || typeof msg !== "object" || (msg as { jsonrpc?: unknown }).jsonrpc !== "2.0") return rpcError(null, -32600, "Invalid Request", 400);

  const m = msg as { id?: unknown; method?: unknown; params?: unknown; result?: unknown; error?: unknown };
  const hasId = Object.prototype.hasOwnProperty.call(m, "id");

  // A client response (legacy only; we never send requests, so nothing to match).
  if (m.method === undefined && hasId && (m.result !== undefined || m.error !== undefined)) return accepted();
  if (typeof m.method !== "string") return rpcError(null, -32600, "Invalid Request: missing method", 400);
  // Notifications (notifications/initialized, notifications/cancelled, …).
  if (!hasId) return accepted();
  if (typeof m.id !== "string" && typeof m.id !== "number") return rpcError(null, -32600, "Invalid Request: id must be a string or number", 400);

  const id = m.id;
  const method = m.method;
  const params = (m.params && typeof m.params === "object" && !Array.isArray(m.params) ? m.params : {}) as Record<string, unknown>;
  const meta = (params._meta && typeof params._meta === "object" ? params._meta : {}) as Record<string, unknown>;
  const hdrVersion = req.headers.get("mcp-protocol-version");
  const metaVersion = meta[K_VERSION];

  // ── Era selection ──
  if (method === "initialize") return legacyInitialize(id, params);
  const modern = metaVersion !== undefined || (hdrVersion != null && (MODERN_VERSIONS as readonly string[]).includes(hdrVersion));
  if (!modern) {
    if (hdrVersion != null && !(LEGACY_VERSIONS as readonly string[]).includes(hdrVersion)) {
      return rpcError(id, -32022, "Unsupported protocol version", 400, { supported: SUPPORTED_VERSIONS, requested: hdrVersion });
    }
    // No header → 2025-03-26 (spec's backwards-compatibility default).
    return legacyDispatch(id, method, params, hdrVersion || "2025-03-26");
  }
  return modernDispatch(req, id, method, params, meta, hdrVersion);
}

// ── Legacy (initialize-based) ────────────────────────────────────────────
function legacyInitialize(id: string | number, params: Record<string, unknown>): Response {
  const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
  const protocolVersion = (LEGACY_VERSIONS as readonly string[]).includes(requested) ? requested : LEGACY_VERSIONS[0];
  const serverInfo: Record<string, unknown> = { name: SERVER_INFO.name, version: SERVER_INFO.version };
  if (protocolVersion !== "2025-03-26") serverInfo.title = SERVER_INFO.title;
  if (protocolVersion === "2025-11-25") {
    serverInfo.websiteUrl = SERVER_INFO.websiteUrl;
    serverInfo.icons = SERVER_INFO.icons;
  }
  return json({
    jsonrpc: "2.0",
    id,
    result: { protocolVersion, capabilities: { tools: { listChanged: false } }, serverInfo, instructions: INSTRUCTIONS },
  });
}

async function legacyDispatch(id: string | number, method: string, params: Record<string, unknown>, version: string): Promise<Response> {
  switch (method) {
    case "ping":
      return json({ jsonrpc: "2.0", id, result: {} });
    case "tools/list":
      return json({ jsonrpc: "2.0", id, result: { tools: toolList() } });
    // Not advertised in capabilities, but some clients list them anyway;
    // an empty list is kinder than an error.
    case "resources/list":
      return json({ jsonrpc: "2.0", id, result: { resources: [] } });
    case "resources/templates/list":
      return json({ jsonrpc: "2.0", id, result: { resourceTemplates: [] } });
    case "prompts/list":
      return json({ jsonrpc: "2.0", id, result: { prompts: [] } });
    case "tools/call": {
      const r = await runTool(params, version !== "2025-03-26");
      return r.error ? json({ jsonrpc: "2.0", id, error: r.error }) : json({ jsonrpc: "2.0", id, result: r.result });
    }
    default:
      return json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
  }
}

// ── Modern (2026-07-28, per-request metadata) ────────────────────────────
async function modernDispatch(
  req: Request,
  id: string | number,
  method: string,
  params: Record<string, unknown>,
  meta: Record<string, unknown>,
  hdrVersion: string | null
): Promise<Response> {
  const metaVersion = meta[K_VERSION];
  // Required per-request fields → -32602 / 400.
  if (typeof metaVersion !== "string") return rpcError(id, -32602, `Invalid params: _meta["${K_VERSION}"] is required`, 400);
  if (!meta[K_CAPS] || typeof meta[K_CAPS] !== "object" || Array.isArray(meta[K_CAPS])) {
    return rpcError(id, -32602, `Invalid params: _meta["${K_CAPS}"] is required`, 400);
  }
  if (!(MODERN_VERSIONS as readonly string[]).includes(metaVersion)) {
    return rpcError(id, -32022, "Unsupported protocol version", 400, { supported: SUPPORTED_VERSIONS, requested: metaVersion });
  }
  // Mirrored headers must be present and match the body → -32020 / 400.
  const mismatch = (msg: string) => rpcError(id, -32020, `Header mismatch: ${msg}`, 400);
  if (hdrVersion == null) return mismatch("MCP-Protocol-Version header is required");
  if (hdrVersion !== metaVersion) return mismatch(`MCP-Protocol-Version header '${hdrVersion}' does not match body '${metaVersion}'`);
  const hdrMethod = req.headers.get("mcp-method");
  if (hdrMethod == null) return mismatch("Mcp-Method header is required");
  if (hdrMethod !== method) return mismatch(`Mcp-Method header '${hdrMethod}' does not match body '${method}'`);
  const nameField = method === "tools/call" || method === "prompts/get" ? params.name : method === "resources/read" ? params.uri : undefined;
  if (nameField !== undefined || method === "tools/call" || method === "prompts/get" || method === "resources/read") {
    const raw = req.headers.get("mcp-name");
    if (raw == null) return mismatch("Mcp-Name header is required");
    if (!headerSafe(raw)) return mismatch("Mcp-Name header contains invalid characters");
    const decoded = decodeHeaderValue(raw);
    if (decoded == null) return mismatch("Mcp-Name header has invalid base64");
    if (decoded !== nameField) return mismatch(`Mcp-Name header value '${decoded}' does not match body value '${String(nameField)}'`);
  }
  // No tool uses x-mcp-header, so any Mcp-Param-* header is unrecognized and ignored.

  const done = (result: Record<string, unknown>) =>
    json({ jsonrpc: "2.0", id, result: { resultType: "complete", ...result, _meta: { [K_SERVER]: { name: SERVER_INFO.name, version: SERVER_INFO.version } } } });

  switch (method) {
    case "server/discover":
      return done({
        supportedVersions: SUPPORTED_VERSIONS,
        capabilities: { tools: {} },
        instructions: INSTRUCTIONS,
      });
    case "ping":
      return done({});
    case "tools/list":
      return done({ tools: toolList() });
    case "tools/call": {
      const r = await runTool(params, true);
      if (r.error) return rpcError(id, r.error.code, r.error.message, 200);
      return done(r.result!);
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`, 404);
  }
}

// ── GET / DELETE on the endpoint ─────────────────────────────────────────
/** Both eras: no standalone SSE stream here → 405. The body is a pointer
 *  for humans and crawlers who open the URL in a browser. */
export function methodNotAllowed(req: Request): Response {
  const headers = { ...CORS_HEADERS, Allow: "POST, OPTIONS", "Cache-Control": "public, max-age=3600" };
  const wantsHtml = (req.headers.get("accept") || "").includes("text/html");
  if (wantsHtml) {
    const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PuffPrice MCP server</title><meta name="robots" content="noindex"><style>body{font:16px/1.5 system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;color:#1c2a22;background:#fbf8f3}code{background:#efe9df;padding:2px 5px;border-radius:4px}a{color:#1f5c3d}@media(prefers-color-scheme:dark){body{background:#12211a;color:#e8efe9}code{background:#1d3b2c}a{color:#9fd9b6}}</style><h1>PuffPrice MCP server</h1><p>This is a <a href="https://modelcontextprotocol.io">Model Context Protocol</a> endpoint for AI assistants. It speaks JSON-RPC over HTTP <code>POST</code> (Streamable HTTP), so there's nothing to see here in a browser.</p><p>Add <code>${brand.url}/mcp</code> to your assistant as a remote MCP server (no sign-in needed). Tools: find_deals, list_dispensaries, out_the_door_price, illinois_cannabis_rules, deal_index.</p><p>Setup, terms and the open JSON API: <a href="${brand.url}/developers">${brand.url}/developers</a>. 21+ only.</p>`;
    return new Response(html, { status: 405, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  }
  return json(
    {
      error: "Method Not Allowed",
      message: "PuffPrice's MCP endpoint accepts JSON-RPC over HTTP POST (MCP Streamable HTTP). There is no SSE stream to GET and no session to DELETE.",
      name: SERVER_INFO.name,
      protocol_versions: SUPPORTED_VERSIONS,
      tools: TOOL_NAMES,
      docs: `${brand.url}/developers`,
      server_card: `${brand.url}/mcp/server-card`,
    },
    405,
    headers
  );
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ── Server card (draft; see /developers for status) ─────────────────────
export function serverCard() {
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    name: "com.puffprice/deals",
    title: SERVER_INFO.title,
    description: "Live Central Illinois cannabis dispensary deals, stores, out-the-door tax math and sourced Illinois cannabis rules. Read-only, no sign-in.",
    version: SERVER_INFO.version,
    websiteUrl: SERVER_INFO.websiteUrl,
    icons: SERVER_INFO.icons,
    remotes: [{ type: "streamable-http", url: `${brand.url}/mcp`, supportedProtocolVersions: SUPPORTED_VERSIONS }],
  };
}
