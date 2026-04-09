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
  city: "Marion",
  state: "Illinois",
  slug: "marion",
  heroIntro:
    "Marion is Southern Illinois' hub for cannabis retail, serving not just its ~18K residents but the broader region including SIU Carbondale's 21K students and nearby Shawnee National Forest visitors. Located in Williamson County with 4–6 dispensaries, Marion offers some of the state's most competitive pricing on flower, edibles, and concentrates.",
  stats: [
    { label: "Population", value: "~18,000" },
    { label: "Dispensaries", value: "~4–6" },
    { label: "County", value: "Williamson" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Marion and Williamson County, which follows state rules allowing consumption only in private residences. SIU Carbondale's campus is smoke-free under federal rules, so consumption is not permitted there even for registered patients. Consuming cannabis in parks, streets, vehicles, or public spaces carries penalties.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Marion"),
  priceBlurb:
    "Marion flower averages $40–55 per eighth, with pre-rolls at $15–22, edibles at $18–28, and concentrates at $45–70. Among the lowest prices in Illinois, Marion's competitive pricing reflects its regional hub status and active local market.",
  faqs: [
    statewideOutOfStateFaq("Marion"),
    statewideHoursFaq("Marion"),
    statewideMedicalCardFaq("Marion"),
    statewideOnlineOrderFaq("Marion"),
    {
      question: "How many dispensaries are near Marion?",
      answer:
        "There are approximately 4–6 dispensaries serving the Marion and Carbondale area, making it a manageable number to explore for the best selection or prices. This regional hub serves not just Marion's residents but also the nearby SIU Carbondale campus population and visitors to Shawnee National Forest. The available dispensaries are well-stocked and competitive, making Marion an efficient shopping destination for Southern Illinois.",
    },
    {
      question: "Is Marion close to SIU?",
      answer:
        "Yes, Marion is about 15 minutes from SIU Carbondale's campus, making it a convenient destination for the university's ~21K students and staff. Many SIU affiliates make the short drive to Marion's dispensaries, though remember that the campus itself is smoke-free under federal rules. The proximity to both the campus and natural attractions like Shawnee National Forest makes Marion a key retail hub for the broader Southern Illinois region.",
    },
  ],
  relatedCities: relatedCities("marion"),
};
