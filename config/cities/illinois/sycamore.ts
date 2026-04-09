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
  city: "Sycamore",
  state: "Illinois",
  slug: "sycamore",
  heroIntro: "Sycamore, a charming town in DeKalb County with approximately 18,000 residents, is experiencing growth in its cannabis market with a new dispensary opening in 2026. This small-town community offers a more intimate shopping experience while maintaining access to quality cannabis products.",
  stats: [
    { label: "Dispensaries", value: "~1" },
    { label: "Population", value: "~18K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Cannabis consumption is prohibited in public spaces, parks, and within 1,000 feet of schools in Sycamore. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Sycamore"),
  priceBlurb: "Flower typically ranges from $40-60 per eighth ounce in Sycamore dispensaries. Concentrate and edible prices vary based on potency and product type, with excise tax adding 20-35% to final costs.",
  faqs: [
    { question: "How many dispensaries are in Sycamore, IL?", answer: "Sycamore currently has one dispensary with another opening in 2026. As the town grows, additional locations may become available. It's worth checking online menus before visiting to ensure product availability." },
    statewideOutOfStateFaq("Sycamore"),
    statewideHoursFaq("Sycamore"),
    statewideMedicalCardFaq("Sycamore"),
    { question: "Is Sycamore's dispensary easy to access from surrounding areas?", answer: "Sycamore is conveniently located in DeKalb County near I-88, making it accessible from nearby communities. The new dispensary opening in 2026 should increase convenience for regional customers seeking quality cannabis." },
    statewideOnlineOrderFaq("Sycamore"),
  ],
  relatedCities: relatedCities("sycamore"),
};
