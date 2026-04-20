# Honest Savings Claim Copy — 2026-04-19

## Current state

`app/components/SavingsCallout.tsx` already does the right thing in code: it ties the dollar number to `cl:top-deal-resolved` event payload (the savings on the actual deal showing in the hero). The component intentionally hides the dollar number when it's not confident:

```tsx
// If we have no confident dollar number, don't make one up.
if (savings == null) {
  return (
    <p className="savings-callout">
      {city ? <><strong>{city}</strong> buyers use PuffPrice to find the best deal every trip.</>
            : <>Illinois cannabis buyers use PuffPrice to find the best deal every trip.</>}
    </p>
  );
}
```

When `savings` IS set, it renders:

> **Peoria** buyers save up to **$23 per trip** using PuffPrice

This is wired to whatever dollar number the *actual hero deal card* is showing. So in principle the number is honest — it's the savings on the deal the user can see immediately above the line.

## Why Matthew flagged it

Two reasons the line is misleading even when the number is "real":

1. **Plural ("buyers") implies aggregated data.** "Peoria buyers save up to $23 per trip" sounds like an aggregate stat over many real transactions. It isn't — it's the savings on the single best-currently-listed deal in Peoria. If the only Peoria deal in the system is a $5 first-time discount, the line would say "Peoria buyers save up to $5 per trip" which is technically true but reads as a comparative claim ("up to $5") with no statistical basis.

2. **The "$23" specifically is from a Chicago / non-Peoria deal in many sessions.** Because the location-resolution race lets the server-side initial seed flash before the client refetch lands, a Peoria user might briefly see "Peoria buyers save up to $23 per trip using PuffPrice" where the $23 is actually the savings on an Elgin or West Loop deal. Once the location bug from `location-bug-diagnostic-20260419.md` is fixed, this lessens — but the underlying language ("buyers save up to") still overclaims.

## Three replacement variants

### Variant 1 — Location-aware, deal-anchored (no aggregation claim)

For when there's a real deal showing and a real city detected:

> Best deal in **Peoria** right now saves **$23**.

For when there's a deal but no city:

> Best deal in Illinois right now saves **$23**.

For when there's no confident dollar (current "no fallback" path):

> Showing the best deal in Peoria right now.

This drops the "buyers save" framing entirely. It's a statement of fact about the deal on screen. No aggregation, no comparative claim. Most honest.

### Variant 2 — Statewide, real number with a real source

> Illinois shoppers saved **$2,840** across **56 active deals** this week.

Pulls from a real Supabase aggregate: `SUM(estimated_savings)` over deals updated in the last 7 days. Not personalized but not lying. Adds credibility to the statewide footprint.

Costs: requires a new query (~$0.001 in Supabase compute, cached 5 min) and a number that might be small in an off-week.

### Variant 3 — Aspirational, no number at all

> Never overpay. Every active deal in Illinois, in one place.

Removes the dollar specificity entirely. Frames the value prop as completeness ("every deal") rather than savings amount. Easiest to ship, doesn't break when data is thin, but loses the conversion-pull of a specific dollar number.

## Recommendation

**Variant 1.** It keeps the dollar number (which actually drives clicks per analytics conventional wisdom), keeps the city personalization (warmth), but reframes the claim from "buyers save" (aggregate, slippery) to "best deal saves" (specific, verifiable on the very next element below the line).

Code change is minimal — same component, same data flow, just rewrite the JSX in lines 41–72:

```tsx
// app/components/SavingsCallout.tsx — replace lines 40–72
if (savings == null) {
  return (
    <p className="savings-callout">
      {city
        ? <>Showing the best deal in <strong>{city}</strong> right now.</>
        : <>Showing the best active deal in Illinois right now.</>}
      {calloutStyles}
    </p>
  );
}

return (
  <p className="savings-callout">
    {city
      ? <>Best deal in <strong>{city}</strong> right now saves{" "}
         <strong className="savings-amt">${savings}</strong>.</>
      : <>Best deal in Illinois right now saves{" "}
         <strong className="savings-amt">${savings}</strong>.</>}
    {calloutStyles}
  </p>
);
```

Ship Variant 1 in this sprint. Revisit Variant 2 in a follow-up if we want a homepage credibility line ("$X saved this week, X deals tracked") sitting elsewhere on the page.

## Other places the same claim pattern may live

Grep turned up one more honest-claim risk:

- `app/upgrade/page.tsx:126` — testimonial: `"I saved $23 on my last order just from a Tuesday morning"`. This is a quoted testimonial, fine to leave if it's a real quote, but if it's placeholder copy mark it as such or remove. Out of scope for the SavingsCallout fix; flag for Matthew separately.
- `lib/dealScoring.ts:22–23` — code comment about "$23 per trip" as a reference target. Comment only; harmless but stale once Variant 1 ships. Update the comment in the same diff.
