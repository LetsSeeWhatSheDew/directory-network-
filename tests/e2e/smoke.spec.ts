// tests/e2e/smoke.spec.ts
// =============================================================================
// Visits every page route in app/ (dynamic ones with real slugs from
// tests/e2e/routes.ts) at 390px and 1440px, and fails on:
//   - a non-200 response (after redirects)
//   - any console error or uncaught page error
//   - a missing <title>, meta description or canonical (indexable pages)
//   - horizontal scroll at 390px
//   - visible "NaN", "undefined", "$0.00" — or a row from another
//     master_listings tenant (fixture marker OTHER-TENANT)
// Plus: text routes (sitemap, robots, llms) render cleanly, and every URL in
// the sitemap answers 200 and isn't noindex.
//
// Third-party requests (analytics, maps, tiles) never leave the machine: they
// are answered locally with an empty body so tests stay offline and quiet.
// =============================================================================
import { test, expect, type Page, type Route } from "@playwright/test";
import { smokeUrls, missingSamples, FIXTURE_ONLY, KNOWN_ISSUES } from "./routes";

const SITE = "https://www.puffprice.com";
const LIVE = !!process.env.BASE_URL;
const PNG_1PX = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

/** Visible text that means a value didn't make it to the page. */
const BAD_TEXT: [RegExp, string][] = [
  [/\bNaN\b/, "NaN"],
  [/\bundefined\b/, "undefined"],
  [/\$0\.00\b/, "$0.00"],
  [/OTHER-TENANT/, "a non-PuffPrice master_listings row (missing project_tag='green' filter)"],
];

/** Disallow prefixes for "User-agent: *" in the app's own robots.txt. Pages
 *  under them aren't for search, so the description/canonical check skips them. */
let disallowed: Promise<string[]> | null = null;
function robotsDisallowed(base: string): Promise<string[]> {
  disallowed ??= fetch(new URL("/robots.txt", base))
    .then((r) => r.text())
    .then((txt) => {
      const out: string[] = [];
      let star = false;
      for (const line of txt.split("\n")) {
        const [k, ...v] = line.split(":");
        const val = v.join(":").trim();
        if (/^user-agent$/i.test(k.trim())) star = val === "*";
        else if (star && /^disallow$/i.test(k.trim()) && val) out.push(val);
      }
      return out;
    })
    .catch(() => []);
  return disallowed;
}

async function stubThirdParty(page: Page, base: string) {
  const own = new URL(base).host;
  await page.route("**/*", (route: Route) => {
    const u = new URL(route.request().url());
    if (u.host === own || u.protocol === "data:" || u.protocol === "blob:") return route.continue();
    const type = route.request().resourceType();
    if (type === "image") return route.fulfill({ status: 200, contentType: "image/png", body: PNG_1PX });
    if (type === "script") return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
    if (type === "stylesheet") return route.fulfill({ status: 200, contentType: "text/css", body: "" });
    if (type === "document") return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>stub</title>" });
    return route.fulfill({ status: 204, body: "" });
  });
}

test("every dynamic route has sample URLs in tests/e2e/routes.ts", () => {
  expect(missingSamples(), "add real sample URLs for these routes to DYNAMIC_SAMPLES").toEqual([]);
});

