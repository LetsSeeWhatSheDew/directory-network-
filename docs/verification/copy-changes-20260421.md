# Copy Change String-Level Verification — 2026-04-21

**Context:** Commit f5d4536 changed site copy (alerts pricing, "intelligence"→"finder" sweep, new search placeholder, logo header on all pages, removed A/B/C/D grades). This verifies each change is live on production by grepping the HTML.

## Method
- Fetched each page with `curl -s` and saved to `/tmp/puffprice-verify/`
- Grepped for expected / absent strings
- Investigated any unexpected result at the source code level

## Results

### Alerts page — Pro plan copy (`/alerts`)
| Check | Expected | Found | Pass |
|---|---|---|---|
| `"0.99/month. That's it"` | ≥1 | 1 | PASS |
| `"Deal alerts within minutes"` | ≥1 | 2 | PASS |
| `"15 min before public"` | 0 (removed) | 0 | PASS |

Context snippet: `<p class="tier-anchor"><strong>$0.99/month. That's it.</strong></p>` — new copy is live.

### "Intelligence" → "finder" sweep
| Check | Expected | Found | Pass |
|---|---|---|---|
| `/` contains "deal intelligence" | 0 | 0 | PASS |
| `/about` contains "deal intelligence" | 0 | 0 | PASS |
| `/` contains "deal finder" OR "deal tracker" OR "cannabis deals" | ≥1 | 2 | PASS |

Context: homepage meta description now reads `"Illinois cannabis deal finder. Find dispensary deals near you…"`. Stale "intelligence" phrasing fully removed.

### Search placeholder (3-way city / dispensary / product)
| Check | Expected | Found | Pass |
|---|---|---|---|
| `/search` contains "Search by city, dispensary, or product" | ≥1 | 2 | PASS |
| `/deals/all` contains same placeholder | N/A | 0 | N/A |

**Correction to task spec:** the 3-way search input lives on `/search` ([app/search/page.tsx:228](app/search/page.tsx:228)), not `/deals/all`. `/deals/all` is a filterable category list page, not a search input page. Verified the string is live on the correct route.

### Logo header presence (`<Logo />` component renders `/logo-512.png` via next/image)
| Page | Logo alt="PuffPrice" | Pass |
|---|---|---|
| `/` | 2 | PASS |
| `/alerts` | 1 | PASS |
| `/about` | 1 | PASS |
| `/l/nuera-east-peoria` | 0 | EXPECTED — page doesn't import Logo |

Listing page `/l/[id]` uses its own `dn-nav` nav (app/l/[id]/page.tsx:597) rather than the shared Logo component. This is an architectural pattern, not a regression from this commit. Flagging as a potential Code follow-up if Matthew wants consistent header branding on listing pages.

Because next/image rewrites `/logo-512.png` to `/_next/image?url=…`, the raw literal `/logo.png` will not appear in HTML even though the Logo asset is correctly wired. I grepped `logo-512|_next/image.*logo` and `alt="PuffPrice"` instead to verify.

### Letter grade A/B/C/D absence on deals pages
| Check | Expected | Found | Pass |
|---|---|---|---|
| `/deals/flower` `">[ABCD]<"` badges | 0 | 0 | PASS |
| `/deals/flower` `grade-[abcd]` or `LetterGrade` tokens | 0 | 0 | PASS |

DealBadge component replacement is clean — no stragglers.

## Verdict
**PASS — all copy changes from commit f5d4536 render correctly on production.**

Two notes:
1. **Task-spec correction:** the 3-way search placeholder belongs to `/search`, not `/deals/all`. Verified on correct route.
2. **Follow-up opportunity (non-blocking):** `/l/[id]` listing page does not use the shared `<Logo />` component. If Matthew wants consistent PuffPrice wordmark in the header across all pages, a Code patch would replace the inline `dn-nav` on [app/l/[id]/page.tsx:597](app/l/[id]/page.tsx:597) with the Logo component. Not a regression — this page never used Logo.
