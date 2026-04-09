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
  city: "Morris",
  state: "Illinois",
  slug: "morris",
  heroIntro: "Morris, a Grundy County community with 15,000 residents positioned along the I-80 corridor, offers 2-3 dispensaries serving highway travelers and local customers. The town's central location makes it a convenient stop for cross-state shoppers.",
  stats: [
    { label: "Dispensaries", value: "~2-3" },
    { label: "Population", value: "~15K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Public consumption of cannabis is prohibited throughout Morris. Private residence consumption is permitted for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Morris"),
  priceBlurb: "Flower at Morris dispensaries ranges from $40-60 per eighth ounce with competitive pricing. Concentrates and edibles vary based on potency, with all costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in Morris, IL?", answer: "Morris has 2-3 licensed dispensaries strategically positioned for I-80 corridor convenience. These locations serve both residents and highway travelers seeking quality cannabis." },
    statewideOutOfStateFaq("Morris"),
    statewideHoursFaq("Morris"),
    statewideMedicalCardFaq("Morris"),
    { question: "Why is Morris popular with I-80 travelers?", answer: "Morris's location on the I-80 corridor between Chicago and the Quad Cities makes it an ideal stop for long-distance travelers. Dispensaries offer convenient access near highway exits for quick purchases." },
    statewideOnlineOrderFaq("Morris"),
  ],
  relatedCities: relatedCities("morris"),
};
