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
  city: "Carbondale",
  state: "Illinois",
  slug: "carbondale",
  heroIntro: "Carbondale, home to Southern Illinois University with about 22,000 residents, maintains a vibrant cannabis culture fueled by its college-town atmosphere. With 3-4 active dispensaries, the city offers diverse product selections and competitive pricing.",
  stats: [
    { label: "Dispensaries", value: "~3-4" },
    { label: "Population", value: "~22K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Carbondale, including parks, streets, and outdoor gathering spaces. Consumption within dormitories and university housing is strictly prohibited per SIU regulations." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Carbondale"),
  priceBlurb: "Flower prices in Carbondale range from $35-55 per eighth ounce, with concentrates and edibles varying based on product strength. Student discounts are sometimes available at local dispensaries, with total costs including 20-35% tax.",
  faqs: [
    { question: "How many dispensaries are in Carbondale, IL?", answer: "Carbondale has 3-4 licensed dispensaries serving the community and student population. Each location maintains detailed online menus, making it easy to browse inventory before your visit." },
    statewideOutOfStateFaq("Carbondale"),
    statewideHoursFaq("Carbondale"),
    statewideMedicalCardFaq("Carbondale"),
    { question: "Are there student discounts available at Carbondale dispensaries?", answer: "Many Carbondale dispensaries offer special pricing or loyalty programs for college students. Contact individual locations to confirm current discount programs and any documentation needed for verification." },
    statewideOnlineOrderFaq("Carbondale"),
  ],
  relatedCities: relatedCities("carbondale"),
};
