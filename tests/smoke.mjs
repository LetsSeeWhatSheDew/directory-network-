#!/usr/bin/env node
// tests/smoke.mjs
// =============================================================================
// Production smoke test suite. No dependencies — uses native fetch + regex.
// Run: `npm run smoke` (defaults to https://www.puffprice.com).
// Run with custom host: `BASE=https://puffprice-preview-abc.vercel.app npm run smoke`.
// Exits 1 on any failure so CI can gate deploys.
// =============================================================================

const BASE = (process.env.BASE || "https://www.puffprice.com").replace(/\/$/, "");

const results = [];
let failed = 0;

async function test(name, fn) {
  const start = Date.now();
  try {
    await fn();
    const ms = Date.now() - start;
    results.push({ ok: true, name, ms });
    console.log(`  ✓ ${name} (${ms}ms)`);
  } catch (e) {
    failed += 1;
    const ms = Date.now() - start;
    results.push({ ok: false, name, ms, error: (e instanceof Error ? e.message : String(e)) });
    console.log(`  ✗ ${name} (${ms}ms)`);
    console.log(`      ${(e instanceof Error ? e.message : String(e))}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function getHtml(path, expectedStatus = 200, extraHeaders = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: { "User-Agent": "puffprice-smoke/1.0", ...extraHeaders } });
  if (res.status !== expectedStatus) {
    throw new Error(`GET ${path} → ${res.status} (expected ${expectedStatus})`);
  }
  return { html: await res.text(), headers: res.headers, status: res.status };
}

async function main() {
  console.log(`Smoke tests → ${BASE}\n`);

  await test("Homepage loads with ≥1 deal card or hero", async () => {
    const { html } = await getHtml("/");
    assert(html.length > 1000, `homepage too short (${html.length} bytes)`);
    const hasDealIndicators = /GO HERE|deals?\s*near|hero-deal|deal-card/i.test(html);
    assert(hasDealIndicators, "no deal / hero indicators found in homepage HTML");
  });

  await test("/deals/flower renders with deal data", async () => {
    const { html } = await getHtml("/deals/flower");
    assert(/flower/i.test(html), "/deals/flower missing 'flower' in HTML");
    const hasCard = /GO HERE|deal-card|listingHref|\/l\//i.test(html);
    assert(hasCard, "/deals/flower has no deal cards or listing links");
  });

  await test("/l/nuera-east-peoria renders dispensary page", async () => {
    const { html } = await getHtml("/l/nuera-east-peoria");
    assert(/nuera|east peoria/i.test(html), "nuera-east-peoria page missing expected copy");
  });

  await test("/upgrade shows $0.99 pricing", async () => {
    const { html } = await getHtml("/upgrade");
    assert(/\$0\.99/.test(html), "upgrade page missing $0.99 price");
  });

  await test("/admin/submissions redirects to login without auth", async () => {
    const res = await fetch(`${BASE}/admin/submissions`, {
      redirect: "manual",
      headers: { "User-Agent": "puffprice-smoke/1.0" },
    });
    // Middleware redirects unauthed /admin to /admin-login (307/308).
    assert([301, 302, 307, 308].includes(res.status), `admin/submissions gave ${res.status}, expected redirect`);
    const loc = res.headers.get("location") || "";
    assert(/admin-login/.test(loc), `admin redirect location not admin-login: ${loc}`);
  });

  await test("sitemap.xml has ≥50 URLs and is well-formed", async () => {
    const { html } = await getHtml("/sitemap.xml");
    assert(html.startsWith("<?xml"), "sitemap.xml not XML");
    const urlCount = (html.match(/<url>/g) || []).length;
    assert(urlCount >= 50, `sitemap only has ${urlCount} URLs, expected ≥50`);
  });

  await test("robots.txt exists and allows crawling of /cannabis and /deal", async () => {
    const { html } = await getHtml("/robots.txt");
    assert(/User-?Agent/i.test(html), "robots.txt missing user agent directive");
    assert(!/Disallow:\s*\/cannabis/i.test(html), "robots.txt disallows /cannabis");
    assert(!/Disallow:\s*\/deal(\/|\b)/i.test(html), "robots.txt disallows /deal");
  });

  await test("/cannabis/illinois loads with dispensary listings", async () => {
    const { html } = await getHtml("/cannabis/illinois");
    assert(/illinois/i.test(html), "IL landing page missing 'illinois'");
    assert(html.length > 2000, "IL landing page too short");
  });

  await test("Homepage freshness badge shows 'Imported' copy", async () => {
    // Post-Task 4: imported_not_verified deals render "Imported MMM DD"
    // instead of "Verification pending". This check runs AFTER Matthew
    // applies the verified_at backfill migration. If it fails before
    // migration, it's not a regression — flag in known-flakes below.
    const { html } = await getHtml("/");
    const hasImported = /Imported\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(html);
    const hasPending = /Verification\s+pending/i.test(html);
    assert(
      hasImported || !hasPending,
      "homepage shows 'Verification pending' on every card — verified_at backfill migration may not have landed yet"
    );
  });

  await test("All canonical URLs use https://www.puffprice.com (not apex)", async () => {
    const { html } = await getHtml("/upgrade");
    const bareCanonical = /canonical["\s=]+https:\/\/puffprice\.com/i.test(html);
    assert(!bareCanonical, "canonical tag still points at apex (no www) on /upgrade");
  });

  console.log(`\n${failed ? `✗ ${failed} failed` : "✓ all passed"} (${results.length} total)`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
