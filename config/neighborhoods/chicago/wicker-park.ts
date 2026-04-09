import type { NeighborhoodConfig } from "@/components/NeighborhoodPage";
import { CITY_CONFIG as CHICAGO_CONFIG } from "@/config/cities/illinois/chicago";
import { firstTimerSteps } from "@/config/cities/illinois/shared";

export const NEIGHBORHOOD_CONFIG: NeighborhoodConfig = {
  neighborhood: "Wicker Park",
  slug: "wicker-park",
  city: "Chicago",
  state: "Illinois",
  citySlug: "chicago",
  heroIntro:
    "Wicker Park is Chicago's creative and trendy hub, known for its independent boutiques, craft coffee shops, street art, and vibrant nightlife. The neighborhood's younger demographic, artistic vibe, and focus on local businesses have made it a magnet for independent cannabis dispensaries. Unlike the chains found downtown, Wicker Park shops tend to be neighborhood-focused with curated selections, knowledgeable staff, and strong community ties. Milwaukee Avenue and the surrounding blocks host multiple dispensaries, many of which feature local artists' work and support the neighborhood's creative ethos. If you're looking for craft cannabis, boutique edibles, and a neighborhood experience, Wicker Park is the place to be.",
  stats: [
    { label: "Dispensaries", value: "2–3" },
    { label: "Vibe", value: "Trendy, artsy, local" },
    { label: "Main Strip", value: "Milwaukee Ave corridor" },
  ],
  laws: CHICAGO_CONFIG.laws,
  firstTimerSteps: firstTimerSteps("Wicker Park"),
  priceBlurb:
    "Wicker Park pricing is competitive and often slightly below city average, making it a good value destination. Flower typically runs $42–60 per eighth before tax. Pre-rolls are $14–26. Edibles and concentrates offer good mid-range pricing. Many Wicker Park dispensaries emphasize value and rotate deals frequently to support the neighborhood's price-conscious, younger demographic. Look for weekly specials and loyalty rewards.",
  faqs: [
    {
      question: "What makes Wicker Park dispensaries different?",
      answer:
        "Wicker Park dispensaries are largely independent and neighborhood-focused, rather than corporate chains. They tend to feature curated selections from smaller growers, local or craft edibles, and staff who are deeply embedded in the neighborhood community. Many showcase local art and support neighborhood events. The experience is more personal and community-oriented.",
    },
    {
      question: "Are Wicker Park dispensaries more affordable?",
      answer:
        "Yes. Wicker Park dispensaries are generally 10–15% cheaper than downtown locations. This reflects the neighborhood's younger demographic with tighter budgets and independent shops' lower overhead. Many offer weekly deals, loyalty programs, and competitive pricing to attract repeat customers.",
    },
    {
      question: "Can I find craft cannabis in Wicker Park?",
      answer:
        "Absolutely. Wicker Park dispensaries pride themselves on sourcing from independent and craft growers. You'll find small-batch flower, artisanal concentrates, and locally-made edibles. If you're interested in trying premium craft products at accessible prices, Wicker Park is ideal.",
    },
    {
      question: "Is Wicker Park good for nightlife and cannabis?",
      answer:
        "Yes. Wicker Park's bars, restaurants, and music venues make it a popular nightlife destination. Dispensaries are located throughout the neighborhood for convenient access before or after nights out. However, remember that public consumption is illegal—cannabis must be consumed in a private residence.",
    },
    {
      question: "Do Wicker Park dispensaries accept online orders?",
      answer:
        "Many do. Because Wicker Park attracts busy young professionals, several dispensaries offer online ordering for in-store pickup. Check individual shop websites or call ahead to confirm their online ordering availability and pickup windows.",
    },
    {
      question: "What's the neighborhood vibe at Wicker Park dispensaries?",
      answer:
        "Wicker Park dispensaries tend to be welcoming and unpretentious. Staff are usually knowledgeable about products and passionate about cannabis. The environment is casual and community-focused, perfect for first-timers who might feel intimidated by larger, corporate-feeling shops. Expect friendly conversation and genuine product recommendations.",
    },
  ],
  relatedNeighborhoods: [
    { name: "Wrigleyville", slug: "wrigleyville" },
    { name: "River North", slug: "river-north" },
    { name: "South Loop", slug: "south-loop" },
    { name: "Logan Square", slug: "logan-square" },
    { name: "Lakeview", slug: "lakeview" },
    { name: "West Loop", slug: "west-loop" },
    { name: "Pilsen", slug: "pilsen" },
    { name: "Hyde Park", slug: "hyde-park" },
    { name: "Lincoln Park", slug: "lincoln-park" },
  ],
};
