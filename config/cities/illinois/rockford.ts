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
  city: "Rockford",
  state: "Illinois",
  slug: "rockford",
  heroIntro:
    "Rockford is Illinois' third-largest city and a major cannabis hub for the northern Illinois region. With approximately 7 licensed dispensaries serving both local and cross-border customers, Rockford has become a gateway destination for Wisconsin visitors where recreational cannabis is still illegal. Situated just 15 minutes from the Wisconsin border and about 90 minutes from Madison, Rockford's dispensaries attract significant traffic from southern Wisconsin, including visitors from Beloit, Janesville, and beyond. This guide covers everything you need to know about buying cannabis in Rockford, whether you're local or visiting from out of state.",
  stats: [
    { label: "Dispensaries", value: "~7" },
    { label: "Population", value: "~148K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is strictly prohibited in Rockford and throughout Winnebago County. This includes parks, streets, public buildings, and vehicles. Cannabis consumption is only permitted in private residences where you have the property owner's permission. Winnebago County law enforcement follows state rules closely, so make sure to consume only in a private space.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Rockford"),
  priceBlurb:
    "Flower typically costs $45–60 per eighth before tax in Rockford. Pre-rolls range from $15–25. Edibles start around $20–30 for standard doses. Concentrates (wax, shatter, live resin) run $50–75 per gram. Prices in Rockford are comparable to Chicago due to steady demand from cross-border visitors, which keeps the local market competitive and inventory well-stocked.",
  faqs: [
    {
      question: "How many dispensaries are in Rockford?",
      answer:
        "Rockford has approximately 7 licensed cannabis dispensaries serving the city and surrounding Winnebago County area. This number has grown steadily as the market matures. Check the Illinois Department of Financial and Professional Regulation (IDFPR) website for the most current list of licensed retailers in Rockford.",
    },
    {
      question: "Can Wisconsin residents buy cannabis in Rockford?",
      answer:
        "Yes, Wisconsin residents can absolutely purchase cannabis in Rockford. Since recreational cannabis remains illegal in Wisconsin, many Beloit, Janesville, and Madison residents make the short drive to Rockford. Out-of-state visitors can buy up to 15 grams of flower, 2.5 grams of concentrate, or 250 mg of THC in edible form per transaction. You must have a valid government-issued photo ID proving you are 21 or older.",
    },
    {
      question: "How far is Rockford from the Wisconsin border?",
      answer:
        "Rockford is approximately 15 minutes south of the Wisconsin border near South Beloit. From downtown Rockford, it's roughly 40 minutes to Beloit, WI, 60 minutes to Janesville, WI, and about 90 minutes to Madison, WI. This proximity makes Rockford a major draw for Wisconsin visitors seeking legal cannabis before it becomes available in their home state.",
    },
    {
      question: "What should Wisconsin residents know before buying in Rockford?",
      answer:
        "Wisconsin residents can legally purchase and possess cannabis in Rockford under Illinois law. However, transporting it back across the state border into Wisconsin is illegal—Wisconsin does not recognize out-of-state cannabis purchases. You must consume your purchase before re-entering Wisconsin. Additionally, keep your receipt and products in sealed, original packaging. Never drive under the influence, and be aware that Wisconsin law enforcement may increase patrols near the border.",
    },
    {
      question: "Are Rockford dispensaries busy?",
      answer:
        "Rockford dispensaries see steady traffic, especially from Wisconsin visitors on weekends and evenings. Weekdays during business hours tend to be slower. Many Rockford shops offer online ordering and pre-orders, which can significantly reduce wait times. Arriving early in the day or using online ordering is recommended if you want to avoid crowds.",
    },
    statewideOutOfStateFaq("Rockford"),
    statewideHoursFaq("Rockford"),
    statewideMedicalCardFaq("Rockford"),
    statewideOnlineOrderFaq("Rockford"),
  ],
  relatedCities: relatedCities("rockford"),
};
