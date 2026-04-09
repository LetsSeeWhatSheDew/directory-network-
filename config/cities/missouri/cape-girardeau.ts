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
  city: "Cape Girardeau",
  state: "Missouri",
  slug: "cape-girardeau",

  heroIntro:
    "Cape Girardeau is Southeast Missouri's cannabis retail hub with 3–4 licensed dispensaries serving the Mississippi River region. Located near the Illinois border, the city draws cross-border shoppers seeking lower prices than Illinois and local residents from surrounding rural areas. Cape Girardeau's strategic location and growing market make it an accessible gateway to Southeast Missouri's cannabis scene.",

  stats: [
    { label: "Dispensaries", value: "3–4" },
    { label: "Population", value: "~40K" },
    { label: "Rec & Medical", value: "Both available" },
  ],

  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Cape Girardeau. Use is limited to private residences where the property owner permits it. Landlords may restrict or prohibit cannabis entirely in rental units. No cannabis lounges or social consumption venues are currently authorized in the area.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],

  firstTimerSteps: firstTimerSteps("Cape Girardeau"),

  priceBlurb:
    "Flower typically costs $35–$55 per eighth (3.5g) before tax. Pre-rolls range from $12–$22 each. Edibles start around $15 for a 100mg package. Concentrates fall in the $40–$70 range. Cape Girardeau's proximity to Illinois and competitive Missouri pricing make it an attractive market for cross-border shoppers and Southeast Missouri residents.",

  faqs: [
    {
      question: "How many dispensaries are in Cape Girardeau, Missouri?",
      answer:
        "Cape Girardeau is home to 3–4 licensed dispensaries as of 2026. Both recreational and medical retailers serve the Southeast Missouri region, drawing customers from surrounding rural areas and Illinois seeking Missouri's lower prices and greater product selection compared to Illinois dispensaries.",
    },
    statewideOutOfStateFaq("Cape Girardeau"),
    statewideHoursFaq("Cape Girardeau"),
    statewideMedicalCardFaq("Cape Girardeau"),
    {
      question: "What's the tax rate on cannabis in Cape Girardeau?",
      answer:
        "Recreational cannabis is subject to Missouri's 6% state excise tax plus Cape Girardeau's local sales tax. Cape Girardeau's tax rates are substantially lower than Illinois, making it an attractive destination for cross-border shoppers from the St. Louis metro area and Southern Illinois seeking better pricing.",
    },
    statewideOnlineOrderFaq("Cape Girardeau"),
  ],

  relatedCities: relatedCities("cape-girardeau"),
};
