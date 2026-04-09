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
  city: "Champaign-Urbana",
  state: "Illinois",
  slug: "champaign-urbana",
  heroIntro:
    "Home to the University of Illinois and a thriving young-adult population, Champaign-Urbana offers convenient access to cannabis with student-friendly pricing. Explore our guide to local dispensaries, consumption rules, and everything you need to know before your first visit.",
  stats: [
    { label: "Dispensaries", value: "~8" },
    { label: "Population", value: "~126K" },
    { label: "Rec & Medical", value: "Both available" },
  ],
  laws: [
    PURCHASE_LIMITS_LAW,
    {
      title: "Consumption Rules",
      body: "Public consumption of cannabis is prohibited in both Champaign and Urbana. The University of Illinois campus is strictly smoke- and vape-free under federal funding requirements. Private residences are the only legal consumption space, though many student apartments include lease restrictions on cannabis use. Always verify rental agreements before purchasing.",
    },
    ID_REQUIREMENTS_LAW,
    DRIVING_LAW,
  ],
  firstTimerSteps: firstTimerSteps("Champaign-Urbana"),
  priceBlurb:
    "Cannabis flower typically runs $40–60 per eighth ounce, pre-rolls $15–25, edibles $20–30, and concentrates $50–75. Several dispensaries offer student-friendly pricing and discounts, making Champaign-Urbana one of the more affordable markets in Illinois. Check individual store loyalty programs and student ID specials.",
  faqs: [
    {
      question: "How many dispensaries are in Champaign-Urbana?",
      answer:
        "Champaign-Urbana has approximately 8 licensed cannabis dispensaries serving the combined population of both cities. Most are located in commercial zones away from the University of Illinois campus, making them easily accessible by car or public transit. New locations may open as the market evolves, so check our directory for the most current list.",
    },
    {
      question: "Can I buy cannabis near the University of Illinois?",
      answer:
        "Yes, you can purchase cannabis near the University of Illinois, but not on campus itself. Campus is a federal smoke-free zone, and many dispensaries are clustered in nearby commercial areas, typically 10–20 minutes from campus by car or bike. As a student or visitor, you must be 21 or older with a valid photo ID. Check your rental lease and student handbook for on-campus and off-campus housing restrictions.",
    },
    {
      question: "Do dispensaries offer student discounts in Champaign-Urbana?",
      answer:
        "Many Champaign-Urbana dispensaries offer student discounts ranging from 10% to 20% on purchases when you show a valid University of Illinois student ID. Loyalty programs and first-time customer discounts are also common. We recommend calling ahead or checking online menus to confirm current promotions and pricing.",
    },
    statewideOutOfStateFaq("Champaign-Urbana"),
    statewideHoursFaq("Champaign-Urbana"),
    statewideMedicalCardFaq("Champaign-Urbana"),
    {
      question: "Are cannabis products delivered to Champaign-Urbana?",
      answer:
        "Delivery services are not yet widely available in the Champaign-Urbana area, though online ordering for in-store pickup is common. Most dispensaries allow you to browse menus online, reserve products, and skip the in-store wait. Federal regulations and state licensing requirements have made delivery logistics complex, but this may change as the market matures.",
    },
    statewideOnlineOrderFaq("Champaign-Urbana"),
  ],
  relatedCities: relatedCities("champaign-urbana"),
};
