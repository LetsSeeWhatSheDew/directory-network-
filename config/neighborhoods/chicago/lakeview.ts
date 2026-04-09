import type { NeighborhoodConfig } from "@/components/NeighborhoodPage";
import { CITY_CONFIG as CHICAGO_CONFIG } from "@/config/cities/illinois/chicago";
import { firstTimerSteps } from "@/config/cities/illinois/shared";

export const NEIGHBORHOOD_CONFIG: NeighborhoodConfig = {
  neighborhood: "Lakeview",
  slug: "lakeview",
  city: "Chicago",
  state: "Illinois",
  citySlug: "chicago",
  heroIntro:
    "Lakeview is one of Chicago's largest and most vibrant neighborhoods, anchored by beautiful lakefront parks, the Belmont and Clark Avenue corridors, and a thriving mix of residential and commercial activity. Located on the north side just south of Wrigleyville, Lakeview attracts young professionals, families, and students with its excellent schools, neighborhood parks, and bustling commercial districts. The neighborhood's diverse population and high population density support multiple cannabis dispensaries throughout the area. Whether you're exploring the lakefront, dining on Belmont Avenue, or living in one of Lakeview's popular residential blocks, you'll find convenient access to quality cannabis products.",
  stats: [
    { label: "Dispensaries", value: "3–4" },
    { label: "Main Areas", value: "Belmont/Clark" },
    { label: "Vibe", value: "Urban, diverse, family-friendly" },
  ],
  laws: CHICAGO_CONFIG.laws,
  firstTimerSteps: firstTimerSteps("Lakeview"),
  priceBlurb:
    "Lakeview pricing is moderate and competitive, reflecting the neighborhood's size and diverse customer base. Expect to pay $45–65 per eighth of flower before tax. Pre-rolls run $16–30, and edibles start around $19–24 for 100mg THC. Because Lakeview has multiple dispensaries competing for customers, you'll often find loyalty programs, weekly deals, and competitive pricing. Prices are generally in line with Chicago's mid-range neighborhoods.",
  faqs: [
    {
      question: "How many dispensaries are in Lakeview?",
      answer:
        "Lakeview has 3–4 dispensaries, making it one of the neighborhoods with the most options. This abundance means you have choices in terms of location, pricing, and product selection. Different shops serve different areas of the large neighborhood, so you'll likely find one convenient to your location or the area you're visiting.",
    },
    {
      question: "Where are Lakeview dispensaries located?",
      answer:
        "Dispensaries are scattered throughout Lakeview, with concentrations along the Belmont and Clark Avenue corridors. Some are near the lakefront parks, others in the residential blocks. Because Lakeview is a large neighborhood, use online maps or menus to find the location most convenient to your destination.",
    },
    {
      question: "Can I visit a dispensary before exploring the lakefront?",
      answer:
        "Yes. Lakeview dispensaries are conveniently located throughout the neighborhood, making it easy to visit before or after exploring the lakefront parks. However, remember that cannabis consumption is illegal in parks and on the beach. Consumption must be in a private residence.",
    },
    {
      question: "Is Lakeview good for families?",
      answer:
        "Lakeview is one of Chicago's most family-friendly neighborhoods with excellent schools, parks, and community activities. Cannabis dispensaries are normal neighborhood fixtures in Illinois, and families can easily access them. Many shops are professional and welcoming to all demographics.",
    },
    {
      question: "Are Lakeview dispensaries competitive on pricing?",
      answer:
        "Yes. Because Lakeview has multiple dispensaries, they compete on pricing, loyalty programs, and product selection. This competition benefits customers—you'll find discounts, first-time buyer deals, and weekly specials. Shop around or check online menus to find the best deals.",
    },
    {
      question: "What's the best way to find a Lakeview dispensary?",
      answer:
        "Use Google Maps or the Illinois cannabis directory to search for dispensaries in Lakeview. Most shops have online menus showing current products and pricing. Check reviews and hours before visiting. Many accept online orders for pickup, which can save time if you're planning your visit around other neighborhood activities.",
    },
  ],
  relatedNeighborhoods: [
    { name: "Wrigleyville", slug: "wrigleyville" },
    { name: "River North", slug: "river-north" },
    { name: "South Loop", slug: "south-loop" },
    { name: "Wicker Park", slug: "wicker-park" },
    { name: "Logan Square", slug: "logan-square" },
    { name: "West Loop", slug: "west-loop" },
    { name: "Pilsen", slug: "pilsen" },
    { name: "Hyde Park", slug: "hyde-park" },
    { name: "Lincoln Park", slug: "lincoln-park" },
  ],
};
