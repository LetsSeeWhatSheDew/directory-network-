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
  city: "Joliet",
  state: "Illinois",
  slug: "joliet",
  heroIntro:
    "Joliet, the Will County seat and southwestern gateway to Chicagoland, has become a major dispensary hub for suburban residents and I-80 corridor travelers. With around nine licensed dispensaries, Joliet draws customers from Plainfield, Bolingbrook, New Lenox, and beyond—plus visitors on their way to and from Iowa and Indiana. Whether you're a local or passing through, you'll find convenient access to quality cannabis in the southwest suburbs.",
  stats: [
    { label: "Dispensaries", value: "~9" },
    { label: "Population", value: "~150K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited throughout Joliet and Will County. You may only consume cannabis in private residences. This includes parks, sidewalks, vehicles, and any location open to the public. Violating these rules can result in fines and criminal charges.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Joliet"),
  priceBlurb:
    "Joliet's pricing is competitive with Chicago's suburban dispensaries. Expect to pay around $45–60 per eighth for flower, $15–25 for pre-rolls, $20–30 for edibles, and $50–75 for concentrates. As with all purchases in Illinois, you'll pay the statewide excise tax on top of the listed price, which can add 20–35% to your total bill depending on the product type.",
  faqs: [
    {
      question: "How many dispensaries are in Joliet?",
      answer:
        "Joliet has approximately nine licensed dispensaries, making it one of the better-served suburbs in the Chicago metropolitan area. These locations are spread throughout the city, with several conveniently located near major highways and shopping centers. If you're new to the area, dispensary websites and Google Maps will help you find the nearest option with current hours and available stock.",
    },
    {
      question: "Is Joliet a good stop for I-80 travelers?",
      answer:
        "Yes, Joliet is an excellent stop for travelers on the I-80 corridor between Iowa and Indiana. Multiple dispensaries are located near I-80 exits, making it convenient to stop, purchase, and continue your journey. Many out-of-state visitors use Joliet as a strategic stop to stock up before heading home, thanks to Illinois' first-mover advantage in adult-use legalization and competitive pricing compared to neighboring states.",
    },
    {
      question: "What are the most popular dispensaries in Joliet?",
      answer:
        "Joliet's dispensaries range from large corporate chains to independent operators, each offering different product selections and customer experiences. Many locations feature online ordering and curbside pickup, which can save you time during peak hours. Check online reviews and visit a few shops to find the dispensary that best matches your preferences for staff knowledge, product variety, and pricing.",
    },
    statewideOutOfStateFaq("Joliet"),
    statewideHoursFaq("Joliet"),
    {
      question: "Can I buy cannabis in Joliet if I live in Indiana or Iowa?",
      answer:
        "Yes, as long as you're 21 or older with a valid government-issued photo ID, you can purchase cannabis in Joliet regardless of where you live. Out-of-state visitors receive half the purchase limits of Illinois residents: up to 15 grams of flower, 2.5 grams of concentrate, or 250 mg of THC in edible form per transaction. It's a popular option for travelers who want to take advantage of Illinois' legal market.",
    },
    statewideMedicalCardFaq("Joliet"),
    statewideOnlineOrderFaq("Joliet"),
    {
      question: "What payment methods do Joliet dispensaries accept?",
      answer:
        "Most Joliet dispensaries accept cash and debit cards, but credit cards are generally not accepted due to federal banking restrictions on cannabis. All locations have ATMs available on-site for your convenience. If you're planning a larger purchase, it's a good idea to bring cash or know where the nearest ATM is located.",
    },
  ],
  relatedCities: relatedCities("joliet"),
};
