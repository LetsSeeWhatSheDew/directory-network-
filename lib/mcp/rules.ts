// lib/mcp/rules.ts — Illinois cannabis rules for the MCP tool
// `illinois_cannabis_rules`.
//
// Nothing here is new writing. Every answer is condensed or quoted from a page
// PuffPrice already publishes, and carries that page's URL and the date its
// facts were last checked. If a page changes, change the matching entry here
// (or better, move the shared text into a lib constant both import).
//
// Sources, by topic (file → published URL):
//   possession  app/cannabis/illinois/laws/page.tsx (FAQ + limits table),
//               app/guides/buying-cannabis-in-illinois-as-an-out-of-state-visitor
//   driving     app/guides/cannabis-and-driving-illinois (quick answer + FAQ)
//   delivery    app/illinois-cannabis-delivery (FAQ, LAST_CHECKED Sept 23, 2026)
//   drive_thru  app/drive-thru (FAQ, LAST_CHECKED Sept 23, 2026)
//   hemp        app/illinois-hemp-law (timeline + FAQ)
//   medical     app/guides/illinois-medical-cannabis-card-2026, app/medical
//   tax         app/illinois-cannabis-tax + lib/taxRates.ts
import { brand } from "../brand";
import { FACTS_VERIFIED } from "../guides";
import { STATE_EXCISE_RATES, STATE_SALES_TAX, TAX_RATES_LAST_UPDATED } from "../taxRates";

export const RULE_TOPICS = ["possession", "driving", "delivery", "drive_thru", "hemp", "medical", "tax"] as const;
export type RuleTopic = (typeof RULE_TOPICS)[number];

export type Rule = {
  topic: RuleTopic;
  question: string;
  answer: string;
  points: string[];
  /** ISO date the facts on the source page were last checked. */
  checked: string;
  source_url: string;
  also_see: string[];
  primary_sources: string[];
};

const u = brand.url;
const pct = (n: number) => `${Math.round(n * 10000) / 100}%`;

