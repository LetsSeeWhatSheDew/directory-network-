// /mcp — PuffPrice's public, read-only Model Context Protocol server.
// Streamable HTTP, JSON responses, stateless. Protocol logic: lib/mcp/server.ts.
// Docs for humans: /developers.
import { handlePost, methodNotAllowed, preflight, originOk, forbiddenOrigin, CORS_HEADERS } from "@/lib/mcp/server";
import { rateLimited, clientKey } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** 60 requests a minute per IP, per serverless instance. A speed bump, not a wall. */
const PER_MINUTE = 60;

function limited(req: Request): Response | null {
  if (!rateLimited(`mcp:${clientKey(req.headers)}`, PER_MINUTE, 60_000)) return null;
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code: 429, message: `Rate limited: up to ${PER_MINUTE} requests a minute. Try again shortly.` } }),
    { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60", ...CORS_HEADERS } }
  );
}

export async function POST(req: Request) {
  if (!originOk(req.headers.get("origin"))) return forbiddenOrigin();
  return limited(req) || handlePost(req);
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
