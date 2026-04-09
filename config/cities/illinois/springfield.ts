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
  city: "Springfield",
  state: "Illinois",
  slug: "springfield",
  heroIntro:
    "Springfield, Illinois' vibrant capital city, offers a growing cannabis market tailored to government workers, tourists, and residents from the surrounding rural communities. With a population of approximately 114,000, Springfield features 5–15 dispensaries providing both recreational and medical cannabis options. The city's strategic position as a state hub makes it an accessible destination for cannabis enthusiasts across central Illinois.",
  stats: [
    { label: "Dispensaries", value: "~5-15" },
    { label: "Population", value: "~114K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is strictly prohibited throughout Springfield, with particular enforcement around the Illinois State Capitol grounds and other government buildings. Cannabis is only permitted in private residences and private property with the owner's consent. Violations can result in significant fines and legal consequences.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Springfield"),
  priceBlurb:
    "Cannabis prices in Springfield are generally competitive with the statewide average and often slightly lower than Chicago prices. Expect to pay $40–60 per eighth for flower, $15–25 for pre-rolls, $20–30 for edibles, and $50–75 for concentrates. These prices reflect the city's position as a regional hub with moderate competition among local dispensaries.",
  faqs: [
    {
      question: "How many dispensaries are in Springfield?",
      answer:
        "Springfield currently has approximately 5–15 licensed dispensaries, with new locations continuing to open as the market matures. The exact number may vary depending on recent licensing and closures, so it's worth checking local listings or contacting the Illinois Department of Financial and Professional Regulation (IDFPR) for the most current count. Most dispensaries are concentrated in commercial corridors and easily accessible from downtown.",
    },
    {
      question: "Is Springfield close to state capitol tourism?",
      answer:
        "Yes, Springfield is home to the Illinois State Capitol and numerous historical attractions that draw visitors year-round. If you're planning to purchase cannabis while visiting for state business or tourism, remember that public consumption is strictly prohibited, especially near government buildings and the Capitol grounds. Keep all purchases in sealed, child-resistant containers and consume only in private residences.",
    },
    statewideOutOfStateFaq("Springfield"),
    statewideHoursFaq("Springfield"),
    statewideMedicalCardFaq("Springfield"),
    {
      question:
        "Are there cannabis dispensaries near downtown Springfield?",
      answer:
        "Downtown Springfield has limited direct dispensary presence, but several licensed retailers are located within a short drive in surrounding commercial areas and corridors. Most dispensaries in Springfield are situated along major retail strips and highways for easy accessibility. Check online menus and directions before visiting to ensure you're going to the most convenient location.",
    },
    statewideOnlineOrderFaq("Springfield"),
  ],
  relatedCities: relatedCities("springfield"),
};
