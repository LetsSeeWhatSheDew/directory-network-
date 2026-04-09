import type { NeighborhoodConfig } from "@/components/NeighborhoodPage";
import { CITY_CONFIG as CHICAGO_CONFIG } from "@/config/cities/illinois/chicago";
import { firstTimerSteps } from "@/config/cities/illinois/shared";

export const NEIGHBORHOOD_CONFIG: NeighborhoodConfig = {
  neighborhood: "Logan Square",
  slug: "logan-square",
  city: "Chicago",
  state: "Illinois",
  citySlug: "chicago",
  heroIntro:
    "Logan Square is one of Chicago's trendiest neighborhoods, located on the northwest side and centered around the iconic Milwaukee Avenue corridor and the historic Logan Square monument. Known for its independent boutiques, craft breweries, farm-to-table restaurants, and thriving creative community, Logan Square attracts young professionals, artists, and entrepreneurs seeking an authentic neighborhood experience. The cannabis scene here reflects the neighborhood's ethos—independent dispensaries with curated selections, craft edibles, and knowledgeable staff who engage with the community. Multiple dispensaries along Milwaukee Avenue and surrounding blocks make access convenient for both locals and visitors exploring the neighborhood's vibrant shops and dining scene.",
  stats: [
    { label: "Dispensaries", value: "2–3" },
    { label: "Main Strip", value: "Milwaukee Ave corridor" },
    { label: "Demographic", value: "Younger, trendy" },
  ],
  laws: CHICAGO_CONFIG.laws,
  firstTimerSteps: firstTimerSteps("Logan Square"),
  priceBlurb:
    "Logan Square pricing is competitive and aligned with Chicago's mid-range, typically $44–62 per eighth before tax. Pre-rolls run $16–28, and edibles start around $18–22 for 100mg THC. The neighborhood's independent dispensaries often feature weekly specials and loyalty programs. Prices reflect the neighborhood's younger demographic and focus on supporting local businesses rather than corporate markup.",
  faqs: [
    {
      question: "What dispensaries are on Milwaukee Avenue in Logan Square?",
      answer:
        "Multiple independent dispensaries are located along the Milwaukee Avenue corridor in and around Logan Square. These shops tend to be neighborhood fixtures with strong community ties. Walk the corridor or check online menus to compare selections. Many offer online ordering for quick pickup, which is convenient if you're exploring the neighborhood's shops and restaurants.",
    },
    {
      question: "Is Logan Square good for shopping and cannabis?",
      answer:
        "Absolutely. Logan Square is a premier shopping and dining destination, with independent boutiques, craft breweries, and restaurants lining Milwaukee Avenue and surrounding streets. Local dispensaries make it easy to shop before or after exploring the neighborhood. Plan your visit to include both—dispensaries, shops, and a meal.",
    },
    {
      question: "Are Logan Square dispensaries independent?",
      answer:
        "Most Logan Square dispensaries are independently owned, reflecting the neighborhood's ethos of supporting local business. These shops tend to feature curated product selections from smaller growers, local edibles, and staff who are invested in the community. The experience is more personal and community-focused than at chain locations.",
    },
    {
      question: "What's the vibe at Logan Square dispensaries?",
      answer:
        "Logan Square dispensaries are typically welcoming, casual, and community-oriented. Staff are knowledgeable and friendly, often passionate about cannabis and the neighborhood. The environments are often decorated with local art and reflect the neighborhood's creative, artistic character. First-timers will feel comfortable asking questions.",
    },
    {
      question: "Do Logan Square dispensaries offer online ordering?",
      answer:
        "Many do. Given the neighborhood's busy, young professional demographic, several dispensaries offer online ordering for in-store pickup. Check individual shop websites or call ahead to confirm availability. Online ordering can save time if you're visiting the neighborhood for shopping or dining.",
    },
    {
      question: "Is parking available near Logan Square dispensaries?",
      answer:
        "Parking can be competitive along Milwaukee Avenue, but street parking is usually available nearby, and many dispensaries have dedicated lots or are accessible via the CTA. If you're driving, allow extra time to find parking. Public transit is another good option given the neighborhood's location and CTA accessibility.",
    },
  ],
  relatedNeighborhoods: [
    { name: "Wrigleyville", slug: "wrigleyville" },
    { name: "River North", slug: "river-north" },
    { name: "South Loop", slug: "south-loop" },
    { name: "Wicker Park", slug: "wicker-park" },
    { name: "Lakeview", slug: "lakeview" },
    { name: "West Loop", slug: "west-loop" },
    { name: "Pilsen", slug: "pilsen" },
    { name: "Hyde Park", slug: "hyde-park" },
    { name: "Lincoln Park", slug: "lincoln-park" },
  ],
};
