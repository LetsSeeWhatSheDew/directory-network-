import type { CityConfig } from "@/components/CityPage";
import {
  relatedCities,
  PURCHASE_LIMITS_LAW,
  ID_REQUIREMENTS_LAW,
  DRIVING_LAW,
  firstTimerSteps,
  statewideOutOfStateFaq,
  statewideHoursFaq,
  statewideMedicalCardFaq,
  statewideOnlineOrderFaq,
} from "./shared";

export const CITY_CONFIG: CityConfig = {
  city: "Peoria",
  state: "Illinois",
  slug: "peoria",

  heroIntro:
    "Peoria is central Illinois\u2019s largest metro and a hub for licensed cannabis retail \u2014 with established operators like Ivy Hall, Beyond Hello, Aroma Hill, and the Trinity Dispensaries network. Adults 21 and older can buy recreationally with a government-issued ID; medical patients are welcome at every operator. Whether you\u2019re a first-time buyer or relocating to the area, this guide covers what you need to know.",

  stats: [
    // The "Dispensaries" value is overridden at render time with the
    // live count from master_listings. The fallback figure here is only
    // used if the live fetch returns zero rows (usually a transient
    // outage — see components/CityPage.tsx).
    { label: "Dispensaries", value: "\u2014" },
    { label: "Population", value: "~113K" },
    { label: "Rec & Medical", value: "Both available" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Peoria. Smoking or vaping cannabis is not allowed in any public space, park, sidewalk, or vehicle. Consumption is restricted to private residences \u2014 and landlords or property managers may still prohibit it. Cannabis-friendly lounges are not yet permitted in the Peoria area.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("Peoria"),

  priceBlurb:
    "Flower typically runs $40\u2013$65 per eighth (3.5g) before tax. Pre-rolls range from $15\u2013$25 each. Edibles start around $20 for a 100mg package. Concentrates (vape carts, wax, live resin) fall in the $50\u2013$80 range. Prices can vary significantly between dispensaries, so comparing menus online before your visit is worth the extra minute.",

  faqs: [
    {
      question: "How many dispensaries are in Peoria, IL?",
      answer:
        "The Peoria directory is listed in full above \u2014 every licensed adult-use dispensary currently operating in the city. Both recreational and medical retailers are available, including well-known brands like Ivy Hall, Beyond Hello, Aroma Hill, and the Trinity Dispensaries (Trinity on University and Trinity on Glen).",
    },
    statewideOutOfStateFaq("Peoria"),
    statewideHoursFaq("Peoria"),
    statewideMedicalCardFaq("Peoria"),
    {
      question: "What\u2019s the tax rate on cannabis in Peoria?",
      answer:
        "Recreational cannabis in Illinois is subject to state excise tax (10% for products with \u226435% THC, 20% for edibles/infused products, 25% for products with >35% THC), plus 6.25% state sales tax and a local municipal tax that Peoria sets at up to 3%. Medical cannabis is taxed at just 1% state excise tax.",
    },
    statewideOnlineOrderFaq("Peoria"),
  ],

  relatedCities: relatedCities("peoria"),
};
