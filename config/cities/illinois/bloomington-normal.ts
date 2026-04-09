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
  city: "Bloomington-Normal",
  state: "Illinois",
  slug: "bloomington-normal",
  heroIntro:
    "Bloomington-Normal is a cannabis hub at the I-55/I-74 crossroads, with the highest dispensary density in central Illinois. Whether you're passing through or a local, discover convenient access to recreational and medical cannabis, competitive pricing, and a thriving market shaped by travelers and students.",
  stats: [
    { label: "Dispensaries", value: "~10" },
    { label: "Population", value: "~133K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in both Bloomington and Normal. Illinois State University (ISU) campus is smoke- and vape-free. McLean County follows state regulations with no additional local restrictions. Private residences are the only legal consumption location. Students living on campus or in university-affiliated housing should review their housing agreements for additional policies.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Bloomington-Normal"),
  priceBlurb:
    "Flower ranges from $40–55 per eighth ounce, pre-rolls $15–22, edibles $18–28, and concentrates $45–70. The competitive dispensary cluster in Normal drives consumer-friendly pricing across the region. First-time customer discounts and loyalty programs are widely available, making Bloomington-Normal an excellent value market.",
  faqs: [
    {
      question: "How many dispensaries are in Bloomington-Normal?",
      answer:
        "Bloomington-Normal has approximately 10 licensed cannabis dispensaries, with most concentrated in Normal. This makes it one of the densest cannabis markets in central Illinois relative to population. The cluster developed partly due to Normal's strategic location at the I-55/I-74 interchange, attracting both local residents and travelers.",
    },
    {
      question: "Why are there so many dispensaries in Normal, IL?",
      answer:
        "Normal's outsized dispensary cluster stems from its location at the I-55/I-74 crossroads, which makes it a major hub for travelers heading to Chicago, St. Louis, and other regions. Combined with Illinois State University's 21,000-student population, the area attracts strong demand from both local consumers and out-of-state visitors. This concentration also creates competitive pricing benefits for consumers.",
    },
    {
      question: "Can I buy cannabis as an Illinois State University student?",
      answer:
        "Yes, if you are 21 or older with a valid photo ID, you can purchase cannabis at any Bloomington-Normal dispensary. ISU campus itself is a smoke-free zone, but off-campus dispensaries are readily accessible. Always check your rental lease or on-campus housing agreement for restrictions, as many residences prohibit cannabis use regardless of state legality.",
    },
    statewideOutOfStateFaq("Bloomington-Normal"),
    statewideHoursFaq("Bloomington-Normal"),
    statewideMedicalCardFaq("Bloomington-Normal"),
    {
      question: "Is Bloomington-Normal a good stop for travelers on I-55 or I-74?",
      answer:
        "Absolutely. Bloomington-Normal's 10 dispensaries make it an ideal stop for travelers driving between Chicago, St. Louis, and the coasts. Many dispensaries are located near the highway interchange with ample parking. Visit during business hours, bring a valid government-issued photo ID proving you are 21 or older, and be aware of purchase limits: Illinois residents can buy up to 30g of flower, while out-of-state visitors are limited to 15g.",
    },
    statewideOnlineOrderFaq("Bloomington-Normal"),
  ],
  relatedCities: relatedCities("bloomington-normal"),
};
