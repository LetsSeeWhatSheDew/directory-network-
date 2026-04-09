import type { NeighborhoodConfig } from "@/components/NeighborhoodPage";
import { CITY_CONFIG as CHICAGO_CONFIG } from "@/config/cities/illinois/chicago";
import { firstTimerSteps } from "@/config/cities/illinois/shared";

export const NEIGHBORHOOD_CONFIG: NeighborhoodConfig = {
  neighborhood: "Wrigleyville",
  slug: "wrigleyville",
  city: "Chicago",
  state: "Illinois",
  citySlug: "chicago",
  heroIntro:
    "Wrigleyville is the vibrant heart of Chicago's north side, centered around the iconic Wrigley Field and the bustling Clark Street corridor. Known for its energetic nightlife, young demographic, and year-round foot traffic from baseball fans and tourists, Wrigleyville offers multiple cannabis dispensaries within walking distance. Sunnyside Dispensary on Clark Street is a long-standing anchor for the neighborhood, and newer shops are constantly opening to serve both locals and visitors. Whether you're grabbing cannabis before a game or exploring the neighborhood's trendy bars and restaurants, you'll find convenient access to quality products.",
  stats: [
    { label: "Dispensaries", value: "2–3" },
    { label: "Main Strip", value: "Clark Street" },
    { label: "Foot Traffic", value: "High (tourist-heavy)" },
  ],
  laws: CHICAGO_CONFIG.laws,
  firstTimerSteps: firstTimerSteps("Wrigleyville"),
  priceBlurb:
    "Flower prices in Wrigleyville tend to run $45–70 per eighth before tax, slightly above the city average due to high foot traffic. Pre-rolls are $18–32, and edibles start around $20–25 for 100mg THC. Because the neighborhood attracts out-of-state visitors and Cubs fans, dispensaries often feature premium product selections and competitive deals to draw walk-in traffic.",
  faqs: [
    {
      question: "Are there dispensaries near Wrigley Field?",
      answer:
        "Yes. Sunnyside Dispensary is the most well-known option on Clark Street, just steps from Wrigley Field. Several other shops have opened along Clark Avenue in recent years. If you're headed to a Cubs game, plan to stop by 30–60 minutes before the game starts to avoid game-time crowds.",
    },
    {
      question: "Can I buy cannabis on game day?",
      answer:
        "Absolutely. Dispensaries in Wrigleyville are open year-round, including game days. However, expect longer lines and more foot traffic on days when the Cubs play at home, especially if the game time is evening. If possible, visit early in the day or use online ordering for pickup.",
    },
    {
      question: "Are there dispensaries open late in Wrigleyville?",
      answer:
        "Most Wrigleyville dispensaries close by 8:00–9:00 PM, which is earlier than some downtown locations. If you need late-night options, you might need to travel to River North or the Loop. Check current hours online, as some locations may have extended hours on weekends.",
    },
    {
      question: "Is Wrigleyville expensive for cannabis?",
      answer:
        "Wrigleyville is on the pricier side for Chicago due to high foot traffic and tourist demand. You'll likely pay slightly more than on the South Side or in industrial neighborhoods. Look for first-time customer discounts (10–20% off) and loyalty programs to offset higher baseline prices.",
    },
    {
      question: "Can I buy cannabis to bring into Wrigley Field?",
      answer:
        "No. Cannabis is prohibited inside Wrigley Field and all Cubs properties. Public consumption is illegal in Chicago parks, including the area around the stadium. Consume your cannabis only in a private residence where you have permission from the property owner.",
    },
    {
      question: "What's the best way to visit a Wrigleyville dispensary?",
      answer:
        "Plan ahead by checking menus online and placing an order for pickup if the dispensary offers it. This lets you skip the walk-in line. If you walk in, bring cash or use the ATM on-site. Bring your ID, and don't be shy about asking staff for recommendations—they're used to helping first-timers.",
    },
  ],
  relatedNeighborhoods: [
    { name: "River North", slug: "river-north" },
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
