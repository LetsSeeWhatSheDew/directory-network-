import type { NeighborhoodConfig } from "@/components/NeighborhoodPage";
import { CITY_CONFIG as CHICAGO_CONFIG } from "@/config/cities/illinois/chicago";
import { firstTimerSteps } from "@/config/cities/illinois/shared";

export const NEIGHBORHOOD_CONFIG: NeighborhoodConfig = {
  neighborhood: "River North",
  slug: "river-north",
  city: "Chicago",
  state: "Illinois",
  citySlug: "chicago",
  heroIntro:
    "River North is Chicago's premier upscale dining and nightlife district, situated just north of the Chicago River with stunning architecture and world-class restaurants. This affluent neighborhood attracts high-income professionals, business travelers, and tourists seeking a premium experience. Cannabis dispensaries in River North cater to this clientele with curated product selections, elegant retail environments, and a focus on quality over volume. You'll find dispensaries offering craft flower from independent growers, premium concentrates, and rare edibles alongside knowledgeable budtenders who understand the discerning customer. Whether you're visiting for business or pleasure, River North dispensaries provide a sophisticated cannabis shopping experience.",
  stats: [
    { label: "Dispensaries", value: "2–3" },
    { label: "Vibe", value: "Upscale & premium" },
    { label: "Clientele", value: "Professionals & tourists" },
  ],
  laws: CHICAGO_CONFIG.laws,
  firstTimerSteps: firstTimerSteps("River North"),
  priceBlurb:
    "River North has the highest cannabis prices in Chicago, reflecting the neighborhood's affluent demographics and premium retail positioning. Expect to pay $55–75 per eighth of flower before tax, with luxury pre-rolls running $25–40. Concentrates are premium-tier, $70–95 per gram. However, the quality and exclusivity justify the premium for customers seeking rare or specialty products.",
  faqs: [
    {
      question: "Why is cannabis more expensive in River North?",
      answer:
        "River North's premium pricing reflects several factors: high real estate costs, affluent customer base with higher spending power, focus on curated/rare products, and a more polished retail environment. Dispensaries here prioritize quality and exclusivity over volume sales, which translates to higher margins.",
    },
    {
      question: "Are there luxury dispensaries in River North?",
      answer:
        "River North dispensaries often feature high-end design, knowledgeable staff trained in product pairing, and curated selections from craft growers. The shopping experience is more akin to a high-end retail environment than a typical dispensary. If you're seeking a premium or VIP experience, River North is the place to look.",
    },
    {
      question: "Do River North dispensaries cater to business travelers?",
      answer:
        "Yes. Many River North locations are designed with business travelers in mind—they offer online ordering, quick pickup, convenient locations near hotels, and professional service. Some dispensaries even offer loyalty programs with premium perks for frequent visitors.",
    },
    {
      question: "What products are best in River North dispensaries?",
      answer:
        "River North dispensaries excel with high-quality flower from independent growers, live resin concentrates, small-batch edibles, and rare strains that may not be available elsewhere in Chicago. If you're looking for something specific or hard-to-find, River North is worth visiting despite the premium pricing.",
    },
    {
      question: "Can I use a credit card at River North dispensaries?",
      answer:
        "Most River North dispensaries, like all Chicago shops, do not accept credit cards due to federal restrictions. However, many locations offer debit-only ATMs on-site and accept mobile payment apps. A few have experimented with alternative payment methods—call ahead to confirm your preferred payment option.",
    },
    {
      question: "Is River North good for first-time buyers?",
      answer:
        "Absolutely. River North dispensaries pride themselves on customer service and are excellent for first-timers who want a welcoming, educational experience. Staff are typically very knowledgeable and patient with questions. The premium environment can feel less intimidating to new customers compared to busier, more casual shops.",
    },
  ],
  relatedNeighborhoods: [
    { name: "Wrigleyville", slug: "wrigleyville" },
    { name: "South Loop", slug: "south-loop" },
    { name: "Wicker Park", slug: "wicker-park" },
    { name: "Logan Square", slug: "logan-square" },
    { name: "Lakeview", slug: "lakeview" },
    { name: "West Loop", slug: "west-loop" },
    { name: "Pilsen", slug: "pilsen" },
    { name: "Hyde Park", slug: "hyde-park" },
    { name: "Lincoln Park", slug: "lincoln-park" },
  ],
};
