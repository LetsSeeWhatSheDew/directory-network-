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
    "Peoria is central Illinois\u2019s largest metro and a growing hub for licensed cannabis retail. With roughly 10 dispensaries serving the city and surrounding Peoria County, visitors and residents have solid access to both recreational and medical options \u2014 from established chains like Ivy Hall and Aroma Hill to newer independent operators. Whether you\u2019re a first-time buyer or a seasoned consumer relocating to the area, this guide covers everything you need to know.",

  stats: [
    { label: "Dispensaries", value: "~10" },
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
        "Peoria and the surrounding metro area are home to approximately 10 licensed dispensaries as of 2026. Options include both recreational and medical retailers, with several well-known chains like Ivy Hall and Aroma Hill operating in the area.",
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
