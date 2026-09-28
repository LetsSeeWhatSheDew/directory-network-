// tests/e2e/a11y.spec.ts
// =============================================================================
// Accessibility: axe-core (WCAG 2.0/2.1 A + AA rules) on every route the smoke
// suite visits. The day theme is checked at 390px and the night theme at
// 1440px (?daypart= forces it), so both palettes get a contrast pass.
// Reduced motion is on so nothing is measured mid-animation.
//
// Violations in A11Y_KNOWN (tests/e2e/a11y-known.ts) are tolerated with an
// owner and a reason. The list only shrinks: an entry that stops matching
// fails the test until it's removed.
// =============================================================================
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { smokeUrls, FIXTURE_ONLY } from "./routes";
import { A11Y_KNOWN } from "./a11y-known";

const LIVE = !!process.env.BASE_URL;
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function withDaypart(url: string, daypart: "day" | "night") {
  const u = new URL(url, "http://x");
  u.searchParams.set("daypart", daypart);
  return u.pathname + u.search;
}

for (const url of smokeUrls()) {
  test(`a11y ${url}`, async ({ page }, info) => {
    test.skip(LIVE && FIXTURE_ONLY.has(url), "fixture-only sample");
    const daypart = info.project.name === "mobile-390" ? "day" : "night";
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Keep third parties off the network, as in the smoke suite.
    await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) =>
      r.request().resourceType() === "image" ? r.fulfill({ status: 204 }) : r.fulfill({ status: 200, body: "" })
    );
    const res = await page.goto(withDaypart(url, daypart), { waitUntil: "load" });
    expect(res?.status(), url).toBe(200);
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

    const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("iframe").analyze();
    const found = results.violations.flatMap((v) =>
      v.nodes.map((n) => ({ rule: v.id, impact: v.impact, target: n.target.join(" "), summary: (n.failureSummary || "").split("\n").slice(0, 2).join(" ").slice(0, 220) }))
    );
    const known = A11Y_KNOWN.filter((k) => k.pages.includes(url) && (!k.dayparts || k.dayparts.includes(daypart)));
    const matches = (k: (typeof known)[number], f: (typeof found)[number]) => k.rule === f.rule && (!k.target || k.target.test(f.target));
    const fresh = found.filter((f) => !known.some((k) => matches(k, f)));
    const fixed = known.filter((k) => !found.some((f) => matches(k, f)));
    info.annotations.push({ type: "a11y", description: JSON.stringify({ url, daypart, found }) });
    expect(
      fresh.map((f) => `${f.rule} (${f.impact}) ${f.target} — ${f.summary}`),
      `${url} [${daypart}] — fix these, or add to tests/e2e/a11y-known.ts with an owner and reason`
    ).toEqual([]);
    expect(
      fixed.map((k) => `${k.rule} on ${url}`),
      `${url} [${daypart}] — fixed: remove from tests/e2e/a11y-known.ts`
    ).toEqual([]);
  });
}