export const RULES: Record<RuleTopic, Rule> = {
  possession: {
    topic: "possession",
    question: "How much cannabis can you possess in Illinois?",
    answer:
      "Since June 12, 2026 (SB 3222), Illinois residents 21+ may possess up to 60 grams of cannabis flower, 1,000 milligrams of THC in cannabis-infused products, and 10 grams of cannabis concentrate. Non-residents are limited to half those amounts (30 g, 500 mg, 5 g).",
    points: [
      "Adults 21 and older can buy from any licensed Illinois dispensary with a valid, unexpired government photo ID. No medical card required.",
      "Visitor limits before June 12, 2026 were half of today's (15 g, 2.5 g, 250 mg). The law says the limits are cumulative.",
      "Using cannabis in any public place or in any motor vehicle is banned.",
      "Illinois law only protects you in Illinois; taking cannabis across a state line is not protected.",
    ],
    checked: FACTS_VERIFIED,
    source_url: `${u}/cannabis/illinois/laws`,
    also_see: [`${u}/guides/buying-cannabis-in-illinois-as-an-out-of-state-visitor`],
    primary_sources: ["410 ILCS 705/10-10, as amended by Public Act 104-0463 (SB 3222), effective June 12, 2026"],
  },
  driving: {
    topic: "driving",
    question: "Can you drive with cannabis in the car in Illinois?",
    answer:
      "You can drive with cannabis in the car in Illinois if it's in a secured, sealed or resealable, odor-proof, child-resistant container kept out of reach. Since June 12, 2026, the out-of-reach part doesn't apply when it's still sealed in the dispensary's original packaging. Nobody may use cannabis in a vehicle, and driving with 5 ng/mL or more of THC in whole blood (10 ng/mL in other bodily substances) within 2 hours of driving, or while impaired, is DUI.",
    points: [
      "An opened package, or anything outside its original packaging, still needs to be out of reach. The trunk is still the safest place.",
      "Passengers may not use cannabis in a vehicle either. Breaking the Vehicle Code's container rules, or a driver using cannabis in the vehicle, is a Class A misdemeanor.",
      "A first DUI is a Class A misdemeanor. The 5 ng/mL blood rule does not apply to a registered medical patient unless they are impaired; driving while impaired is still a DUI.",
      "People v. Redmond (Sept 19, 2024): the smell of burnt cannabis alone is not enough for a warrantless car search. People v. Molina (Dec 5, 2024): the smell of raw cannabis alone is enough.",
    ],
    checked: FACTS_VERIFIED,
    source_url: `${u}/guides/cannabis-and-driving-illinois`,
    also_see: [`${u}/cannabis/illinois/laws`],
    primary_sources: ["625 ILCS 5/11-502.15", "410 ILCS 705/15-85(e)", "625 ILCS 5/11-501(a)(7), 11-501.2"],
  },
  delivery: {
    topic: "delivery",
    question: "Is cannabis delivery legal in Illinois?",
    answer:
      "No. As of Sept 23, 2026, neither recreational nor medical cannabis delivery is legal in Illinois. The main delivery bill (HB2557) died in committee in 2026.",
    points: [
      "You can order ahead online and pick up in store, curbside, or (where approved) at a drive-thru window. You can't have it delivered to your door.",
      "No delivery bill is moving right now. Any change would need a new bill passed by the General Assembly and signed by the Governor, then state rules and licenses.",
    ],
    checked: "2026-09-23",
    source_url: `${u}/illinois-cannabis-delivery`,
    also_see: [`${u}/ways-to-buy`],
    primary_sources: ["HB2557 (104th General Assembly)"],
  },
  drive_thru: {
    topic: "drive_thru",
    question: "Are cannabis drive-thrus legal in Illinois?",
    answer:
      "Yes. SB 3222, signed June 12, 2026, allows dispensaries to serve customers through a drive-through once IDFPR reviews and approves the store's setup. As of Sept 23, 2026, none of the Central Illinois stores PuffPrice tracks has opened one.",
    points: [
      "At the Illinois drive-thrus open so far, you order online first and pick up at the window, where staff check your ID.",
      "PuffPrice's drive-thru page lists the first Central Illinois one the day it opens. For the live per-store status call list_dispensaries (ways_to_buy.drive_thru).",
    ],
    checked: "2026-09-23",
    source_url: `${u}/drive-thru`,
    also_see: [`${u}/ways-to-buy`],
    primary_sources: ["Public Act 104-0463 (SB 3222)"],
  },
  hemp: {
    topic: "hemp",
    question: "What changes for delta-8 and hemp THC in Illinois?",
    answer:
      "From Nov 12, 2026, Illinois' Hemp Act caps finished hemp products at 0.4 mg of total THC per container and counts delta-8, delta-10, HHC, THCP and THC-O toward that cap, which takes most intoxicating hemp products off gas-station and smoke-shop shelves.",
    points: [
      "Synthetic and semi-synthetic cannabinoids are prohibited.",
      "The 21-and-over rule for hemp THC products took effect immediately when SB 3222 was signed in June 2026.",
      "After Nov 12, licensed dispensaries are where to buy THC products in Central Illinois.",
    ],
    checked: FACTS_VERIFIED,
    source_url: `${u}/illinois-hemp-law`,
    also_see: [`${u}/deals/edibles`],
    primary_sources: ["Illinois Hemp Act (enacted with SB 3222, June 12, 2026)"],
  },
  medical: {
    topic: "medical",
    question: "How does medical cannabis work in Illinois in 2026?",
    answer:
      "Registered patients don't pay the Cannabis Purchaser Excise Tax (10% to 25% for everyone else), and medical cannabis is excluded from city and county cannabis taxes; it's taxed at the 1% state rate, according to the Illinois Department of Revenue. Since Sept 10, 2026, any Illinois dispensary can add medical sales.",
    points: [
      "To get a card: see a certifying health care professional (physician, APRN or physician assistant) who certifies a qualifying condition, then apply online through IDPH within 90 days and pay the fee. A complete application gives you a provisional registration you can use at a dispensary while IDPH decides.",
      "IDPH fees: $50 for 1 year, $100 for 2 years, $125 for 3 years (reduced: $25 / $50 / $75). Designated caregiver: $25 / $50 / $75.",
      "IDPH lists more than 50 debilitating conditions, including cancer, chronic pain, PTSD, fibromyalgia, multiple sclerosis and seizures. There's also an Opioid Alternative Patient Program for adults 21 and over.",
      "An 'adequate medical supply' is 2.5 ounces of usable cannabis over 14 days; a certifying professional can support a waiver for more.",
      "For which Central Illinois stores confirm medical sales on their own site, call list_dispensaries (ways_to_buy.medical) or see the medical page.",
    ],
    checked: FACTS_VERIFIED,
    source_url: `${u}/guides/illinois-medical-cannabis-card-2026`,
    also_see: [`${u}/medical`],
    primary_sources: ["Illinois Department of Public Health (IDPH) Medical Cannabis Program", "Illinois Department of Revenue"],
  },
  tax: {
    topic: "tax",
    question: "How is recreational cannabis taxed in Illinois?",
    answer: `The Cannabis Purchaser Excise Tax applies to the shelf price: ${pct(STATE_EXCISE_RATES.flower)} on flower and pre-rolls with 35% THC or less, ${pct(STATE_EXCISE_RATES.edible)} on cannabis-infused products (edibles, tinctures, drinks, topicals), and ${pct(STATE_EXCISE_RATES.concentrate)} on cannabis with more than 35% THC (concentrates, most vape carts, high-potency flower). Then the ${pct(STATE_SALES_TAX)} state sales tax, local sales tax, and county and municipal cannabis taxes all apply to the shelf price plus the excise, so the excise gets taxed too.`,
    points: [
      "County and municipal cannabis retailers' occupation taxes are up to 3% each; every dispensary-active Central Illinois city and its county charge the full 3%, a combined 6%.",
      "Local general sales tax on top of the state 6.25% runs 2.75% to 3.50% across the nine Central Illinois cities with dispensaries.",
      "Medical patients with a registry card pay the 1% state rate instead (see topic 'medical').",
      "For an exact out-the-door price in a given city, call out_the_door_price.",
    ],
    checked: TAX_RATES_LAST_UPDATED,
    source_url: `${u}/illinois-cannabis-tax`,
    also_see: [`${u}/illinois-cannabis-tax-calculator`, `${u}/out-the-door`],
    primary_sources: ["https://tax.illinois.gov/research/taxinformation/other/cannabis-taxes.html"],
  },
};
