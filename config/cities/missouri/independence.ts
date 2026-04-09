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
  city: "Independence",
  state: "Missouri",
  slug: "independence",

  heroIntro:
    "Independence is a suburban Kansas City community with 5–6 licensed dispensaries serving the eastern metro area and drawing cross-border traffic from Kansas. Known for the Harry S. Truman Historic Site and strong community roots, Independence offers convenient cannabis retail access for suburban residents. The market reflects moderate competition and solid product availability at competitive regional pricing.",

  stats: [
    { label: "Dispensaries", value: "5–6" },
    { label: "Population", value: "~120K" },
    { label: "Rec & Medical", value: "Both available" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Independence. Use is limited to private residences where the owner permits it. Landlords in rental properties may restrict or prohibit cannabis entirely. No cannabis lounges or social consumption venues currently operate in Independence.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("Independence"),

  priceBlurb:
    "Flower typically costs $35–$60 per eighth (3.5g) before tax. Pre-rolls range from $12–$24 each. Edibles start around $15 for a 100mg package. Concentrates fall in the $40–$75 range. Independence's suburban location and proximity to Kansas City market dynamics keep pricing competitive with the broader KC metro area.",

  faqs: [
    {
      question: "How many dispensaries are in Independence, Missouri?",
      answer:
        "Independence is home to 5–6 licensed dispensaries as of 2026. Both recreational and medical retailers serve the suburban Kansas City community and surrounding areas. Independence serves as a convenient retail hub for eastern Kansas City metro residents and cross-border shoppers from Kansas.",
    },
    statewideOutOfStateFaq("Independence"),
    statewideHoursFaq("Independence"),
    statewideMedicalCardFaq("Independence"),
    {
      question: "What's the tax rate on cannabis in Independence?",
      answer:
        "Recreational cannabis is subject to Missouri's 6% state excise tax plus Independence's local sales tax. The combined rate remains competitive with Kansas City proper, making Independence an accessible option for metro residents seeking convenient suburban access.",
    },
    statewideOnlineOrderFaq("Independence"),
  ],

  relatedCities: relatedCities("independence"),
};
