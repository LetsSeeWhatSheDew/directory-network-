import type { NeighborhoodConfig } from "@/components/NeighborhoodPage";
import { CITY_CONFIG as CHICAGO_CONFIG } from "@/config/cities/illinois/chicago";
import { firstTimerSteps } from "@/config/cities/illinois/shared";

export const NEIGHBORHOOD_CONFIG: NeighborhoodConfig = {
  neighborhood: "Hyde Park",
  slug: "hyde-park",
  city: "Chicago",
  state: "Illinois",
  citySlug: "chicago",
  heroIntro:
    "Hyde Park is Chicago's South Side anchor, home to the prestigious University of Chicago and serving as the intellectual and cultural heart of the city's south side. The neighborhood attracts students, academics, professionals, and culturally-engaged residents with its historic architecture, world-class museums like the Museum of Science and Industry, vibrant bookstores, and academic culture. Cannabis dispensaries in Hyde Park serve this educated, affluent, and academically-oriented demographic with quality products and knowledgeable service. The neighborhood's strong institutional presence and residential stability make it a reliable cannabis destination for south side residents and visitors exploring the University of Chicago campus and surrounding cultural institutions.",
  stats: [
    { label: "Dispensaries", value: "1–2" },
    { label: "Anchor", value: "University of Chicago" },
    { label: "Demographic", value: "Academic, affluent, educated" },
  ],
  laws: CHICAGO_CONFIG.laws,
  firstTimerSteps: firstTimerSteps("Hyde Park"),
  priceBlurb:
    "Hyde Park pricing is moderate-to-premium, reflecting the neighborhood's affluent, educated demographic and strong institutional anchors. Expect $46–66 per eighth of flower before tax. Pre-rolls run $17–32, and edibles start around $20–25 for 100mg THC. The neighborhood's stability and customer base support dispensaries focused on quality and customer education. Prices are competitive with mid-range Chicago neighborhoods, with some premium positioning.",
  faqs: [
    {
      question: "Are there dispensaries near the University of Chicago?",
      answer:
        "Yes. Dispensaries serve the University of Chicago community and south side residents. They are located within reasonable proximity to campus, though remember that cannabis is prohibited on university property and in all parks. Consumption is only legal in private residences where you have permission from the property owner.",
    },
    {
      question: "Can I visit a dispensary while exploring Hyde Park museums?",
      answer:
        "Yes. Hyde Park dispensaries are conveniently located, making it easy to access them before or after visiting the Museum of Science and Industry or exploring the neighborhood's cultural institutions. However, consumption is illegal in museums and public spaces—consume only in a private residence.",
    },
    {
      question: "Is Hyde Park good for students?",
      answer:
        "Hyde Park is home to thousands of University of Chicago students, and dispensaries serve this demographic. However, remember that cannabis use may conflict with university housing policies or student conduct codes. Always check your housing agreement and university policies before purchasing or consuming cannabis.",
    },
    {
      question: "What's the vibe at Hyde Park dispensaries?",
      answer:
        "Hyde Park dispensaries tend to be professional and service-oriented, catering to an educated, affluent customer base. Staff are knowledgeable and provide quality customer service. The environment is typically polished and welcoming. Many customers are academics, professionals, and educated consumers with specific product knowledge.",
    },
    {
      question: "Are Hyde Park dispensaries focused on quality?",
      answer:
        "Yes. Hyde Park dispensaries emphasize quality products, knowledgeable staff, and customer education. The neighborhood's educated demographic values informed purchasing decisions, so dispensaries often feature product information, detailed descriptions, and staff expertise. You'll find good quality control and curated selections.",
    },
    {
      question: "How is parking and transit to Hyde Park dispensaries?",
      answer:
        "Hyde Park is served by the CTA Red Line, making public transit convenient. Street parking is available but can be competitive near campus. Many dispensaries have parking lots or easy parking nearby. If coming from downtown or north side, the Red Line is a convenient transit option.",
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
    { name: "Lincoln Park", slug: "lincoln-park" },
  ],
};
