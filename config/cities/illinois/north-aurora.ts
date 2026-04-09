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
  city: "North Aurora",
  state: "Illinois",
  slug: "north-aurora",
  heroIntro: "North Aurora, a Kane County community with 18,000 residents, serves as a growing cannabis market with 1-2 dispensaries. The town's location near major highways makes it convenient for regional shoppers seeking quality products.",
  stats: [
    { label: "Dispensaries", value: "~1-2" },
    { label: "Population", value: "~18K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    { title: "Consumption Rules", body: "Cannabis consumption in public spaces is prohibited throughout North Aurora, including parks and commercial areas. Consumption is only legal in private residences for adults 21 and older." },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("North Aurora"),
  priceBlurb: "Flower in North Aurora ranges from $40-60 per eighth ounce at local dispensaries. Concentrates and edibles vary in price based on product potency and type, with total costs including 20-35% state excise tax.",
  faqs: [
    { question: "How many dispensaries are in North Aurora, IL?", answer: "North Aurora has 1-2 licensed dispensaries serving the local community and regional customers. As the market grows, additional locations may become available to better serve Kane County residents." },
    statewideOutOfStateFaq("North Aurora"),
    statewideHoursFaq("North Aurora"),
    statewideMedicalCardFaq("North Aurora"),
    { question: "Is North Aurora easily accessible from other Illinois cities?", answer: "North Aurora's convenient location in Kane County provides easy access via major highways. The town is positioned between Elgin and Aurora, making it a logical stop for western suburban cannabis shoppers." },
    statewideOnlineOrderFaq("North Aurora"),
  ],
  relatedCities: relatedCities("north-aurora"),
};
