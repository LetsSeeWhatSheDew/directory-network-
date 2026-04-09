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
  city: "St. Louis",
  state: "Missouri",
  slug: "st-louis",

  heroIntro:
    "St. Louis is Missouri's largest cannabis market with over 30 licensed dispensaries spread across the city and surrounding areas. From The Grove's trendy retail corridor to South City's eclectic neighborhoods, the Gateway City offers some of the Midwest's most accessible and diverse cannabis retail. Whether you're a first-time buyer or an experienced consumer, St. Louis delivers competitive pricing, strong selection, and a welcoming dispensary culture.",

  stats: [
    { label: "Dispensaries", value: "30+" },
    { label: "Population", value: "~300K" },
    { label: "Rec & Medical", value: "Both available" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in St. Louis. Smoking or vaping is allowed only on private property where the owner consents. Landlords may restrict cannabis use in rental units. Cannabis lounges and social consumption venues are not yet permitted in the city.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("St. Louis"),

  priceBlurb:
    "Flower typically runs $35–$55 per eighth (3.5g) before tax. Pre-rolls range from $12–$22 each. Edibles start around $15 for a 100mg package. Concentrates (wax, resin, carts) fall in the $40–$70 range. Missouri's lower excise tax (6% state + local) means total costs are often 15–25% lower than neighboring Illinois, making St. Louis a competitive regional market.",

  faqs: [
    {
      question: "How many dispensaries are in St. Louis, Missouri?",
      answer:
        "St. Louis and the greater metro area are home to 30+ licensed dispensaries as of 2026. Options include both recreational and medical retailers, with strong clustering in The Grove, South City, Clayton, and suburban locations. St. Louis is Missouri's largest and most mature cannabis retail market.",
    },
    statewideOutOfStateFaq("St. Louis"),
    statewideHoursFaq("St. Louis"),
    statewideMedicalCardFaq("St. Louis"),
    {
      question: "What's the tax rate on cannabis in St. Louis?",
      answer:
        "Recreational cannabis in Missouri is subject to a 6% state excise tax plus St. Louis's local sales tax of 8.6% (combined state and local is 4.225% base). Medical cannabis is taxed at a reduced rate. The lower Missouri excise tax compared to Illinois makes St. Louis a budget-friendly market for cannabis shoppers.",
    },
    statewideOnlineOrderFaq("St. Louis"),
  ],

  relatedCities: relatedCities("st-louis"),
};
