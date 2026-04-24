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
  city: "Champaign",
  state: "Illinois",
  slug: "champaign",
  heroIntro: "Champaign, home to the University of Illinois campus side with 88,000 residents, has licensed dispensaries serving students and the greater community. The city's college-town culture drives robust cannabis retail activity and product diversity.",
  stats: [
    // Value overridden at render time with live DB count (see CityPage).
    { label: "Dispensaries", value: "\u2014" },
    { label: "Population", value: "~88K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Cannabis use is prohibited on the University of Illinois campus and in university housing with strict enforcement. Public consumption throughout Champaign is illegal; private residence consumption only for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Champaign"),
  priceBlurb: "Flower pricing in Champaign ranges from $40-60 per eighth ounce across multiple competing dispensaries. Concentrates and edibles vary in price based on potency and product type, with all costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Champaign, IL?", answer: "Champaign has 5-6 licensed dispensaries throughout the community, providing excellent selection and competitive pricing. Each location maintains detailed online menus for convenient browsing before your visit." },
    statewideOutOfStateFaq("Champaign"),
    statewideHoursFaq("Champaign"),
    statewideMedicalCardFaq("Champaign"),
    { question: "What student discounts are available at Champaign dispensaries?", answer: "Many Champaign dispensaries offer student-specific discounts and loyalty programs. Contact individual locations to learn about current promotions and any documentation needed to verify student status." },
    statewideOnlineOrderFaq("Champaign"),
  ],
  relatedCities: relatedCities("champaign"),
};
