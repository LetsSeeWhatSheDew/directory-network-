// Known accessibility violations, tolerated so the axe check can gate every
// PR today. Each entry says where the fix belongs. The list only shrinks:
// an entry that no longer matches anything on its page fails the test
// until it's deleted (see a11y.spec.ts).
export type Daypart = "day" | "night";

export type KnownA11y = {
  rule: string;              // axe rule id, e.g. "color-contrast"
  target?: RegExp;           // matches the axe CSS target (default: any node)
  pages: string[];           // exact smoke URLs
  dayparts?: Daypart[];      // day = checked at 390px, night = at 1440px (default: both)
  owner: string;
  reason: string;
};

const PR10 = "PR #10 (motion + off-system sweep)";

export const A11Y_KNOWN: KnownA11y[] = [
  {
    rule: "color-contrast",
    pages: ["/cannabis/missouri", "/cannabis/missouri/st-louis"],
    owner: PR10,
    reason: "Legacy dark Tailwind sections inherit the Breathe ink color (#14231a on near-black). Out-of-scope Missouri pages built on components/CityPage.tsx, which #10 is sweeping.",
  },
  {
    rule: "link-in-text-block",
    pages: ["/deals/all", "/deals/flower", "/illinois-cannabis-tax-calculator"],
    dayparts: ["day"],
    owner: PR10,
    reason: "Inline links are only told apart from body text by color (1.41:1); they need an underline. Files are in #10's sweep.",
  },
  {
    rule: "link-in-text-block",
    pages: ["/upgrade/success"],
    owner: PR10,
    reason: "Same: the 'preferences' link needs an underline. File is in #10's sweep.",
  },
  {
    rule: "aria-command-name",
    pages: ["/map"],
    owner: PR10,
    reason: "Leaflet store pins are role=button with no accessible name; pass title/alt to L.marker in app/map/MapClient.tsx (in #10's sweep).",
  },
  {
    rule: "color-contrast",
    pages: ["/map"],
    dayparts: ["night"],
    owner: PR10,
    reason: "Leaflet attribution link at night (#9fb3a6 on #ced0cf). app/map/MapClient.tsx CSS, in #10's sweep.",
  },
  {
    rule: "color-contrast",
    pages: ["/lab/b"],
    owner: "Deal-card / motion work (design lab prototypes)",
    reason: "Throwaway deal-card prototype, disallowed in robots.txt; they don't follow the Breathe night palette.",
  },
];
