// Unit tests: route corridor geometry and ordering (lib/routeDeals.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { project, onCorridor, parsePair, routeCity, planRoute, ROUTE_CITIES, COMMON_PAIRS, pairSlug, viaHref, CORRIDOR_MILES } from "../../lib/routeDeals";
import type { LiveDeal } from "../../lib/dealOfTheDay";

const NOW = Date.parse("2026-09-27T14:00:00Z");

test("all 12 in-scope cities have coordinates", () => {
  assert.equal(ROUTE_CITIES.length, 12);
  for (const c of ["bartonville", "morton", "washington", "peoria-heights"]) assert.ok(routeCity(c), c);
});

test("pair slugs parse, including hyphenated cities; bad pairs don't", () => {
  assert.deepEqual(
    [parsePair("east-peoria-to-peoria-heights")?.from.slug, parsePair("east-peoria-to-peoria-heights")?.to.slug],
    ["east-peoria", "peoria-heights"]
  );
  assert.equal(parsePair("peoria-to-peoria"), null);
  assert.equal(parsePair("peoria-to-chicago"), null);
  assert.equal(parsePair("peoria"), null);
  for (const [a, b] of COMMON_PAIRS) assert.ok(parsePair(pairSlug(a, b)), pairSlug(a, b));
});

test("projection: along/off on a simple north-south segment", () => {
  const a = { lat: 40.0, lng: -89.0 }, b = { lat: 41.0, lng: -89.0 };
  const mid = project(a, b, { lat: 40.5, lng: -89.0 });
  assert.ok(Math.abs(mid.along - 34.5) < 0.1, String(mid.along));
  assert.ok(mid.off < 0.01);
  const side = project(a, b, { lat: 40.5, lng: -88.9 }); // ~5.3 mi east
  assert.ok(side.off > 5 && side.off < 5.5, String(side.off));
  const behind = project(a, b, { lat: 39.95, lng: -89.0 }); // 3.45 mi behind the start
  assert.equal(behind.along, 0);
  assert.ok(Math.abs(behind.off - 3.45) < 0.05, String(behind.off));
});

test("Peoria to Springfield passes Pekin; Peoria to Bloomington does not", () => {
  const pekin = routeCity("pekin")!;
  const ps = onCorridor(routeCity("peoria")!, routeCity("springfield")!, [{ ...pekin }]);
  assert.equal(ps.length, 1);
  const pb = onCorridor(routeCity("peoria")!, routeCity("bloomington")!, [{ ...pekin }]);
  assert.equal(pb.length, 0);
});

test("stores are ordered along the way, off-corridor and un-located stores dropped", () => {
  const from = routeCity("peoria")!, to = routeCity("bloomington")!;
  const pts = [
    { id: "normal", ...routeCity("normal")! },
    { id: "east-peoria", ...routeCity("east-peoria")! },
    { id: "morton", ...routeCity("morton")! },
    { id: "springfield", ...routeCity("springfield")! },
    { id: "nowhere", lat: null, lng: null },
  ];
  const got = onCorridor(from, to, pts).map((p) => p.id);
  assert.deepEqual(got, ["east-peoria", "morton", "normal"]);
  for (const p of onCorridor(from, to, pts)) assert.ok(p.off <= CORRIDOR_MILES && p.detour >= 0);
});

test("planRoute: 2 deals per store max, everyday savings first, best saving found", () => {
  const ep = routeCity("east-peoria")!, no = routeCity("normal")!;
  let i = 0;
  const d = (o: Partial<LiveDeal>): LiveDeal => ({
    deal_id: `id-${++i}`, deal_title: "20% off flower", discount_value: 20, discount_unit: "percent", city: "East Peoria",
    slug: "ep-store", name: "EP Store", lat: ep.lat, lng: ep.lng, verified_at: new Date(NOW).toISOString(), ...o,
  });
  const plan = planRoute(routeCity("peoria")!, routeCity("bloomington")!, [
    d({ discount_value: 50, deal_title: "50% off for veterans" }),
    d({ discount_value: 10, deal_title: "10% off everything" }),
    d({ discount_value: 25, deal_title: "25% off vapes" }),
    d({ discount_value: 30, deal_title: "30% off when you buy 2" }),
    d({ slug: "n-store", name: "N Store", city: "Normal", lat: no.lat, lng: no.lng, discount_value: 35, deal_title: "35% off edibles" }),
    d({ slug: "far", name: "Far", city: "Springfield", lat: 39.78, lng: -89.65, discount_value: 60, deal_title: "60% off" }),
    d({ slug: "gone", discount_value: 70, expires_at: new Date(NOW - 1000).toISOString() }),
  ], { now: NOW });
  assert.deepEqual(plan.stops.map((s) => s.slug), ["ep-store", "n-store"]);
  const ep1 = plan.stops[0];
  assert.equal(ep1.total, 4);
  assert.deepEqual(ep1.deals.map((x) => x.deal_title), ["25% off vapes", "10% off everything"]);
  assert.equal(plan.best?.stop.slug, "n-store");
  assert.ok(plan.miles > 30 && plan.miles < 45, String(plan.miles));
});

test("directions link routes through the store with no API key", () => {
  const u = new URL(viaHref(routeCity("peoria")!, routeCity("bloomington")!, { lat: 40.6, lng: -89.3 }));
  assert.equal(u.hostname, "www.google.com");
  assert.equal(u.searchParams.get("origin"), "Peoria, IL");
  assert.equal(u.searchParams.get("destination"), "Bloomington, IL");
  assert.equal(u.searchParams.get("waypoints"), "40.6,-89.3");
  assert.equal(u.searchParams.get("key"), null);
});
