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
  city: "Normal",
  state: "Illinois",
  slug: "normal",
  heroIntro: "Normal, home to Illinois State University with 55,000 residents, boasts the highest concentration of dispensaries in central Illinois with 7-8 locations. This college town's vibrant cannabis market reflects strong student and community demand.",
  stats: [
    { label: "Dispensaries", value: "~7-8" },
    { label: "Population", value: "~55K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Cannabis consumption on Illinois State University campus and in university housing is strictly prohibited and subject to disciplinary action. Public consumption throughout Normal is illegal; private residence consumption only for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Normal"),
  priceBlurb: "Flower in Normal ranges from $38-58 per eighth ounce with competitive pricing across the concentrated dispensary market. Concentrates and edibles vary by product type, with all transactions subject to 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Normal, IL?", answer: "Normal has an exceptional 7-8 licensed dispensaries, the highest concentration in central Illinois. This vibrant market offers extensive product selection, competitive pricing, and convenient locations throughout the community." },
    statewideOutOfStateFaq("Normal"),
    statewideHoursFaq("Normal"),
    statewideMedicalCardFaq("Normal"),
    { question: "Are there student discounts or loyalty programs in Normal?", answer: "Many Normal dispensaries offer student discounts and loyalty programs for repeat customers. Check with individual locations for specific promotions and any identification requirements for student pricing." },
    statewideOnlineOrderFaq("Normal"),
  ],
  relatedCities: relatedCities("normal"),
};
