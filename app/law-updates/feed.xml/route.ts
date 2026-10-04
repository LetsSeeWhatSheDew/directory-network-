// GET /law-updates/feed.xml — RSS 2.0 of every law change PuffPrice tracks
// (LAW_FACTS via lib/lawUpdates.ts), newest first. For feed readers, news
// desks and AI crawlers that prefer a feed.
import { brand } from "@/lib/brand";
import { LAW_FACTS } from "@/lib/social/laws";
import { ctDay } from "@/lib/social/time";
import { lawTimeline, momentLine } from "@/lib/lawUpdates";

export const revalidate = 3600;

const x = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = lawTimeline(LAW_FACTS, ctDay());
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${x(brand.name)}: Illinois cannabis law changes</title>
<link>${brand.url}/law-updates</link>
<atom:link href="${brand.url}/law-updates/feed.xml" rel="self" type="application/rss+xml"/>
<description>Illinois and Central Illinois cannabis law changes, in plain words, with sources. Not legal advice.</description>
<language>en-us</language>
${items
  .map(
    (m) => `<item>
<title>${x(momentLine(m))}</title>
<link>${brand.url}${m.fact.page}</link>
<guid isPermaLink="false">${x(`${m.fact.id}:${m.kind}`)}</guid>
<pubDate>${new Date(`${m.day}T14:00:00Z`).toUTCString()}</pubDate>
<description>${x(`${m.fact.body} Source: ${m.fact.sourceName} (${m.fact.sourceUrl}).`)}</description>
</item>`
  )
  .join("\n")}
</channel>
</rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}
