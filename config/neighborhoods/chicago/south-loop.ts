import type { NeighborhoodConfig } from "@/components/NeighborhoodPage";
import { CITY_CONFIG as CHICAGO_CONFIG } from "@/config/cities/illinois/chicago";
import { firstTimerSteps } from "@/config/cities/illinois/shared";

export const NEIGHBORHOOD_CONFIG: NeighborhoodConfig = {
  neighborhood: "South Loop",
  slug: "south-loop",
  city: "Chicago",
  state: "Illinois",
  citySlug: "chicago",
  heroIntro:
    "South Loop is Chicago's rapidly developing neighborhood, anchored by the Museum Campus (home to the Field Museum, Shedd Aquarium, and Adler Planetarium), McCormick Place convention center, and a growing residential community. This prime location attracts families, convention attendees, museum visitors, and young professionals relocating to newly developed residential towers. Dispensaries in South Loop serve this diverse clientele with convenient access and a focus on serving both residents and tourists. New condos and mixed-use developments continue to transform the neighborhood, making South Loop one of Chicago's fastest-growing cannabis markets.",
  stats: [
    { label: "Dispensaries", value: "1–2" },
    { label: "Major Anchor", value: "Museum Campus & McCormick Place" },
    { label: "Growth", value: "Rapidly developing" },
  ],
  laws: CHICAGO_CONFIG.laws,
  firstTimerSteps: firstTimerSteps("South Loop"),
  priceBlurb:
    "South Loop pricing is moderate-to-competitive, slightly below downtown averages due to less foot traffic than River North or the Loop proper. Expect $45–65 per eighth of flower before tax. Pre-rolls run $15–28. The neighborhood is still developing, so new dispensaries may offer opening deals and loyalty programs to build customer base. Prices are expected to rise as the neighborhood becomes more established.",
  faqs: [
    {
      question: "Are there dispensaries near the Museum Campus?",
      answer:
        "Yes. South Loop dispensaries are located within reasonable walking or short driving distance of the Field Museum, Shedd Aquarium, and Adler Planetarium. If you're visiting these attractions, you can easily access cannabis before or after your visit—though remember that consumption is illegal in parks and museum grounds.",
    },
    {
      question: "Can I buy cannabis at McCormick Place?",
      answer:
        "McCormick Place itself does not have on-site dispensaries, but South Loop locations are a short ride away. Convention attendees staying in South Loop hotels can easily visit a nearby dispensary. Some dispensaries even offer online ordering and rapid pickup for busy travelers.",
    },
    {
      question: "Is South Loop a good neighborhood for residents?",
      answer:
        "South Loop is rapidly transforming into a vibrant residential community with new apartments, restaurants, and shops. If you live or are moving to one of the new residential towers, local dispensaries provide convenient access without needing to travel to other neighborhoods. The neighborhood is still developing, so expect new businesses to open regularly.",
    },
    {
      question: "Are South Loop dispensaries more affordable than downtown?",
      answer:
        "Yes, South Loop dispensaries are generally more affordable than premium spots like River North or the Loop, but comparable to mid-range Chicago locations. You'll find competitive pricing and new dispensaries often run opening promotions to attract customers. Loyalty programs are common.",
    },
    {
      question: "What's the parking situation for South Loop dispensaries?",
      answer:
        "South Loop has better street parking and more dedicated lots than downtown neighborhoods. Many dispensaries offer convenient parking or are easily accessible via public transit. If you're driving from the suburbs, South Loop is more accessible than north side locations.",
    },
    {
      question: "Will South Loop have more dispensaries in the future?",
      answer:
        "Likely yes. As South Loop continues to develop as a residential neighborhood, cannabis licensing opportunities may expand. The city occasionally opens new licensing periods for neighborhoods with emerging populations. Check the Illinois Department of Financial and Professional Regulation for the latest license counts and announcements.",
    },
  ],
  relatedNeighborhoods: [
    { name: "Wrigleyville", slug: "wrigleyville" },
    { name: "River North", slug: "river-north" },
    { name: "Wicker Park", slug: "wicker-park" },
    { name: "Logan Square", slug: "logan-square" },
    { name: "Lakeview", slug: "lakeview" },
    { name: "West Loop", slug: "west-loop" },
    { name: "Pilsen", slug: "pilsen" },
    { name: "Hyde Park", slug: "hyde-park" },
    { name: "Lincoln Park", slug: "lincoln-park" },
  ],
};
