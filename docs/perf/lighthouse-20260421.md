# Lighthouse audit — 2026-04-21 early-AM

Run: mobile emulation (Lighthouse default), headless Chrome, production (`puffprice.com`).
Tool: `npx lighthouse` (v13.1.0).

## Scores

| Page | Perf | A11y | BP | SEO |
|---|---:|---:|---:|---:|
| `/` | **65** | 94 | 96 | 100 |
| `/cannabis/illinois` | 95 | 92 | 100 | 100 |
| `/l/nuera-east-peoria` | 90 | 95 | 100 | 100 |
| `/deals/flower` | 95 | 89 | 100 | 100 |

No category below 50. Homepage performance (65) is the only score under 90 — flagged loudly.

## Top opportunities

### `/` — perf 65 ⚠
1. **Avoid multiple page redirects (≈965ms)** — likely Vercel/www→apex or trailing-slash redirect chain. Investigate: is `https://puffprice.com` → `https://www.puffprice.com` → `https://puffprice.com/` triple-hopping? Single target redirect config would recover ≈1s of TTFB on cold loads.
2. **Reduce unused JavaScript (≈520ms)** — likely the HomeDealCards client bundle shipping unused logic paths (near/all mode, all 9 badge variants). Code-split by mode or tree-shake unused branches.
3. **Color-contrast failures (a11y)** — one or more foreground/background pairs under 4.5:1. Run Lighthouse locally against a dev build to get the specific nodes. Candidate: muted text (`#9ca3af`) on light-cream (`#f5f4f0`) backgrounds in meta/footer regions.

### `/cannabis/illinois` — perf 95 ✓
1. Avoid multiple page redirects (≈786ms) — same root cause as homepage.
2. Reduce unused JavaScript (≈160ms) — smaller but present.
3. Color-contrast — same category of muted-gray text failures.

### `/l/nuera-east-peoria` — perf 90 ✓
1. Avoid multiple page redirects (≈778ms).
2. Reduce unused JavaScript (≈150ms).
3. Color-contrast — check the Report Outdated link (`#6b7280` on `#f7f6f2` ≈ 4.8:1, should pass; likely other spots).

### `/deals/flower` — perf 95 ✓
1. Avoid multiple page redirects (≈778ms).
2. Reduce unused JavaScript (≈150ms).
3. Color-contrast — meta/footer muted-gray text.

## Notes for follow-up session (NOT tonight)

- **P0 — fix redirect chain.** Single action, ≈1s win on every cold visit across the site. Check Vercel project settings: domain redirects, trailing-slash config, any `next.config.redirects()` in play.
- **P1 — homepage perf drop vs. other pages.** `/` is 30pts behind `/cannabis/illinois` despite similar DB-bound surface. Hypothesis: PuffPriceIndexCard SSR + HomeDealCards hydration + nav all on the critical path. Worth a trace.
- **P2 — a11y color-contrast.** Matthew's brand audit uses `#6b7280` and `#9ca3af` for all secondary text. On light-cream backgrounds this is mostly fine, but a few spots may be borderline. Accept the fix as "bump muted text to `#4b5563` everywhere" — one CSS sweep, no design overhaul.
- **P3 — unused JS.** Real but smaller. Worth a bundle-analyzer pass.

## Raw JSON
Not committed. Re-run with `npx lighthouse <url> --output=json --output-path=/tmp/lh.json` to reproduce.