for (const url of smokeUrls()) {
  test(`page ${url}`, async ({ page, baseURL }, info) => {
    test.skip(LIVE && FIXTURE_ONLY.has(url), "fixture-only sample");
    const problems: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") problems.push(`console error: ${m.text().slice(0, 300)}`);
    });
    page.on("pageerror", (e) => problems.push(`page error: ${String(e.message || e).slice(0, 300)}`));
    await stubThirdParty(page, baseURL!);

    const res = await page.goto(url, { waitUntil: "load" });
    expect(res, `no response for ${url}`).not.toBeNull();
    expect(res!.status(), `${url} → ${page.url()} status`).toBe(200);
    // Give hydration and client effects a moment to report errors.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});

    // Read head tags directly: locators would auto-wait for tags that are
    // legitimately absent (no robots meta on an indexable page).
    const head = await page.evaluate(() => ({
      title: document.title,
      robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
      desc: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
    }));
    if (!head.title.trim()) problems.push("missing <title>");
    const indexable = !/noindex/i.test(head.robots);
    const finalPath = new URL(page.url()).pathname;
    const blocked = (await robotsDisallowed(baseURL!)).some((d) => finalPath.startsWith(d));
    if (indexable && !blocked) {
      if (!head.desc.trim()) problems.push("missing meta description");
      if (!head.canonical) problems.push("missing canonical");
      else if (!head.canonical.startsWith(SITE)) problems.push(`canonical not on ${SITE}: ${head.canonical}`);
    }

    const text = await page.evaluate(() => document.body?.innerText || "");
    for (const [re, label] of BAD_TEXT) {
      const m = text.match(re);
      if (m) {
        const i = m.index || 0;
        problems.push(`visible ${label}: "…${text.slice(Math.max(0, i - 60), i + 40).replace(/\s+/g, " ")}…"`);
      }
    }

    if (info.project.name === "mobile-390") {
      const overflow = await page.evaluate(() => {
        // globals.css clips html/body (overflow-x: clip) as a backstop, so
        // the page itself can never scroll sideways — anything too wide is
        // silently cut off instead. Lift the backstop while measuring so the
        // check sees what a visitor would lose.
        const style = document.createElement("style");
        style.textContent = "html,body{overflow-x:visible!important}";
        document.head.appendChild(style);
        const vw = document.documentElement.clientWidth;
        const sw = document.documentElement.scrollWidth;
        let wide: string[] = [];
        if (sw > vw + 1) {
          wide = [...document.querySelectorAll("body *")]
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ r }) => r.right > vw + 1 && r.width > 0)
            .sort((a, b) => b.r.right - a.r.right)
            .slice(0, 3)
            .map(({ el, r }) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""} (right edge ${Math.round(r.right)}px)`);
        }
        style.remove();
        return sw > vw + 1 ? { sw, vw, wide } : null;
      });
      if (overflow) problems.push(`horizontal overflow at 390px: content is ${overflow.sw}px wide in a ${overflow.vw}px viewport; widest: ${overflow.wide.join(", ") || "n/a"}`);
    }

    const known = KNOWN_ISSUES[url] || [];
    const isKnown = (p: string) => known.some((k) => p.startsWith(k));
    const fixed = known.filter((k) => !problems.some((p) => p.startsWith(k)));
    expect(problems.filter((p) => !isKnown(p)), `${url} (${info.project.name})`).toEqual([]);
    expect(fixed, `${url}: fixed — remove from KNOWN_ISSUES in tests/e2e/routes.ts`).toEqual([]);
  });
}

// Text routes: one pass is enough, not per viewport.
test.describe("text routes", () => {
  test.skip(({ isMobile }) => isMobile, "runs once, in the desktop project");

  for (const url of ["/sitemap.xml", "/robots.txt", "/llms.txt", "/llms-full.txt", "/manifest.webmanifest"]) {
    test(`text ${url}`, async ({ request }) => {
      const res = await request.get(url);
      expect(res.status(), url).toBe(200);
      const body = await res.text();
      expect(body.length, `${url} is empty`).toBeGreaterThan(20);
      for (const [re, label] of BAD_TEXT) expect(re.test(body), `${url} contains ${label}`).toBe(false);
    });
  }

  test("every sitemap URL answers 200 and is indexable", async ({ request, baseURL }) => {
    test.setTimeout(240_000);
    const xml = await (await request.get("/sitemap.xml")).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ""));
    expect(urls.length).toBeGreaterThan(20);
    const bad: string[] = [];
    for (let i = 0; i < urls.length; i += 8) {
      await Promise.all(
        urls.slice(i, i + 8).map(async (p) => {
          const res = await request.get(new URL(p || "/", baseURL).toString());
          if (res.status() !== 200) return bad.push(`${p} → ${res.status()}`);
          const html = await res.text();
          if (/<meta name="robots" content="[^"]*noindex/i.test(html)) bad.push(`${p} is in the sitemap but noindex`);
        })
      );
    }
    expect(bad).toEqual([]);
  });
});
