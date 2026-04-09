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
  city: "Aurora",
  state: "Illinois",
  slug: "aurora",
  heroIntro:
    "Aurora, Illinois' second-largest city with a population of around 180,000, is significantly underserved when it comes to cannabis dispensaries—a major opportunity for both newcomers searching 'dispensary near me' and existing customers looking for expanded local options. Currently, only 1–3 licensed dispensaries operate in Aurora proper, forcing many residents to travel to nearby Naperville or western Chicago suburbs for broader product selection and competitive pricing. As demand continues to grow and local zoning timelines move forward, new dispensaries are in the pipeline to better serve Kane County's largest city.",
  stats: [
    { label: "Dispensaries", value: "1-3 (underserved)" },
    { label: "Population", value: "~180K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Aurora and throughout Kane County. Cannabis may only be consumed in private residences. This includes all parks, streets, vehicles, and public gatherings. Violations can result in significant fines and other legal penalties.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Aurora"),
  priceBlurb:
    "Aurora's pricing ranges from $45–65 per eighth for flower, $18–28 for pre-rolls, $22–32 for edibles, and $55–80 for concentrates. Because Aurora has fewer local dispensary options, some residents find better deals and wider product selection by traveling to nearby Naperville or Chicago's western suburbs. Add Illinois excise tax (20–35% depending on product type) to all purchases.",
  faqs: [
    {
      question: "How many dispensaries are in Aurora?",
      answer:
        "Aurora currently has only 1–3 licensed dispensaries, which is significantly low for a city of 180,000 residents. This shortage has made 'dispensaries near me' a highly competitive search term for local residents. Many Aurora customers travel to Naperville, Downers Grove, or other nearby suburbs to find a wider selection and more competitive pricing.",
    },
    {
      question: "Why are there so few dispensaries in Aurora?",
      answer:
        "Aurora's limited dispensary count is due to local zoning regulations, licensing timelines, and municipal approval processes that have moved more slowly than in neighboring suburbs. However, new locations are actively in development and approval pipelines as the city works to better serve its population. Once these new dispensaries open, residents should see significantly improved access and selection.",
    },
    {
      question: "Where can Aurora residents buy cannabis nearby?",
      answer:
        "If you can't find what you need locally, nearby Naperville is just a short drive away and has a robust selection of dispensaries. Western Chicago suburbs like Downers Grove and Hinsdale are also reasonable options. For the widest selection and most competitive pricing, many Aurora residents make the 30–40-minute drive to Chicago proper.",
    },
    statewideOutOfStateFaq("Aurora"),
    statewideHoursFaq("Aurora"),
    {
      question: "Can out-of-state visitors find cannabis in Aurora?",
      answer:
        "Yes, out-of-state visitors aged 21+ can purchase cannabis in Aurora with a valid photo ID, but the limited local dispensary count means you may want to plan ahead or check online inventory before visiting. If you're passing through, nearby Naperville offers more reliable selection and hours.",
    },
    statewideMedicalCardFaq("Aurora"),
    {
      question: "When will new dispensaries open in Aurora?",
      answer:
        "While specific opening timelines vary by location, several new dispensaries have been approved or are in the approval pipeline for Aurora. Contact the city's business development office or monitor local news for updates. Once these open, Aurora will be much better positioned to serve its large resident population.",
    },
    statewideOnlineOrderFaq("Aurora"),
  ],
  relatedCities: relatedCities("aurora"),
};
