// marketing/social/render-fixtures.mjs — renders every social template with
// the made-up fixture data into docs/screenshots/social/, plus a screenshot
// of the /social page. For design review; never for posting (every fixture
// image is stamped "Sample data · not live").
//
// /social stays password-protected in fixture mode too, so the script signs
// in through /api/admin-auth with a throwaway test password (the same value
// the server was started with) and first checks that the page is closed
// without it. The session cookie is a token derived from the password, so
// it has to come from a real sign-in.
//
//   npx next build
//   SOCIAL_FIXTURES=1 ADMIN_PASSWORD=local-test npx next start -p 3456 &
//   SOCIAL_TEST_PASSWORD=local-test node marketing/social/render-fixtures.mjs http://localhost:3456
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const base = process.argv[2] || "http://localhost:3456";
const password = process.env.SOCIAL_TEST_PASSWORD;
if (!password) throw new Error("Set SOCIAL_TEST_PASSWORD to the ADMIN_PASSWORD the server was started with.");

// /social must be closed without the password, fixtures or not.
for (const cookie of [null, "dn_admin_auth=wrong-password"]) {
  const r = await fetch(`${base}/social`, { redirect: "manual", headers: cookie ? { cookie } : {} });
  if (![302, 303, 307, 308].includes(r.status) || !/\/admin-login/.test(r.headers.get("location") || "")) {
    throw new Error(`/social is reachable without the admin password (HTTP ${r.status}, cookie: ${cookie ? "wrong" : "none"})`);
  }
}
console.log("✓ /social is closed without the admin password");
const out = "docs/screenshots/social";
const templates = ["saving", "city", "index", "cheapest", "law", "drive-thru"];
await mkdir(out, { recursive: true });

for (const t of templates) {
  for (const size of ["feed", "story"]) {
    for (const theme of ["day", "night"]) {
      const r = await fetch(`${base}/og/social/${t}?size=${size}&theme=${theme}`);
      if (!r.ok) throw new Error(`${t} ${size} ${theme}: HTTP ${r.status}`);
      await writeFile(`${out}/${t}-${size}-${theme}.png`, Buffer.from(await r.arrayBuffer()));
      console.log("✓", t, size, theme);
    }
  }
}

const login = await fetch(`${base}/api/admin-auth`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
const session = (login.headers.get("set-cookie") || "").match(/dn_admin_auth=([^;]+)/)?.[1];
if (login.status !== 200 || !session) throw new Error(`Sign-in with SOCIAL_TEST_PASSWORD failed (HTTP ${login.status})`);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [name, width] of [["social-page-desktop", 1280], ["social-page-mobile", 390]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await page.context().addCookies([{ name: "dn_admin_auth", value: session, url: base }]);
  await page.goto(`${base}/social?theme=day`, { waitUntil: "networkidle" });
  // Load the lazy images before the full-page shot.
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll("img")) img.loading = "eager";
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width, height: width > 400 ? 2000 : 1700 } });
  console.log("✓", name);
  await page.close();
}
await browser.close();
