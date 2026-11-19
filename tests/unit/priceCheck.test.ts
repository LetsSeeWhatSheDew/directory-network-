import { test } from "node:test";
import assert from "node:assert/strict";
import { townTable, median } from "../../lib/priceCheck";

const it = (ref: string, city: string, otd: number) => ({ ref, city, otd, listingSlug: `${city}-${otd}` });

test("median", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
});

test("town rows use each store's cheapest; region row covers all; cheapest eighth town first", () => {
  const board = {
    byRef: {
      eighth: [it("eighth", "Normal", 22.92), it("eighth", "Peoria", 25.3), it("eighth", "Peoria", 30)],
      cart_1g: [it("cart_1g", "Peoria", 36.23)],
      gummies_100mg: [],
    },
    stores: 3, newest: null, oldest: null,
  } as never;
  const t = townTable(board);
  assert.equal(t.region.cells.eighth?.typical, 25.3);
  assert.equal(t.region.cells.eighth?.stores, 3);
  assert.deepEqual(t.towns.map((r) => r.city), ["Normal", "Peoria"]);
  assert.equal(t.towns[1].cells.eighth?.typical, 27.65);
  assert.equal(t.towns[0].cells.cart_1g, null);
  assert.equal(t.region.cells.gummies_100mg, null);
});
