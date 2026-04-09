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
  city: "Mundelein",
  state: "Illinois",
  slug: "mundelein",
  heroIntro: "Mundelein, a Lake County community with 32,000 residents, offers convenient cannabis access with 2-3 dispensaries serving the northern suburban region. The town's location between Chicago and Wisconsin makes it attractive for regional shoppers.",
  stats: [
    { label: "Dispensaries", value: "~2-3" },
    { label: "Population", value: "~32K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Mundelein, including parks and commercial spaces. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Mundelein"),
  priceBlurb: "Mundelein dispensaries offer flower at $40-60 per eighth ounce with competitive regional pricing. Concentrates and edibles vary based on potency, with all purchases subject to 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Mundelein, IL?", answer: "Mundelein has 2-3 licensed dispensaries providing accessible cannabis retail throughout the community. Each location typically offers online ordering and convenient parking for shoppers." },
    statewideOutOfStateFaq("Mundelein"),
    statewideHoursFaq("Mundelein"),
    statewideMedicalCardFaq("Mundelein"),
    { question: "Why is Mundelein popular for cross-border shoppers?", answer: "Mundelein's Lake County location positions it conveniently between Chicago and the Wisconsin border. The town serves as an accessible destination for northern Illinois and Wisconsin residents seeking legal cannabis purchases." },
    statewideOnlineOrderFaq("Mundelein"),
  ],
  relatedCities: relatedCities("mundelein"),
};
