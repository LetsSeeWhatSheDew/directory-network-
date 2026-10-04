// Unit tests: SEO helpers — dispensary title/LocalBusiness schema.
import { test } from "node:test";
import assert from "node:assert/strict";
import { nameWithCity, externalSameAs, buildDispensaryLocalBusiness } from "../../lib/dispensarySchema";

test("nameWithCity adds the city only when the name lacks it", () => {
  assert.equal(nameWithCity("SHARE", "Springfield"), "SHARE Springfield");
  assert.equal(nameWithCity("Cookies Peoria Heights", "Peoria Heights"), "Cookies Peoria Heights");
  assert.equal(nameWithCity("nuEra East Peoria", "east peoria"), "nuEra East Peoria");
  assert.equal(nameWithCity("Bloom Wellness Normal (Bradford Ln)", "Normal"), "Bloom Wellness Normal (Bradford Ln)");
  assert.equal(nameWithCity("Sunnyside", null), "Sunnyside");
});

test("externalSameAs keeps only the store's own http(s) site", () => {
  assert.deepEqual(externalSameAs("https://everyoneshares.com/", "www.puffprice.com"), ["https://everyoneshares.com/"]);
  assert.deepEqual(externalSameAs("https://www.puffprice.com/dispensary/x", "www.puffprice.com"), []);
  assert.deepEqual(externalSameAs("javascript:alert(1)", "www.puffprice.com"), []);
  assert.deepEqual(externalSameAs("not a url", "www.puffprice.com"), []);
  assert.deepEqual(externalSameAs(null, "www.puffprice.com"), []);
});

test("LocalBusiness schema emits only fields the listing has", () => {
  const full = buildDispensaryLocalBusiness({
    pageUrl: "https://www.puffprice.com/dispensary/share-springfield",
    ownHost: "www.puffprice.com",
    name: "SHARE",
    listing: { address1: "3600 S 6th St", city: "Springfield", state: "IL", phone: "(217) 441-8820", website: "https://everyoneshares.com", lat: 39.75, lng: -89.65 },
    hours: [
      { weekday: 0, opens_at: "09:00:00", closes_at: "20:00:00", is_closed: false },
      { weekday: 6, opens_at: null, closes_at: null, is_closed: true },
    ],
  });
  assert.equal(full["@type"], "LocalBusiness");
  assert.equal(full["@id"], "https://www.puffprice.com/dispensary/share-springfield#store");
  assert.deepEqual(full.geo, { "@type": "GeoCoordinates", latitude: 39.75, longitude: -89.65 });
  assert.deepEqual(full.sameAs, ["https://everyoneshares.com/"]);
  assert.deepEqual(full.openingHoursSpecification, [{ "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "09:00", closes: "20:00" }]);
  assert.ok(!("aggregateRating" in full));

  const bare = buildDispensaryLocalBusiness({
    pageUrl: "https://www.puffprice.com/dispensary/x",
    ownHost: "www.puffprice.com",
    name: "X",
    listing: { website: "https://www.puffprice.com/dispensary/x", lat: null, lng: null },
    hours: [],
  });
  for (const k of ["address", "geo", "telephone", "sameAs", "openingHoursSpecification", "image", "description"]) {
    assert.ok(!(k in bare), `unexpected ${k}`);
  }
});
