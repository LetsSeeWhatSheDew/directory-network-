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
  city: "Chicago",
  state: "Illinois",
  slug: "chicago",
  heroIntro:
    "Chicago hosts the largest cannabis market in Illinois with 20-30+ licensed dispensaries spread across the city and surrounding neighborhoods. Whether you're in Lakeview, River North, South Loop, Wicker Park, or another neighborhood, you'll find multiple options for recreational and medical cannabis. The competitive market keeps prices in check, and many shops offer online ordering for quick pickups. This guide covers everything first-timers and regular consumers need to know about buying cannabis in Chicago.",
  stats: [
    { label: "Dispensaries", value: "20–30+" },
    { label: "Population", value: "~2.7M (metro ~9.5M)" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is banned throughout Chicago. City parks, the Lake Michigan shoreline, CTA transit vehicles, and public streets are all prohibited. Cannabis consumption is only permitted in private residences where you have permission from the property owner. Several social equity lounges are currently in planning stages and may offer licensed consumption venues in the future, but as of now, private consumption is the only legal option.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
    {
      title: "Local Cannabis Tax",
      body: "Chicago imposes an additional 3% municipal cannabis tax on top of Illinois state taxes. Combined with the state excise tax (10–25% depending on product type) and standard sales tax (6.25%), your total tax burden can reach 19.25%–34.25%. This is among the highest in the state, so factor it into your budget when comparing prices.",
    },
  ],
  firstTimerSteps: firstTimerSteps("Chicago"),
  priceBlurb:
    "Flower typically ranges from $45–65 per eighth before tax in Chicago. Pre-rolls run $15–30 depending on size and strain. Edibles start around $20 for 100mg of THC. Concentrates (wax, shatter, live resin) range from $55–85 per gram. Competition among dispensaries keeps prices slightly lower than downstate areas, but the additional 3% Chicago tax adds to your final bill.",
  faqs: [
    {
      question: "How many dispensaries are in Chicago?",
      answer:
        "Chicago has approximately 20–30+ licensed cannabis dispensaries, making it the most competitive market in Illinois. These range from large chains with multiple locations to independent, neighborhood-focused shops. Since new dispensaries continue to get licensed, check the Illinois Department of Financial and Professional Regulation (IDFPR) for the most up-to-date count.",
    },
    {
      question: "What's the cheapest dispensary in Chicago?",
      answer:
        "Prices vary considerably across Chicago dispensaries, and there's no single 'cheapest' option—it depends on the specific product, strain, and sales happening that day. South and west side locations often offer slightly lower prices than downtown or north shore areas due to different operating costs and customer bases. Your best strategy is to compare online menus across several dispensaries, use loyalty programs, and look for weekly deals. Many shops offer first-time customer discounts of 10–20% off, which can be significant savings.",
    },
    {
      question: "What's the tax rate on cannabis in Chicago?",
      answer:
        "Illinois state excise tax ranges from 10–25% depending on THC content, your local sales tax is 6.25%, and Chicago adds an additional 3% municipal cannabis tax. This means your total tax burden can reach 19.25%–34.25%, making Chicago among the highest-taxed cannabis markets in the state. Always factor in the full tax amount when comparing prices online or between shops.",
    },
    {
      question: "Where are the best neighborhood dispensaries in Chicago?",
      answer:
        "Chicago has thriving cannabis scenes in multiple neighborhoods. Wrigleyville is known for Wrigley Field foot traffic and Clark Street nightlife. River North features premium shops with curated selections for discerning buyers. South Loop is a rapidly growing residential area near Museum Campus and McCormick Place. Wicker Park offers independent, neighborhood-focused dispensaries with craft products and artistic vibes. Lakeview, West Loop, Pilsen, and other areas also have strong options. Each neighborhood has its own character—explore neighborhood-specific guides to find the best fit for you.",
    },
    statewideOutOfStateFaq("Chicago"),
    statewideHoursFaq("Chicago"),
    statewideMedicalCardFaq("Chicago"),
    {
      question: "Can I use a credit card at Chicago dispensaries?",
      answer:
        "Most Chicago dispensaries do not accept credit cards due to federal banking restrictions on cannabis transactions. Cash and debit cards (which require PIN verification) are the standard payment methods. Nearly all dispensaries have ATMs on-site, often with a small fee ($2–3). If you want to avoid ATM fees, plan to bring cash with you.",
    },
    statewideOnlineOrderFaq("Chicago"),
  ],
  relatedCities: relatedCities("chicago"),
};
