// scripts/verify-registry-items.ts
// =============================================================================
// Phase 9: try to resolve the VERIFY items in
// reference-data/dispensary_registry.json by probing live endpoints.
//
// This script does NOT edit reference-data/ (Cowork's lane). It writes
// findings to docs/menu-pipeline-progress.md and prints suggested updates
// the operator can hand to Cowork.
//
// Probes
//   1. Beyond Hello Bloomington Jane store ID:
//      GET https://www.iheartjane.com/api/v1/stores?slug=…
//      filter by zip/lat/lng match.
//   2. Trinity Peoria Glen Dutchie slug:
//      POST dutchie.com/graphql FilteredProducts with candidate cNames
//      ('trinity-compassionate-care-glen', 'trinity-glen-rec', etc.).
//   3. RISE Canton Dutchie endpoint/slug:
//      POST dutchie.com/graphql with candidates ('rise-canton',
//      'rise-cannabis-canton', 'rise-canton-rec').
//   4. IDFPR-VERIFY license numbers: not resolvable programmatically --
//      flag for manual IDFPR lookup.
//
// Politeness: 2-second delay between probes; UA identifies us.
// =============================================================================

import { argv } from "node:process";

const USER_AGENT = "PuffPriceMenuPipeline/1.0 (verify-probes; +https://puffprice.com/about)";
const POLITE_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Finding {
  store: string;
  field: string;
  current: string;
  proposed: string | null;
  evidence: string;
}

const findings: Finding[] = [];

// ------ Beyond Hello Bloomington -- Jane store ID -------
async function probeBeyondHelloBloomington(): Promise<void> {
  // Live endpoint confirmed by Chrome Round 2: www.iheartjane.com/api/v1/stores
  // (the older api.iheartjane.com/v1/stores host is dead). Slug-scope the query
  // to match the production Jane adapter (lib/scraper/menu/adapters/jane.ts).
  const url = "https://www.iheartjane.com/api/v1/stores?slug=beyond-hello-bloomington-rec";
  console.log(`\n[BH Bloomington] GET ${url}`);
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
    if (!res.ok) {
      findings.push({
        store: "beyond-hello-bloomington",
        field: "platform_store_id",
        current: "VERIFY_via_api.iheartjane.com/v1/stores",
        proposed: null,
        evidence: `iheartjane v1/stores returned ${res.status}`,
      });
      return;
    }
    const body = (await res.json()) as { stores?: Array<{ id: number; name: string; address: string; city: string; state: string }> };
    const candidates = (body.stores || []).filter(
      (s) =>
        s.state === "IL" &&
        s.city?.toLowerCase().includes("bloom") &&
        /beyond.?hello/i.test(s.name)
    );
    if (candidates.length === 0) {
      findings.push({
        store: "beyond-hello-bloomington",
        field: "platform_store_id",
        current: "VERIFY_via_api.iheartjane.com/v1/stores",
        proposed: null,
        evidence: `iheartjane v1/stores returned no Bloomington Beyond Hello match`,
      });
      return;
    }
    const best = candidates[0];
    findings.push({
      store: "beyond-hello-bloomington",
      field: "platform_store_id",
      current: "VERIFY_via_api.iheartjane.com/v1/stores",
      proposed: String(best.id),
      evidence: `iheartjane v1/stores: id=${best.id} "${best.name}" ${best.address}, ${best.city}`,
    });
    console.log(`  -> candidate ${best.id}: ${best.name}`);
  } catch (err) {
    findings.push({
      store: "beyond-hello-bloomington",
      field: "platform_store_id",
      current: "VERIFY_via_api.iheartjane.com/v1/stores",
      proposed: null,
      evidence: `probe failed: ${(err as Error).message}`,
    });
  }
}

// ------ Trinity Glen + RISE Canton Dutchie slug probes -------
async function probeDutchieSlug(
  storeSlug: string,
  candidates: string[]
): Promise<void> {
  const endpoint = "https://dutchie.com/graphql";
  for (const cName of candidates) {
    console.log(`  trying cName=${cName}`);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        body: JSON.stringify({
          operationName: "FilteredProducts",
          query: `query FilteredProducts($filter: ProductFilter) { filteredProducts(filter: $filter) { queryInfo { totalCount } } }`,
          variables: { filter: { cName, menuType: "Rec", page: 0, perPage: 1, pricingType: "rec" } },
        }),
      });
      if (!res.ok) continue;
      const body = (await res.json()) as { data?: { filteredProducts?: { queryInfo?: { totalCount?: number } } | null } };
      const count = body.data?.filteredProducts?.queryInfo?.totalCount;
      if (typeof count === "number" && count > 0) {
        findings.push({
          store: storeSlug,
          field: "platform_store_id",
          current: "VERIFY",
          proposed: cName,
          evidence: `dutchie.com/graphql FilteredProducts cName=${cName} -> ${count} products`,
        });
        console.log(`  -> HIT: ${cName} (${count} products)`);
        return;
      }
    } catch {
      // try next candidate
    }
    await sleep(POLITE_DELAY_MS);
  }
  findings.push({
    store: storeSlug,
    field: "platform_store_id",
    current: "VERIFY",
    proposed: null,
    evidence: `none of ${candidates.length} candidate slugs returned products`,
  });
}

async function main(): Promise<void> {
  const onlyBh = argv.includes("--only=bh");
  const onlyTrinity = argv.includes("--only=trinity");
  const onlyRise = argv.includes("--only=rise");
  const all = !onlyBh && !onlyTrinity && !onlyRise;

  if (all || onlyBh) await probeBeyondHelloBloomington();
  if (all || onlyTrinity) {
    console.log(`\n[Trinity Glen] candidates:`);
    await probeDutchieSlug("trinity-peoria-glen", [
      "trinity-compassionate-care-glen",
      "trinity-compassionate-care-centers-glen",
      "trinity-peoria-glen-rec",
      "trinity-glen",
      "trinity-glen-rec",
    ]);
  }
  if (all || onlyRise) {
    console.log(`\n[RISE Canton] candidates:`);
    await probeDutchieSlug("rise-canton", [
      "rise-canton",
      "rise-cannabis-canton",
      "rise-dispensary-canton",
      "rise-canton-rec",
      "evergreen-canton",
    ]);
  }

  // Always note the IDFPR license items that can't be probed.
  const idfprNeeded = [
    "ivy-hall-peoria-heights",
    "beyond-hello-peoria",
    "noxx-east-peoria",
    "cookies-peoria-heights",
  ];
  for (const slug of idfprNeeded) {
    findings.push({
      store: slug,
      field: "license_number",
      current: "VERIFY_IDFPR",
      proposed: null,
      evidence: "Not programmatically resolvable. Look up at https://idfprapps.illinois.gov/LicenseLookup/AdultUseDispensaries.pdf",
    });
  }

  // Report
  console.log("\n\n========= PHASE 9 FINDINGS =========");
  for (const f of findings) {
    const status = f.proposed ? "RESOLVED" : "UNRESOLVED";
    console.log(`\n[${status}] ${f.store}.${f.field}`);
    console.log(`  current:  ${f.current}`);
    if (f.proposed) console.log(`  proposed: ${f.proposed}`);
    console.log(`  evidence: ${f.evidence}`);
  }
  console.log("\nHand resolved findings to Cowork for the next registry update.");
  console.log("This script does NOT edit reference-data/ (Cowork-owned).");
}

main().catch((e) => { console.error(e); process.exit(1); });
