// /mcp/server-card — MCP Server Card for this server. Location recommended by
// the experimental server-card extension (github.com/modelcontextprotocol/
// experimental-ext-server-card: "GET <streamable-http-url>/server-card").
// Draft, not yet part of the MCP spec (SEP-2127). See /developers.
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
