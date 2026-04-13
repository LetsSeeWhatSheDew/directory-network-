import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upgrade Your Listing | CleanList",
  description: "Choose a plan to get more visibility for your dispensary. Featured listings from $49/month.",
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Get discovered by local customers at no cost.",
    features: [
      "Basic dispensary listing",
      "Standard search placement",
      "Business hours & address",
      "Customer reviews",
    ],
    cta: "Get Started",
    href: "mailto:matthew@jacarandapeoria.com?subject=Featured+Listing+Inquiry",
    highlighted: false,
  },
  {
    name: "Featured",
    price: "$49",
    period: "/month",
    description: "Boost your visibility and attract more customers.",
    features: [
      "Everything in Free",
      "Featured badge on listing",
      "Priority search placement",
      "Menu & deal highlights",
      "Analytics dashboard",
      "Monthly performance report",
    ],
    cta: "Get Featured",
    href: "mailto:matthew@jacarandapeoria.com?subject=Featured+Listing+Inquiry",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "$149",
    period: "/month",
    description: "Maximum exposure for high-volume dispensaries.",
    features: [
      "Everything in Featured",
      "Top-of-page placement",
      "Homepage spotlight",
      "Custom brand colors",
      "Dedicated account manager",
      "Social media mentions",
      "Priority support",
    ],
    cta: "Go Premium",
    href: "mailto:matthew@jacarandapeoria.com?subject=Featured+Listing+Inquiry",
    highlighted: false,
  },
];

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-[#0a1628] py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-center text-white text-4xl font-bold mb-3">
          Upgrade Your Listing
        </h1>
        <p className="text-center text-slate-400 text-lg mb-14">
          Choose the plan that helps your dispensary stand out on CleanList
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="relative flex flex-col rounded-2xl p-8"
              style={{
                backgroundColor: tier.highlighted ? "#1a3a2a" : "#132033",
                border: tier.highlighted ? "2px solid #22c55e" : "1px solid #1e3a5f",
              }}
            >
              {tier.highlighted && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full"
                  style={{ backgroundColor: "#22c55e", color: "#0a1628" }}
                >
                  Most Popular
                </div>
              )}

              <h2 className="text-slate-100 text-xl font-bold mb-2">{tier.name}</h2>
              <div className="mb-3">
                <span
                  className="text-4xl font-extrabold"
                  style={{ color: tier.highlighted ? "#22c55e" : "#60a5fa" }}
                >
                  {tier.price}
                </span>
                <span className="text-slate-400 text-base">{tier.period}</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">{tier.description}</p>

              <ul className="flex-1 space-y-2 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-slate-300 text-sm">
                    <span className="text-green-400 font-bold">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                className="block text-center py-3 px-6 rounded-lg text-base font-bold no-underline transition-opacity hover:opacity-90"
                style={
                  tier.highlighted
                    ? { backgroundColor: "#22c55e", color: "#0a1628" }
                    : { border: "2px solid #22c55e", color: "#22c55e", backgroundColor: "transparent" }
                }
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-500 text-sm mt-12">
          Questions?{" "}
          <a
            href="mailto:matthew@jacarandapeoria.com?subject=Featured+Listing+Inquiry"
            className="text-blue-400 hover:underline"
          >
            matthew@jacarandapeoria.com
          </a>
        </p>
      </div>
    </main>
  );
}
