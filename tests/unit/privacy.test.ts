// Privacy promise regression test — run with `npm run test:unit`.
//
// The promise (/privacy, "Cookies and analytics"): our own counts store no
// IP address and no full browser details, nothing tied to a name, email or
// account, and anyone sending Do Not Track or Global Privacy Control is not
// counted at all. If this test fails, a change broke that promise.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildTrackRows,
  requestOptsOut,
  EVENT_METADATA_KEYS,
  EVENT_COLUMNS,
  CLICK_COLUMNS,
} from "../../lib/trackEvent";

const IP = "203.0.113.77";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1 FingerprintMarker/9.9";

function browserHeaders(extra: Record<string, string> = {}): Headers {
  return new Headers({
    "user-agent": UA,
    "x-forwarded-for": `${IP}, 10.0.0.1`,
    "x-real-ip": IP,
    "x-vercel-ip-city": "Peoria",
    "x-vercel-ip-latitude": "40.69",
    cookie: "pp_session=secret-cookie-value",
    "sec-fetch-site": "same-origin",
    host: "www.puffprice.com",
    origin: "https://www.puffprice.com",
    ...extra,
  });
}

const body = (o: Record<string, unknown>) => JSON.stringify(o);

const TAP = {
  type: "deal_tap",
  slug: "nuera-east-peoria",
  dealId: "123e4567-e89b-12d3-a456-426614174000",
  city: "East Peoria",
  vid: "3f1c2b8e-1111-4222-8333-944445555666",
  ref: "https://www.google.com/search?q=x",
  utm_source: "counter_card",
  utm_campaign: "fall",
  meta: { from: "home", email: "person@example.com", ip: IP },
  // Junk a buggy or hostile client might send; none of it may be stored.
  email: "person@example.com",
  ip: IP,
  userAgent: UA,
  name: "Pat Doe",
};

test("stored rows contain no IP, user-agent, cookie, email or name", () => {
  const rows = buildTrackRows(body(TAP), browserHeaders());
  assert.ok(rows, "a normal tap should be counted");
  const stored = JSON.stringify(rows);
  for (const needle of [IP, "203.0.113", "10.0.0.1", "FingerprintMarker", "Mozilla", "Safari", "secret-cookie-value", "person@example.com", "Pat Doe", "40.69"]) {
    assert.ok(!stored.includes(needle), `stored analytics row leaked: ${needle}`);
  }
  // Only the documented columns / metadata keys.
  assert.deepEqual(Object.keys(rows!.event).sort(), [...EVENT_COLUMNS].sort());
  for (const k of Object.keys(rows!.event.metadata)) {
    assert.ok((EVENT_METADATA_KEYS as readonly string[]).includes(k), `undocumented metadata key: ${k}`);
  }
  assert.ok(rows!.click);
  assert.deepEqual(Object.keys(rows!.click!).sort(), [...CLICK_COLUMNS].sort());
  assert.ok(["mobile", "desktop"].includes(rows!.click!.user_agent), "deal_clicks.user_agent must be a device class only");
  assert.equal(rows!.event.metadata.ref_host, "google.com", "referrer is reduced to a hostname");
});

test("Do Not Track (DNT: 1) → not counted", () => {
  assert.equal(buildTrackRows(body(TAP), browserHeaders({ dnt: "1" })), null);
  assert.equal(requestOptsOut(new Headers({ dnt: "1" })), true);
});

test("Global Privacy Control (Sec-GPC: 1) → not counted", () => {
  assert.equal(buildTrackRows(body(TAP), browserHeaders({ "sec-gpc": "1" })), null);
  assert.equal(requestOptsOut(new Headers({ "sec-gpc": "1" })), true);
});

test("no opt-out headers → counted; DNT: 0 is not an opt-out", () => {
  assert.equal(requestOptsOut(new Headers({})), false);
  assert.equal(requestOptsOut(new Headers({ dnt: "0" })), false);
  assert.ok(buildTrackRows(body(TAP), browserHeaders({ dnt: "0" })));
});

test("the /api/track route checks opt-out and uses the tested row builder", () => {
  // Guards against someone re-inlining the insert and skipping these checks.
  const src = readFileSync(join(__dirname, "../../app/api/track/route.ts"), "utf8");
  assert.match(src, /requestOptsOut\(req\.headers\)/);
  assert.match(src, /buildTrackRows\(/);
  assert.doesNotMatch(src, /\.get\(\s*["'](user-agent|x-forwarded-for|x-real-ip|cookie)["']/i, "track route must not read identity headers directly");
  assert.doesNotMatch(src, /insert\(\{/, "track route must insert only the rows buildTrackRows returns");
});

// ---- Browser helper (lib/track.ts) ----
const g = globalThis as Record<string, unknown>;
const saved = { window: g.window, navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"), fetch: g.fetch };

afterEach(() => {
  if (saved.window === undefined) delete g.window;
  else g.window = saved.window;
  if (saved.navigator) Object.defineProperty(globalThis, "navigator", saved.navigator);
  g.fetch = saved.fetch;
});

async function runClientTrack(nav: Record<string, unknown>, win: Record<string, unknown> = {}): Promise<number> {
  let sent = 0;
  g.window = win;
  Object.defineProperty(globalThis, "navigator", {
    value: { ...nav, sendBeacon: () => { sent++; return true; } },
    configurable: true,
  });
  g.fetch = async () => {
    sent++;
    return new Response(null, { status: 204 });
  };
  // Fresh module state per call isn't needed: the 2s repeat guard keys on
  // type|slug|deal, so each call uses a distinct slug.
  const { track } = await import("../../lib/track");
  track("store_view", { slug: `store-${Math.random().toString(36).slice(2, 8)}` });
  return sent;
}

test("browser helper sends nothing under GPC", async () => {
  assert.equal(await runClientTrack({ globalPrivacyControl: true }), 0);
});

test("browser helper sends nothing under DNT", async () => {
  assert.equal(await runClientTrack({ doNotTrack: "1" }), 0);
  assert.equal(await runClientTrack({}, { doNotTrack: "1" }), 0);
});

test("browser helper does send when there's no opt-out (control for the two tests above)", async () => {
  assert.equal(await runClientTrack({}), 1);
});
