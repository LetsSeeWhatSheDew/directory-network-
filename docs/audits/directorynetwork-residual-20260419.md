# DirectoryNetwork Brand Residual Sweep — 2026-04-19

Every file containing the literal string `Directory<span ...>Network</span>` (the rendered "DirectoryNetwork" wordmark from the pre-PuffPrice era) or related slug/comment references.

## Page-level brand text (visible to users)

These all render "DirectoryNetwork" on screen and need to be replaced with the PuffPrice wordmark.

| File | Line | Where |
|---|---|---|
| `app/cannabis/illinois/chicago/near-navy-pier/page.tsx` | 21, 28 | nav + footer |
| `app/cannabis/illinois/chicago/near-wrigley-field/page.tsx` | 21, 28 | nav + footer |
| `app/cannabis/illinois/chicago/near-ohare/page.tsx` | 21, 28 | nav + footer |
| `app/cannabis/illinois/chicago/near-magnificent-mile/page.tsx` | 21, 28 | nav + footer |
| `app/cannabis/illinois/laws/page.tsx` | 97, 198 | nav + footer |
| `app/cannabis/illinois/first-time-guide/page.tsx` | 135, 376 | nav + footer |
| `app/cannabis/illinois/page.tsx` | 143, 282 | nav + footer |
| `app/cannabis/illinois/[slug]/[intent]/page.tsx` | 37, 46 | nav + footer (this is the one Matthew saw via `/cannabis/illinois/{city}/open-now`) |
| `app/cannabis/illinois/[slug]/page.tsx` | 232, 373 | nav + footer |
| `app/cannabis/illinois/open-now/page.tsx` | 174, 260 | nav + footer ← **Matthew's screenshot 5** |
| `app/admin/page.jsx` | 194 | admin header (internal — low priority but should match) |
| `app/admin-login/page.tsx` | 32 | admin login (internal) |
| `app/l/[id]/page.tsx` | 888 | footer note "Illinois Cannabis Directory" — `Directory` text only, no `Network`, but stylistically inconsistent |
| `components/DirectoryLandingPage.tsx` | 329 | template/legacy component, may be unused — verify before editing |

**Pattern to replace:** Most use a CSS class like `nav-name`/`il-nav-name`/`on-nav-name` with `Directory<span className="*-nav-accent">Network</span>`. The PuffPrice equivalent is `puff<span style={{color:"#16a34a"}}>price</span>` — see `app/page.jsx:877` for the canonical homepage version.

## Code-only references (not user-visible but should clean up)

| File | Line | Issue |
|---|---|---|
| `app/api/leads/route.ts` | 133 | Hardcoded admin URL `https://directory-network-eta.vercel.app/admin` in lead notification email body. Should be `https://www.puffprice.com/admin` (or use `brand.url`). |
| `lib/sms.ts` | 6 | Comment references the old Vercel project name `directory-network-`. Cosmetic only. |

## Slug references in `cl:*` event names / sessionStorage keys

(NOT a brand bug — these are internal namespacing. Listed for completeness.)

- `cl_city`, `cl_city_src`, `cl_lat`, `cl_lng`, `cl_gps_declined` (sessionStorage)
- `cl:location-resolved`, `cl:top-deal-resolved` (window events)

These predate the rebrand. Renaming them to `pp_*` would require coordinated changes across `LocationAware.tsx`, `HeroDealCard.tsx`, `SavingsCallout.tsx`, `HomeDealCards.tsx` and a session-cookie migration for existing users. **Do not touch in this sprint.** If we do rename, do it as its own commit.

## Verification command for Code

After fixes:

```bash
grep -rn "DirectoryNetwork\|directoryNetwork\|directory-network" --include='*.ts' --include='*.tsx' --include='*.jsx' app/ components/ lib/
```

Should return zero hits *except* `lib/sms.ts:6` (comment, optional) — or zero if you also clean that comment.
