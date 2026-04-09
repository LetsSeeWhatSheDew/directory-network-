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
  city: "Collinsville",
  state: "Illinois",
  slug: "collinsville",
  heroIntro:
    "Collinsville, a 25,000-person town in the Illinois Metro East region on Missouri's doorstep, has become a major cannabis destination for cross-border shoppers from the St. Louis metropolitan area (2.8M+ people). Just 15 minutes from downtown St. Louis via I-55/I-70, Collinsville and the wider Metro East area offer 5–8 dispensaries with pricing that benefits from competition with Missouri's own legal market. Whether you're a local or a St. Louis resident, you'll find convenient, competitively-priced cannabis in Madison County.",
  stats: [
    { label: "Dispensaries", value: "~5-8 in Metro East" },
    { label: "Local Population", value: "~25K" },
    { label: "Region Population", value: "~150K+" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in Collinsville and Madison County. You may only consume cannabis within a private residence. This prohibition applies to parks, sidewalks, vehicles, public buildings, and any location open to the public. Violations carry fines and potential legal consequences.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Collinsville"),
  priceBlurb:
    "Collinsville's pricing is highly competitive due to the region's proximity to Missouri's legal market. Flower typically ranges from $40–55 per eighth, pre-rolls $15–22, edibles $18–28, and concentrates $45–70. This pricing is generally lower than further north in Illinois, benefiting from cross-market competition. Don't forget to add Illinois excise tax (20–35% depending on product type) to your total.",
  faqs: [
    {
      question: "How many dispensaries are near Collinsville?",
      answer:
        "The Collinsville area and broader Metro East region have approximately 5–8 licensed dispensaries, providing good access for locals and cross-border shoppers. Many are located in convenient spots with easy I-55/I-70 access for St. Louis visitors. You can easily compare products and pricing online to find the best match for your needs.",
    },
    {
      question: "Can Missouri residents buy cannabis in Collinsville?",
      answer:
        "Yes, Missouri residents aged 21+ can purchase cannabis in Collinsville and throughout Illinois with a valid government-issued photo ID. Out-of-state visitors receive half the purchase limits of Illinois residents: up to 15 grams of flower, 2.5 grams of concentrate, or 250 mg of THC in edible form per transaction. Many St. Louis residents take advantage of competitive Illinois pricing and product selection.",
    },
    {
      question: "How far is Collinsville from St. Louis?",
      answer:
        "Collinsville is approximately 15 minutes from downtown St. Louis via I-55/I-70, making it an easy drive for St. Louis residents looking to shop at Illinois dispensaries. The short distance, combined with competitive pricing and good product selection, has made Collinsville a popular cross-border shopping destination for the greater St. Louis metro area (2.8M+ residents).",
    },
    {
      question: "How does Missouri's cannabis market compare to Illinois?",
      answer:
        "Both Missouri and Illinois have legal recreational cannabis markets, but each state has its own regulations and pricing. Missouri residents often visit Collinsville and the Metro East area for competitive pricing, established product availability, and the convenience of the I-55/I-70 corridor. Cross-market shopping allows residents to find the best deals and widest selection across the region.",
    },
    statewideOutOfStateFaq("Collinsville"),
    statewideHoursFaq("Collinsville"),
    statewideMedicalCardFaq("Collinsville"),
    {
      question: "Are there dispensaries in downtown Collinsville or nearby?",
      answer:
        "Several dispensaries are located throughout the Collinsville area and the broader Metro East region, with most offering convenient access and ample parking. Many are located on major roads or near highways for easy access. Use Google Maps or dispensary directories to find the closest location to your starting point.",
    },
    statewideOnlineOrderFaq("Collinsville"),
    {
      question: "What's the population of the Metro East area that shops in Collinsville?",
      answer:
        "The greater Metro East region, which includes Collinsville and surrounding communities, has a population of over 150,000. When combined with cross-border shoppers from the St. Louis metropolitan area (2.8M+ people), Collinsville dispensaries serve a massive regional customer base looking for legal, quality cannabis.",
    },
  ],
  relatedCities: relatedCities("collinsville"),
};
