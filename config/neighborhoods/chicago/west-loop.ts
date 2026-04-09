import type { NeighborhoodConfig } from "@/components/NeighborhoodPage";
import { CITY_CONFIG as CHICAGO_CONFIG } from "@/config/cities/illinois/chicago";
import { firstTimerSteps } from "@/config/cities/illinois/shared";

export const NEIGHBORHOOD_CONFIG: NeighborhoodConfig = {
  neighborhood: "West Loop",
  slug: "west-loop",
  city: "Chicago",
  state: "Illinois",
  citySlug: "chicago",
  heroIntro:
    "West Loop has emerged as one of Chicago's hottest neighborhoods, anchored by Restaurant Row along Randolph Street and the trendy Fulton Market district. Once an industrial area, West Loop has transformed into an upscale, vibrant neighborhood attracting foodies, young professionals, and creative entrepreneurs with its world-class restaurants, craft breweries, art galleries, and modern residential developments. The neighborhood's high foot traffic and affluent demographic support premium-positioned cannabis dispensaries. With walkable access to some of Chicago's best restaurants and shops, West Loop dispensaries serve both locals and visitors seeking quality products in a sophisticated retail environment.",
  stats: [
    { label: "Dispensaries", value: "1–2" },
    { label: "Main Area", value: "Randolph/Fulton Market" },
    { label: "Vibe", value: "Upscale, restaurant-focused, trendy" },
  ],
  laws: CHICAGO_CONFIG.laws,
  firstTimerSteps: firstTimerSteps("West Loop"),
  priceBlurb:
    "West Loop pricing is on the higher end due to the neighborhood's upscale positioning, high foot traffic, and proximity to premium restaurants and shopping. Expect $48–70 per eighth of flower before tax. Pre-rolls run $19–35. Concentrates and premium edibles are priced at the upper range. However, the quality and curation justify the premium for customers seeking high-end products while exploring the neighborhood's dining and retail scene.",
  faqs: [
    {
      question: "Are there dispensaries near Restaurant Row?",
      answer:
        "Yes. West Loop dispensaries are conveniently located near Randolph Street's Restaurant Row and the Fulton Market district. After exploring world-class restaurants and shops, you can easily visit a nearby dispensary. However, remember that cannabis consumption is illegal in restaurants, bars, and public spaces—consumption is only legal in private residences.",
    },
    {
      question: "What's special about West Loop dispensaries?",
      answer:
        "West Loop dispensaries tend to be upscale and curated, reflecting the neighborhood's premium positioning. They often feature high-quality flower from craft growers, specialty concentrates, and artisanal edibles. Staff are knowledgeable and provide personalized recommendations. The retail environment is polished and professional.",
    },
    {
      question: "Is West Loop expensive for cannabis?",
      answer:
        "Yes, West Loop is on the pricier side for Chicago cannabis, reflecting the neighborhood's affluent demographic and upscale positioning. Expect to pay 10–15% more than mid-range Chicago neighborhoods. However, you'll find premium quality and exclusive products that justify the premium pricing.",
    },
    {
      question: "Can I walk between restaurants and dispensaries?",
      answer:
        "Yes. West Loop's compact, walkable layout makes it easy to explore the neighborhood's restaurants, shops, and dispensaries on foot. The neighborhood is designed for pedestrians, and dispensaries are positioned as normal retail fixtures. Plan your visit to include dining, shopping, and a dispensary visit.",
    },
    {
      question: "Are West Loop dispensaries good for first-timers?",
      answer:
        "Absolutely. West Loop dispensaries pride themselves on customer service and education. Staff are patient, knowledgeable, and welcoming to first-timers. The professional retail environment and emphasis on quality can feel less intimidating than busier, more casual shops. It's a great place to learn about cannabis.",
    },
    {
      question: "What's the parking situation in West Loop?",
      answer:
        "Parking in West Loop can be competitive due to high foot traffic and limited street parking. However, many buildings and dispensaries have parking lots or validation. Public transit via the CTA is another good option. Plan ahead if you're driving, or consider transit to avoid parking hassles.",
    },
  ],
  relatedNeighborhoods: [
    { name: "Wrigleyville", slug: "wrigleyville" },
    { name: "River North", slug: "river-north" },
    { name: "South Loop", slug: "south-loop" },
    { name: "Wicker Park", slug: "wicker-park" },
    { name: "Logan Square", slug: "logan-square" },
    { name: "Lakeview", slug: "lakeview" },
    { name: "Pilsen", slug: "pilsen" },
    { name: "Hyde Park", slug: "hyde-park" },
    { name: "Lincoln Park", slug: "lincoln-park" },
  ],
};
