// Unit tests: in/out of Central Illinois from our own coordinates (lib/regionGeo.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { nearestScopeCity, SCOPE_CITY_POINTS, REGION_RADIUS_MILES } from "../../lib/regionGeo";

test("all 12 scope cities have a center", () => {
  assert.equal(SCOPE_CITY_POINTS.length, 12);
});

test("a GPS fix in downtown Peoria is inside, nearest Peoria", () => {
  const m = nearestScopeCity(40.6936, -89.589);
  assert.ok(m);
  assert.equal(m.inside, true);
  assert.equal(m.slug, "peoria");
  assert.ok(m.miles < 1);
});

test("each scope city's own center resolves to itself and is inside", () => {
  for (const c of SCOPE_CITY_POINTS) {
    const m = nearestScopeCity(c.lat, c.lng);
    assert.equal(m?.slug, c.slug, c.slug);
    assert.equal(m?.inside, true, c.slug);
  }
});

test("rural points between scope cities are still inside", () => {
  // Lincoln, IL: between Springfield and Bloomington, not a scope city.
  const lincoln = nearestScopeCity(40.1484, -89.3648);
  assert.equal(lincoln?.inside, true);
  // Just outside Springfield (Chatham).
  assert.equal(nearestScopeCity(39.6762, -89.7043)?.slug, "springfield");
});

test("points far from the region are outside", () => {
  assert.equal(nearestScopeCity(41.8781, -87.6298)?.inside, false); // Chicago
  assert.equal(nearestScopeCity(38.627, -90.1994)?.inside, false); // St. Louis
  assert.equal(nearestScopeCity(37.2153, -93.2982)?.inside, false); // Springfield, MO
  assert.equal(nearestScopeCity(41.5067, -90.5151)?.inside, false); // Quad Cities
});

test("radius boundary is REGION_RADIUS_MILES", () => {
  assert.equal(REGION_RADIUS_MILES, 35);
  // ~1 mi north of Peoria's center: inside a 2 mi radius, outside a 0.5 mi one.
  assert.equal(nearestScopeCity(40.7081, -89.589, 2)?.inside, true);
  assert.equal(nearestScopeCity(40.7081, -89.589, 0.5)?.inside, false);
});

test("bad input returns null", () => {
  assert.equal(nearestScopeCity(null, -89), null);
  assert.equal(nearestScopeCity(NaN, -89), null);
  assert.equal(nearestScopeCity(200, -89), null);
});

test("a reverse-geocoded label can refine, never relocate", async () => {
  const { refinedCityLabel } = await import("../../lib/regionGeo");
  // Downtown Peoria, geocoder fails: still Peoria.
  assert.equal(refinedCityLabel(40.6936, -89.589, null), "Peoria");
  // Geocoder says a county/township name: ignored.
  assert.equal(refinedCityLabel(40.6936, -89.589, "Peoria County"), "Peoria");
  // Geocoder says Springfield for a Peoria point: ignored (70 mi away).
  assert.equal(refinedCityLabel(40.6936, -89.589, "Springfield"), "Peoria");
  // Near the river, geocoder says East Peoria: accepted (scope city, close).
  assert.equal(refinedCityLabel(40.68, -89.585, "East Peoria"), "East Peoria");
  // Outside the region: no label.
  assert.equal(refinedCityLabel(41.8781, -87.6298, "Chicago"), null);
});
