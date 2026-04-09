import type { NeighborhoodConfig } from "@/components/NeighborhoodPage";
import { CITY_CONFIG as CHICAGO_CONFIG } from "@/config/cities/illinois/chicago";
import { firstTimerSteps } from "@/config/cities/illinois/shared";

export const NEIGHBORHOOD_CONFIG: NeighborhoodConfig = {
  neighborhood: "Pilsen",
  slug: "pilsen",
  city: "Chicago",
  state: "Illinois",
  citySlug: "chicago",
  heroIntro:
    "Pilsen is Chicago's vibrant Lower West Side neighborhood, renowned for its rich Mexican-American cultural heritage, colorful street art, independent galleries, and thriving arts scene. Anchored by 18th Street—a corridor famous for murals, restaurants, cafes, and independent boutiques—Pilsen attracts artists, students, and culturally-conscious visitors seeking authentic neighborhood character. The cannabis market in Pilsen is still emerging, with a growing number of dispensaries serving both the neighborhood's long-time residents and an influx of young professionals and creative entrepreneurs. Pilsen's authentic vibe, affordable pricing, and cultural richness make it an exciting cannabis destination for those seeking something beyond mainstream retail.",
  stats: [
    { label: "Dispensaries", value: "1–2" },
    { label: "Main Corridor", value: "18th Street" },
    { label: "Character", value: "Arts hub, cultural anchor" },
  ],
  laws: CHICAGO_CONFIG.laws,
  firstTimerSteps: firstTimerSteps("Pilsen"),
  priceBlurb:
    "Pilsen offers some of Chicago's most affordable cannabis pricing, reflecting the neighborhood's younger demographic and emerging market positioning. Expect $40–58 per eighth of flower before tax. Pre-rolls run $14–24, and edibles start around $16–20 for 100mg THC. New dispensaries often run opening promotions and loyalty programs to build customer base. Pilsen is an excellent value destination for budget-conscious buyers seeking quality products at fair prices.",
  faqs: [
    {
      question: "What makes Pilsen's cannabis market special?",
      answer:
        "Pilsen's cannabis market is still emerging compared to established neighborhoods like Wrigleyville or River North. This means new dispensaries are opening with competitive pricing and opening deals. The neighborhood's young, culturally diverse, and arts-focused demographic shapes the cannabis retail environment—many shops embrace the neighborhood's artistic character and community focus.",
    },
    {
      question: "Are Pilsen dispensaries more affordable?",
      answer:
        "Yes. Pilsen offers some of Chicago's most affordable cannabis pricing, 15–25% cheaper than downtown or premium neighborhoods like River North. New dispensaries compete aggressively on price, and the neighborhood's demographic supports value positioning. This makes Pilsen a great destination for budget-conscious buyers.",
    },
    {
      question: "Can I explore Pilsen's arts scene and visit a dispensary?",
      answer:
        "Absolutely. 18th Street is famous for its murals, galleries, and independent shops. Pilsen dispensaries are part of the neighborhood's retail fabric. Plan a visit to explore the street art, dine at authentic restaurants, shop at independent boutiques, and visit a dispensary—it's an authentic Chicago neighborhood experience.",
    },
    {
      question: "Is Pilsen good for first-time buyers?",
      answer:
        "Yes. Pilsen dispensaries are typically friendly and community-oriented, with staff who are welcoming to first-timers. The neighborhood's casual, non-corporate vibe makes the experience less intimidating than big retail chains. Staff are often knowledgeable and happy to answer questions.",
    },
    {
      question: "What products are available in Pilsen?",
      answer:
        "Pilsen dispensaries carry standard cannabis products—flower, pre-rolls, edibles, concentrates, and accessories. Some emphasize local or craft producers, others focus on value brands. Because the market is still developing, selection may be more limited than in established neighborhoods. Check online menus or call ahead to confirm product availability.",
    },
    {
      question: "How is parking in Pilsen?",
      answer:
        "Pilsen has decent street parking, especially as you move away from 18th Street. Many dispensaries are accessible via public transit—the CTA Pink and Red Lines serve the neighborhood. If you're driving from the south side or suburbs, Pilsen is accessible via I-90 or surface streets. Allow time to find parking along busy 18th Street.",
    },
  ],
  relatedNeighborhoods: [
    { name: "Wrigleyville", slug: "wrigleyville" },
    { name: "River North", slug: "river-north" },
    { name: "South Loop", slug: "south-loop" },
    { name: "Wicker Park", slug: "wicker-park" },
    { name: "Logan Square", slug: "logan-square" },
    { name: "Lakeview", slug: "lakeview" },
    { name: "West Loop", slug: "west-loop" },
    { name: "Hyde Park", slug: "hyde-park" },
    { name: "Lincoln Park", slug: "lincoln-park" },
  ],
};
