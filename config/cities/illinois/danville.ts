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
  city: "Danville",
  state: "Illinois",
  slug: "danville",
  heroIntro:
    "Danville, with a population of ~30,000, sits on Illinois' eastern border with Indiana. Because Indiana has not legalized recreational cannabis, Danville attracts significant cross-border traffic from Hoosier residents seeking legal purchases. The city's strategic location and moderate dispensary count make it a key destination for Indiana visitors and a convenient option for eastern Illinois residents.",
  stats: [
    { label: "Dispensaries", value: "~3-4" },
    { label: "Population", value: "~30K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is illegal in Danville and throughout Vermilion County. Cannabis use is permitted only within private residences. Visitors should ensure they consume only in private spaces and comply with local ordinances.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Danville"),
  priceBlurb:
    "Flower averages $40–58 per eighth, pre-rolls run $15–25, edibles cost $18–28, and concentrates typically range $45–70. Pricing in Danville remains competitive with surrounding regions.",
  faqs: [
    {
      question: "Can Indiana residents buy cannabis in Danville?",
      answer:
        "Yes, Indiana residents are welcome to purchase cannabis at Danville dispensaries. Since Indiana has not legalized recreational cannabis, many Hoosiers travel the short distance to Danville for legal purchases. You will need a valid government-issued photo ID proving you are 21 or older, and you are limited to purchasing 15 grams of flower, 2.5 grams of concentrate, or 250 mg of THC in edible form per transaction as an out-of-state visitor.",
    },
    {
      question: "How far is Danville from Indiana?",
      answer:
        "Danville is located right on the Illinois-Indiana border, typically just 5 minutes by car from the state line. This close proximity has made Danville a go-to destination for Indiana residents seeking legal cannabis purchases. The short drive makes it convenient for both regular customers and one-time visitors from across Indiana.",
    },
    statewideOutOfStateFaq("Danville"),
    statewideHoursFaq("Danville"),
    statewideMedicalCardFaq("Danville"),
    statewideOnlineOrderFaq("Danville"),
  ],
  relatedCities: relatedCities("danville"),
};
