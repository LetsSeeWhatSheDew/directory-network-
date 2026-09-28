// Unit tests: the confirm, digest and price-drop emails (lib/dealAlertEmail.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderConfirmEmail, renderDigestEmail, renderPriceDropEmail } from "../../lib/dealAlertEmail";

test("confirm email: default wording for new-deal watches is unchanged", () => {
  const m = renderConfirmEmail({ what: "in Peoria", confirmUrl: "https://x/c" });
  assert.equal(m.subject, "Confirm: email me new deals in Peoria");
  assert.match(m.html, /Yes, email me new deals/);
  assert.match(m.html, /one short email on mornings when there&#39;s something new in Peoria|one short email on mornings when there's something new in Peoria/);
  assert.match(m.text, /https:\/\/x\/c/);
});

test("confirm email: price and sale-day wording, HTML escaped", () => {
  const m = renderConfirmEmail({
    what: "on the cheapest eighth of flower at <Store & Co>",
    ask: "email me when the price drops",
    after: "one short email when it drops below $28.60 out the door.",
    confirmUrl: "https://x/c",
  });
  assert.equal(m.subject, "Confirm: email me when the price drops on the cheapest eighth of flower at <Store & Co>");
  assert.match(m.html, /Yes, email me when the price drops/);
  assert.match(m.html, /&lt;Store &amp; Co&gt;/);
  assert.doesNotMatch(m.html, /<Store & Co>/);
  assert.match(m.html, /\$28\.60 out the door/);
});

test("digest overrides for the one-off sale-day email", () => {
  const m = renderDigestEmail({
    sections: [{ heading: "Green Wednesday in Peoria", deals: [{ id: "1", title: "30% off flower", store: "A", city: "Peoria", save: "Save 30%", otd: null, href: "https://x/d/1" }], stopUrl: "https://x/s", stopLabel: "Stop" }],
    unsubscribeAllUrl: "https://x/u",
    dayLabel: "Wed, Nov 25",
    subject: "Green Wednesday: the best deals in Peoria this morning",
    title: "It's Green Wednesday.",
    lede: "The biggest everyday savings <today>.",
    why: "You asked us to email you the morning of Green Wednesday. This is the only one.",
  });
  assert.equal(m.subject, "Green Wednesday: the best deals in Peoria this morning");
  assert.match(m.html, /It's Green Wednesday\.|It&#39;s Green Wednesday\./);
  assert.match(m.html, /&lt;today&gt;/);
  assert.match(m.html, /This is the only one\./);
  assert.doesNotMatch(m.html, /since yesterday morning/);
});

test("digest defaults are unchanged", () => {
  const m = renderDigestEmail({
    sections: [{ heading: "New in Peoria", deals: [{ id: "1", title: "30% off flower", store: "A", city: "Peoria", save: null, otd: null, href: "h" }], stopUrl: "s", stopLabel: "Stop" }],
    unsubscribeAllUrl: "u",
    dayLabel: "Sun, Sep 27",
  });
  assert.equal(m.subject, "New at A: 30% off flower");
  assert.match(m.html, /Posted on the store's own site since yesterday morning\./);
});

test("price-drop email: numbers, strike-through, one stop link per watch", () => {
  const drop = { item: "eighth of flower", store: "Store A", city: "Peoria", product: "Brand Blue 3.5g", was: "$32.00", now: "$28.60", shelf: "$22.00", checked: "Sun 7:12 AM", menuUrl: "https://store/menu", pageUrl: "https://x/p", stopUrl: "https://x/stop1" };
  const one = renderPriceDropEmail({ drops: [drop], unsubscribeAllUrl: "https://x/u", dayLabel: "Sun, Sep 27" });
  assert.equal(one.subject, "Price drop: the eighth of flower at Store A is now $28.60 out the door");
  assert.match(one.html, /line-through[^>]*>\$32\.00/);
  assert.match(one.text, /now \$28\.60 out the door \(was \$32\.00; \$22\.00 on the shelf \+ tax\)/);
  assert.match(one.html, /https:\/\/x\/stop1/);
  const two = renderPriceDropEmail({ drops: [drop, { ...drop, store: "Store B", stopUrl: "https://x/stop2" }], unsubscribeAllUrl: "u", dayLabel: "d" });
  assert.equal(two.subject, "2 prices you're watching dropped");
  assert.match(two.html, /stop2/);
});
