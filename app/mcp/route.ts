// /mcp — PuffPrice's public, read-only Model Context Protocol server.
// Streamable HTTP, JSON responses, stateless. Protocol logic: lib/mcp/server.ts.
// Docs for humans: /developers.
//
// Guard rails around the protocol handler (all per request):
//   • body over 64 KB → 413 before it's read (Content-Length) or parsed
//   • 60 requests a minute per client (salted in-memory hash, no IP kept)
//   • 20 s overall deadline → JSON-RPC error instead of a hung function
//   • responses over 512 KB → JSON-RPC error instead of an unbounded payload
// Every tool is read-only and reads only project_tag='green' data
// (lib/mcp/data.ts → active_deals_with_listings, master_listings,
// listing_hours, listing_features, daily_market_stats).
import { handlePost, methodNotAllowed, preflight, originOk, forbiddenOrigin, CORS_HEADERS } from "@/lib/mcp/server";
import { rateLimited, clientKey } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** 60 requests a minute per IP, per serverless instance. A speed bump, not a wall. */
const PER_MINUTE = 60;
const MAX_BODY = 64 * 1024;
const MAX_RESPONSE = 512 * 1024;
const DEADLINE_MS = 20_000;

function rpcFailure(status: number, code: number, message: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS_HEADERS, ...extra },
  });
}

function limited(req: Request): Response | null {
  if (!rateLimited(`mcp:${clientKey(req.headers)}`, PER_MINUTE, 60_000)) return null;
  return rpcFailure(429, 429, `Rate limited: up to ${PER_MINUTE} requests a minute. Try again shortly.`, { "Retry-After": "60" });
}

async function guarded(req: Request): Promise<Response> {
  if (Number(req.headers.get("content-length") || 0) > MAX_BODY) {
    return rpcFailure(413, -32600, "Request body too large");
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<Response>((resolve) => {
    timer = setTimeout(() => resolve(rpcFailure(504, -32603, "The server took too long to answer. Try again.")), DEADLINE_MS);
  });
  try {
    const res = await Promise.race([handlePost(req), deadline]);
    if (res.status === 504 || !res.body) return res;
    const text = await res.text();
    if (text.length > MAX_RESPONSE) return rpcFailure(500, -32603, "Result too large. Narrow the request (city, category, max_results).");
    return new Response(text, { status: res.status, headers: res.headers });
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  if (!originOk(req.headers.get("origin"))) return forbiddenOrigin();
  return limited(req) || guarded(req);
}

export async function GET(req: Request) {
  if (!originOk(req.headers.get("origin"))) return forbiddenOrigin();
  return methodNotAllowed(req);
}

export async function DELETE(req: Request) {
  if (!originOk(req.headers.get("origin"))) return forbiddenOrigin();
  return methodNotAllowed(req);
}

export function OPTIONS() {
  return preflight();
}
