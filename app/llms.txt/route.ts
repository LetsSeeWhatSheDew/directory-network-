// /llms.txt — a plain map of PuffPrice for AI assistants and answer engines.
// Body: lib/llmsTxt.ts.
import { llmsTxt } from "@/lib/llmsTxt";

export const revalidate = 86400;

export function GET() {
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=86400" } });
}
