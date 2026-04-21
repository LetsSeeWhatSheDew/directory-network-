# Social Handle Availability — 2026-04-21 (evening re-check)

**Context:** Re-verify that `@puffprice` on Instagram and YouTube is still available (no one squatted since this morning), and re-confirm TikTok is still held by Jamie.

**Method:** HTTP fetch with a realistic Mozilla user agent, then pattern-match against the response body + title tag + status code. Tested against known-taken + known-nonexistent handles as controls.

## Results

| Platform | URL | Status | Signal | Verdict |
|---|---|---|---|---|
| Instagram | `instagram.com/puffprice/` | 200 | `<title>Instagram</title>` (generic; matches nonexistent-handle control, not the taken-handle `<title>Instagram (@user) • Instagram photos and videos</title>` pattern) | **AVAILABLE** |
| YouTube | `youtube.com/@puffprice` | **404** | `<title>404 Not Found</title>` | **AVAILABLE** |
| TikTok | `tiktok.com/@puffprice` | 200 | Embedded user JSON: `"uniqueId":"puffprice", "nickname":"Jamie", "signature":""` | **STILL SQUATTED (by Jamie)** |

## Signal-validation detail
Instagram returns HTTP 200 for both taken and nonexistent handles — the status alone is not discriminating. I compared three fetches:
- `@instagram` (known taken): `<title>Instagram (@instagram) • Instagram photos and videos</title>`
- `@this_handle_does_not_exist_9999xyzxx` (nonexistent control): `<title>Instagram</title>`
- `@puffprice` (subject): `<title>Instagram</title>`

Subject matches the nonexistent pattern — definitively AVAILABLE.

For TikTok, "Couldn't find this account" string appears in the response — but it's part of i18n localization bundles, NOT the active account state. The actual `uniqueId:puffprice, nickname:Jamie` fields in the embedded JSON confirm the handle is taken by user Jamie with an empty bio.

## Change vs. this morning
No changes since the morning baseline:
- Instagram AVAILABLE → still AVAILABLE
- YouTube AVAILABLE → still AVAILABLE
- TikTok SQUATTED (Jamie) → still SQUATTED (Jamie)

No URGENT flags. Instagram and YouTube still claimable.

## Recommendation
Claim Instagram `@puffprice` and YouTube `@puffprice` as soon as Matthew is ready. TikTok `@puffprice` remains blocked; fallback options (`@puffpriceil`, `@puffprice_il`, `@getpuffprice`) should be considered.
