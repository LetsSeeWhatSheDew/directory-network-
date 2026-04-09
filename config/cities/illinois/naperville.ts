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
  city: "Naperville",
  state: "Illinois",
  slug: "naperville",
  heroIntro:
    "Naperville, an affluent Chicago suburb in DuPage County, represents one of Illinois' most prosperous communities with a population of approximately 149,000. The city features approximately 9 licensed cannabis dispensaries serving both recreational and medical customers with premium products and high-quality service. As a high-income suburb with strong purchasing power, Naperville's cannabis market attracts careful consumers seeking quality retailers with less direct SERP competition than Chicago.",
  stats: [
    { label: "Dispensaries", value: "~9" },
    { label: "Population", value: "~149K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Naperville follows DuPage County ordinances strictly prohibiting public consumption of cannabis in all public spaces. Cannabis consumption is limited to private residences and private property with owner consent. Additionally, many Naperville homes are part of homeowners associations (HOAs) that impose additional restrictions on cannabis use and possession—always review your HOA bylaws before purchasing or consuming. Violations of local ordinances carry substantial fines.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Naperville"),
  priceBlurb:
    "Cannabis prices in Naperville reflect the affluent suburb's premium market positioning, trending slightly above the statewide average. Expect to pay $50–65 per eighth for flower, $18–28 for pre-rolls, $22–35 for edibles, and $55–85 for concentrates. Quality-focused dispensaries in the area emphasize product selection and customer service, justifying the higher price points compared to other Illinois regions.",
  faqs: [
    {
      question: "How many dispensaries are in Naperville?",
      answer:
        "Naperville currently has approximately 9 licensed cannabis dispensaries serving the community and surrounding DuPage County residents. This number reflects the city's affluent population and high purchasing power, with retailers strategically located to serve the suburban market. The dispensary count may fluctuate as new licenses are issued or existing businesses change, so verify current listings before your visit.",
    },
    {
      question: "Is there a dispensary in downtown Naperville?",
      answer:
        "Most Naperville dispensaries are located on the outskirts of downtown, along major commercial corridors such as Route 59 and Ogden Avenue where retail zoning is more permissive. Downtown Naperville's strict ordinances limit cannabis retail placement in the historic district. For the most convenient location, check online menus and GPS directions to find the dispensary nearest to your current position.",
    },
    statewideOutOfStateFaq("Naperville"),
    statewideHoursFaq("Naperville"),
    statewideMedicalCardFaq("Naperville"),
    {
      question: "Do Naperville dispensaries accept cards?",
      answer:
        "Most Naperville dispensaries accept debit cards and cash due to federal banking restrictions on cannabis transactions. Credit cards are generally not accepted. All Naperville locations have on-site ATMs to accommodate customers who prefer to withdraw cash. Call ahead to confirm payment methods at your preferred retailer, as individual policies may vary.",
    },
    {
      question:
        "Are there HOA restrictions on cannabis in Naperville?",
      answer:
        "Many Naperville homes are governed by homeowners associations that impose restrictions beyond state and local law. Some HOAs prohibit cannabis possession entirely, while others limit it to private residences with strict discretion requirements. Before purchasing or consuming cannabis in Naperville, thoroughly review your HOA bylaws and contact your board if you have questions about compliance. Violations can result in fines or other enforcement actions.",
    },
    statewideOnlineOrderFaq("Naperville"),
  ],
  relatedCities: relatedCities("naperville"),
};
