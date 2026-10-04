// Unit tests: crawler/AI discovery surfaces — /llms.txt body and sitemap
// coverage. Fetch is stubbed (empty tables); no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { llmsTxt } from "../../lib/llmsTxt";
import { CENTRAL_IL_PUBLIC_CITIES } from "../../lib/constants/regions";
import { stubFetch } from "./_stub";

const U = "https://www.puffprice.com";

test("llms.txt links every key page, the MCP endpoint and each public city", () => {
  const t = llmsTxt();
  for (const path of ["/mcp", "/mcp/server-card", "/developers", "/deal-index", "/status", "/how-we-rank", "/dispensaries", "/deals/all", "/cheapest", "/out-the-door", "/illinois-cannabis-tax-calculator", "/llms-full.txt", "/api/public/deals"]) {
    assert.ok(t.includes(`${U}${path}`), `missing ${path}`);
  }
  for (const c of CENTRAL_IL_PUBLIC_CITIES) assert.ok(t.includes(`${U}/city/${c.slug})`), `missing city ${c.slug}`);
  // The three scope cities without a store are named, but get no /city page link (it 404s).
  for (const slug of ["bartonville", "morton", "washington"]) assert.ok(!t.includes(`${U}/city/${slug}`), `links 404 city ${slug}`);
  assert.match(t, /Bartonville, Morton, Washington/);
  // Never a bare /deals link (that path 404s; the hub is /deals/all).
  assert.ok(!t.includes(`${U}/deals)`) && !t.includes(`${U}/deals `) && !t.includes(`${U}/deals\n`), "bare /deals link");
});

test("sitemap lists key pages once each, and no 404 city pages", async () => {
  const s = stubFetch({});
  try {
    const { default: sitemap } = await import("../../app/sitemap");
    const urls = (await sitemap()).map((e) => e.url);
    assert.equal(new Set(urls).size, urls.length, "duplicate sitemap URLs");
    for (const path of ["", "/deal-index", "/status", "/how-we-rank", "/developers", "/map", "/dispensaries", "/deals/all", "/guides"]) {
      assert.ok(urls.includes(`${U}${path}`), `missing ${path || "/"}`);
    }
    for (const c of CENTRAL_IL_PUBLIC_CITIES) assert.ok(urls.includes(`${U}/city/${c.slug}`), `missing /city/${c.slug}`);
    for (const slug of ["bartonville", "morton", "washington"]) assert.ok(!urls.includes(`${U}/city/${slug}`), `404 city ${slug} listed`);
    assert.ok(!urls.includes(`${U}/deals`), "bare /deals listed");
  } finally {
    s.restore();
  }
});
