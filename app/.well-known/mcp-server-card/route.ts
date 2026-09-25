// /.well-known/mcp-server-card — the same MCP Server Card at the well-known
// path in the SEP-2127 draft (modelcontextprotocol PR #2127, status Draft as
// of Sept 2026). Draft; the path may change before it's ratified.
import { serverCard } from "@/lib/mcp/server";

export const revalidate = 86400;

export function GET() {
  return Response.json(serverCard(), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, s-maxage=86400",
    },
  });
}
