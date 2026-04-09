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
  city: "Quincy",
  state: "Illinois",
  slug: "quincy",
  heroIntro:
    "Quincy, home to ~40,000 residents and perched on the Mississippi River, serves as western Illinois' premier cannabis hub. Its location near the Iowa and Missouri borders makes it a major destination for visitors from neighboring states where recreational cannabis remains illegal. The city's robust dispensary network and competitive pricing draw steady cross-border traffic.",
  stats: [
    { label: "Dispensaries", value: "~8" },
    { label: "Population", value: "~40K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Quincy and Adams County. Cannabis use is legal only in private residences. Visitors should respect local ordinances and consume only in appropriate private spaces.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Quincy"),
  priceBlurb:
    "Flower averages $40–55 per eighth, pre-rolls cost $15–22, edibles run $18–28, and concentrates typically range $45–70. Quincy's competitive pricing reflects its status as a regional cannabis hub.",
  faqs: [
    {
      question: "How many dispensaries are in Quincy?",
      answer:
        "Quincy has approximately 8 operational dispensaries, among the highest per-capita counts in Illinois. This robust retail presence reflects the city's role as a regional cannabis destination for residents of Adams County and cross-border visitors. The competition among dispensaries helps keep prices competitive and product selection diverse.",
    },
    {
      question: "Can Iowa and Missouri residents buy in Quincy?",
      answer:
        "Yes, out-of-state visitors from Iowa, Missouri, and neighboring states are welcome to purchase cannabis at Quincy dispensaries. Visitors need a valid government-issued photo ID proving they are 21 or older. Out-of-state purchasers can buy up to 15 grams of flower, 2.5 grams of concentrate, or 250 mg of THC in edible form per transaction.",
    },
    statewideOutOfStateFaq("Quincy"),
    statewideHoursFaq("Quincy"),
    statewideMedicalCardFaq("Quincy"),
    statewideOnlineOrderFaq("Quincy"),
  ],
  relatedCities: relatedCities("quincy"),
};
