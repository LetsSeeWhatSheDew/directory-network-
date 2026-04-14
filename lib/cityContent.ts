// lib/cityContent.ts
// Long-form SEO copy keyed by city slug. Used by city deals pages and
// city landing pages to add unique above-the-fold content beyond the
// data-driven listings.
//
// Each entry: short intro, 3 local tips, 1 FAQ Q+A.
// Add new cities here as enrichment expands.

export type CityContent = {
  slug: string;
  cityName: string;
  intro: string; // ~150 words
  tips: string[]; // exactly 3
  faq: { q: string; a: string };
};

const CITIES: Record<string, CityContent> = {
  springfield: {
    slug: "springfield",
    cityName: "Springfield",
    intro:
      "Springfield is the Illinois state capital and the second-largest cannabis market in central Illinois. The city has multiple licensed dispensaries spread across the north and south sides, with most concentrated near Veterans Parkway and Stevenson Drive. Customer reviews consistently rank Springfield dispensaries among the highest-rated in downstate Illinois — High Profile and Shangri-La both maintain 4.8-star averages with hundreds of reviews. Springfield's central location makes it a natural hub for buyers from Decatur, Jacksonville, Lincoln, and the rural counties north of St. Louis. Recreational sales are strong here, but Springfield also has one of the higher rates of medical patient registrations in the state — worth knowing if you qualify, since the medical tax rate is dramatically lower.",
    tips: [
      "Stevenson Drive is the highest dispensary density in town — three locations within a 5-minute drive of each other.",
      "Most Springfield dispensaries open at 9 AM and stay open until 9 PM weekdays, 10 PM Fridays and Saturdays.",
      "If you have a medical card, the Illinois 1% medical tax (vs. ~30% recreational) pays for the card cost in 4–6 visits.",
    ],
    faq: {
      q: "Which Springfield dispensary has the best deals?",
      a: "Pricing in Springfield is competitive across all four dispensaries, with regular promotions rotating between stores. High Profile and Shangri-La both run loyalty programs that generate ongoing discounts; Maribis and Ascend run periodic flash sales. Check our live deals page for whatever is active today.",
    },
  },
  champaign: {
    slug: "champaign",
    cityName: "Champaign",
    intro:
      "Champaign is the cannabis capital of east-central Illinois, anchored by the University of Illinois and serving a metro area of roughly 235,000 people. The city has two primary dispensaries — nuEra Champaign on North Prospect and The Dispensary on North Neil — and a third option just over the line in Urbana. nuEra is part of a multi-location Illinois chain and runs one of the more generous loyalty programs in the state. The Dispensary is smaller and more boutique, with knowledgeable budtenders who spend real time with customers. Champaign-Urbana sees strong demand from Illinois State students, university faculty, and visitors from surrounding rural counties. Both stores maintain 4.8-star Google ratings.",
    tips: [
      "nuEra's loyalty program accumulates faster than most Illinois chains — worth signing up if you visit even monthly.",
      "Avoid 4–6 PM weekdays; that's the post-work rush. Mid-morning and late evening are far less crowded.",
      "Both stores accept debit cards and have on-site ATMs — credit cards are not accepted anywhere in Illinois.",
    ],
    faq: {
      q: "Is Champaign or Normal a better dispensary destination?",
      a: "It depends on your priorities. Normal has more dispensaries (4–6 within the metro) and better first-time discounts. Champaign has stronger loyalty programs and the highest-rated single store in central Illinois (nuEra). For one-off visits, Normal. For regular customers, Champaign.",
    },
  },
  normal: {
    slug: "normal",
    cityName: "Normal",
    intro:
      "Normal and Bloomington together form one of central Illinois's deepest cannabis markets, with four to six dispensaries depending on how you count the metro. High Haven Normal carries the highest Google rating in the area at 4.9 stars, while AYR Wellness and Beyond Hello provide deeper inventory and regular promotional pricing. Revolution Dispensary anchors the cultivator-direct end of the market — Revolution-grown flower is in nearly every Illinois dispensary, but their retail location lets you buy at the source. The Bloomington-Normal metro draws from Illinois State University, regional commuters, and the surrounding McLean County rural population.",
    tips: [
      "High Haven Normal is the highest-rated dispensary in the metro — start there if you're new.",
      "Beyond Hello publishes their first-time discount openly on their website; it's one of the best intro deals in central IL.",
      "Bloomington and Normal are the same metro for dispensary purposes — most stores are within a 10-minute drive of each other.",
    ],
    faq: {
      q: "Do Normal dispensaries sell to non-residents?",
      a: "Yes. All Illinois dispensaries sell to anyone 21+ with a valid government-issued photo ID, regardless of state of residence. Non-residents are limited to half the purchase quantity per transaction (15g of flower vs. 30g for IL residents).",
    },
  },
  joliet: {
    slug: "joliet",
    cityName: "Joliet",
    intro:
      "Joliet sits at the intersection of I-55 and I-80, making it one of the busiest cannabis corridors in the Chicago suburbs. The two Rise Joliet locations — Rock Creek and Colorado — are among the highest-volume dispensaries in Illinois, with Rock Creek alone holding over 2,000 Google reviews. Both maintain 4.8-star ratings and consistent inventory across flower, edibles, vapes, and concentrates. Joliet draws heavy traffic from Plainfield, Romeoville, Lockport, and the broader southwest suburbs — and from Indiana-bound travelers stopping for the last legal cannabis before crossing the state line. Both stores have free, well-lit parking and stay open until 9 or 10 PM most nights.",
    tips: [
      "Rock Creek is busier; Colorado often has shorter waits, especially after 6 PM.",
      "Both Rise locations accept debit cards and have on-site ATMs.",
      "If you're driving from Will County or Kendall County, Joliet is your closest legal option — the next nearest cluster is Aurora, 20+ minutes away.",
    ],
    faq: {
      q: "How late are Joliet dispensaries open?",
      a: "Both Rise Joliet locations close at 9 PM weekdays and 10 PM Fridays/Saturdays. Illinois state law allows dispensaries to operate until 10 PM, and most Chicago-area stores push close to that limit.",
    },
  },
  danville: {
    slug: "danville",
    cityName: "Danville",
    intro:
      "Danville is the closest Illinois cannabis market to Indiana, sitting just minutes from the state line on I-74. Sunnyside Danville carries 4.6 stars with over 3,200 Google reviews — a remarkable count for a town of 30,000, and one that tells you the majority of customers come from out of state. Seven Point Danville is the smaller, higher-rated alternative at 4.8 stars. Both stores serve a steady stream of customers from Terre Haute, Crawfordsville, Lafayette, and as far as Indianapolis. Danville's dispensaries are well-stocked, well-staffed, and practiced at walking first-time buyers through the legal cannabis experience.",
    tips: [
      "Sunnyside is the larger store with deeper selection; Seven Point is the smaller, often-faster alternative.",
      "Bring cash or debit — no credit cards anywhere in Illinois cannabis retail.",
      "Indiana visitors: buying in IL is legal, but possessing in IN is not. Understand the legal risk before crossing back.",
    ],
    faq: {
      q: "Can I bring cannabis from Danville back to Indiana?",
      a: "Legally, no. Illinois sales are completely legal, but possession of cannabis in Indiana remains a controlled-substance offense. Many Indiana visitors do make this trip — Sunnyside's 3,200+ reviews prove it — but you assume the legal risk personally.",
    },
  },
  peoria: {
    slug: "peoria",
    cityName: "Peoria",
    intro:
      "Peoria anchors central Illinois with a tight cluster of dispensaries spread across Peoria, East Peoria, and the adjacent suburbs. NOXX East Peoria leads the market on customer volume and deal frequency, while Ivy Hall Peoria and nuEra East Peoria offer competitive pricing and strong loyalty programs. The Peoria metro pulls from Tazewell, Woodford, and Marshall counties, with regular customers driving in from as far as Galesburg and Pekin. The dispensaries here are well-suited to highway access — most are within minutes of I-74 or I-474 exits.",
    tips: [
      "East Peoria has the highest dispensary density in the metro — three stores within a 10-minute drive.",
      "NOXX runs frequent vape promotions and has the most consistent deal flow in central IL.",
      "If you're coming from west of the river, the I-474 bridge to East Peoria is your fastest route to all three East Peoria dispensaries.",
    ],
    faq: {
      q: "Which Peoria dispensary has the best deals?",
      a: "Deal frequency varies day to day, but NOXX East Peoria runs the most consistent rotation of percent-off promotions, especially on vapes and concentrates. Check the live deals page for whatever is active today.",
    },
  },
};

export function getCityContent(slug: string): CityContent | null {
  return CITIES[slug.toLowerCase()] || null;
}

export function getAllCityContent(): CityContent[] {
  return Object.values(CITIES);
}

export function getCitySlugs(): string[] {
  return Object.keys(CITIES);
}
