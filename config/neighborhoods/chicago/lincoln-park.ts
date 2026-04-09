import type { NeighborhoodConfig } from "@/components/NeighborhoodPage";
import { CITY_CONFIG as CHICAGO_CONFIG } from "@/config/cities/illinois/chicago";
import { firstTimerSteps } from "@/config/cities/illinois/shared";

export const NEIGHBORHOOD_CONFIG: NeighborhoodConfig = {
  neighborhood: "Lincoln Park",
  slug: "lincoln-park",
  city: "Chicago",
  state: "Illinois",
  citySlug: "chicago",
  heroIntro:
    "Lincoln Park is Chicago's premier north-side neighborhood, anchored by the expansive Lincoln Park—one of Chicago's most beautiful parks featuring the Lincoln Park Zoo, botanical gardens, museum campus, and lakefront recreation. This major neighborhood attracts affluent professionals, families, students (especially DePaul University), and culturally-engaged residents seeking excellent schools, upscale dining, boutique shopping, and iconic lakefront access. The neighborhood's size, affluence, and mixed demographic of professionals, families, and students support multiple cannabis dispensaries throughout the area. Dispensaries in Lincoln Park serve both long-time residents and visitors exploring the park's attractions and the neighborhood's thriving retail and dining corridors.",
  stats: [
    { label: "Dispensaries", value: "2–3" },
    { label: "Major Feature", value: "Lincoln Park + Zoo" },
    { label: "Demographic", value: "Affluent, diverse, family-oriented" },
  ],
  laws: CHICAGO_CONFIG.laws,
  firstTimerSteps: firstTimerSteps("Lincoln Park"),
  priceBlurb:
    "Lincoln Park pricing is moderate-to-premium, reflecting the neighborhood's affluent demographic and desirable location. Expect $46–68 per eighth of flower before tax. Pre-rolls run $18–33, and edibles start around $20–26 for 100mg THC. The neighborhood's size supports multiple competing dispensaries, so you'll find loyalty programs and competitive offers. Prices are generally in line with or slightly above Chicago's mid-range, reflecting the neighborhood's upscale positioning.",
  faqs: [
    {
      question: "Are there dispensaries near Lincoln Park Zoo?",
      answer:
        "Yes. Lincoln Park dispensaries are conveniently located throughout the large neighborhood, including areas near the park. However, remember that cannabis consumption is illegal in all parks and on zoo grounds. Consumption is only legal in private residences where you have permission from the property owner.",
    },
    {
      question: "How many dispensaries are in Lincoln Park?",
      answer:
        "Lincoln Park has 2–3 dispensaries scattered throughout the large neighborhood, with concentrations along the main retail corridors and residential areas. The abundance of options means you'll find one convenient to your location or the area you're visiting. Use online maps to find the shop nearest to you.",
    },
    {
      question: "Is Lincoln Park good for families?",
      answer:
        "Lincoln Park is one of Chicago's most family-friendly neighborhoods with excellent schools, beautiful parks, family-oriented restaurants, and community activities. Cannabis dispensaries are normal neighborhood retail fixtures in Illinois, and families can easily access them. Many shops are professional and welcoming to all demographics.",
    },
    {
      question: "Is Lincoln Park expensive for cannabis?",
      answer:
        "Lincoln Park is on the pricier side for Chicago, reflecting the neighborhood's affluent demographic and desirable location. Expect to pay slightly more than mid-range neighborhoods. However, multiple competing dispensaries mean you'll find loyalty programs and deals. The neighborhood's size provides choice and competitive pricing.",
    },
    {
      question: "Is Lincoln Park good for DePaul students?",
      answer:
        "Lincoln Park is home to many DePaul University students and serves as an extension of the campus. Dispensaries cater to this demographic. However, always check your housing agreement and DePaul's student conduct policies regarding cannabis use on or off campus. Many student housing prohibitions apply beyond campus boundaries.",
    },
    {
      question: "What's special about Lincoln Park dispensaries?",
      answer:
        "Lincoln Park dispensaries range from upscale, curated shops to accessible neighborhood fixtures. They tend to emphasize quality, customer service, and community. Many are professional and welcoming to new customers. The neighborhood's diverse population shapes retail variety—you'll find different positioning and pricing depending on the shop and location.",
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
    { name: "Pilsen", slug: "pilsen" },
    { name: "Hyde Park", slug: "hyde-park" },
  ],
};
