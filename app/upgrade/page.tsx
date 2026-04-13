import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Featured | Directory Network",
  description:
    "Top placement for your dispensary listing. $49/month. Cancel anytime.",
};

const tiers = [
  {
    name: "Listed",
    price: "Free",
    period: "forever",
    description: "Get found by local customers",
    features: [
      "Basic business profile",
      "Address & hours displayed",
      "Map placement on city page",
      "Customer-facing listing page",
    ],
    cta: null,
    highlighted: false,
  },
  {
    name: "Boost",
    price: "$49",
    period: "/month",
    description: "Stand out in your city",
    features: [
      "Everything in Listed",
      "Priority placement in search results",
      "Monthly performance insights",
      "Highlighted listing badge",
      "Click-to-call tracking",
    ],
    cta: {
      label: "Get Started — $49/month",
      href: "mailto:matthew@jacarandapeoria.com?subject=Featured+Listing+Inquiry&body=Hi%20Matthew%2C%0A%0AI%27m%20interested%20in%20the%20Boost%20plan%20for%20my%20dispensary.%0A%0ABusiness%20name%3A%20%0ACity%3A%20%0A",
    },
    highlighted: true,
  },
  {
    name: "Featured",
    price: "$149",
    period: "/month",
    description: "Own your city page",
    features: [
      "Everything in Boost",
      "Top of category & city pages",
      "Direct lead alerts via email",
      "One featured spot per city",
      "Priority support & onboarding",
    ],
    cta: {
      label: "Contact Us — $149/month",
      href: "mailto:matthew@jacarandapeoria.com?subject=Featured+Listing+Inquiry&body=Hi%20Matthew%2C%0A%0AI%27m%20interested%20in%20the%20Featured%20plan%20for%20my%20dispensary.%0A%0ABusiness%20name%3A%20%0ACity%3A%20%0A",
    },
    highlighted: false,
  },
];

export default function UpgradePage() {
  return (
    <main
      style={{
        backgroundColor: "#0f1f3d",
        minHeight: "100vh",
        color: "#ffffff",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* Header */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 24px 48px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            margin: "0 0 16px",
          }}
        >
          Get Featured on{" "}
          <span style={{ color: "#16a34a" }}>Directory Network</span>
        </h1>
        <p
          style={{
            fontSize: "clamp(1.1rem, 2.5vw, 1.35rem)",
            color: "#94a3b8",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          Top placement in your city. $49/month. Cancel anytime.
        </p>
      </section>

      {/* Pricing Grid */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        {tiers.map((tier) => (
          <div
            key={tier.name}
            style={{
              backgroundColor: tier.highlighted ? "#162a4a" : "#0a1628",
              border: tier.highlighted
                ? "2px solid #16a34a"
                : "1px solid #1e3a5f",
              borderRadius: "16px",
              padding: "40px 32px",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              transform: tier.highlighted ? "scale(1.04)" : "none",
            }}
          >
            {tier.highlighted && (
              <span
                style={{
                  position: "absolute",
                  top: "-14px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontWeight: 700,
                  padding: "4px 16px",
                  borderRadius: "999px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Most Popular
              </span>
            )}

            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                margin: "0 0 8px",
              }}
            >
              {tier.name}
            </h2>

            <div style={{ margin: "0 0 8px" }}>
              <span style={{ fontSize: "2.75rem", fontWeight: 700 }}>
                {tier.price}
              </span>
              <span
                style={{
                  fontSize: "1rem",
                  color: "#94a3b8",
                  marginLeft: "4px",
                }}
              >
                {tier.period}
              </span>
            </div>

            <p
              style={{
                color: "#94a3b8",
                fontSize: "0.95rem",
                margin: "0 0 24px",
                fontFamily: "Arial, Helvetica, sans-serif",
              }}
            >
              {tier.description}
            </p>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 32px",
                flex: 1,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "0.95rem",
                lineHeight: 1.8,
              }}
            >
              {tier.features.map((feature) => (
                <li key={feature} style={{ paddingLeft: "24px", position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      color: "#16a34a",
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            {tier.cta ? (
              <a
                href={tier.cta.href}
                style={{
                  display: "block",
                  textAlign: "center",
                  backgroundColor: tier.highlighted ? "#16a34a" : "transparent",
                  color: tier.highlighted ? "#fff" : "#16a34a",
                  border: tier.highlighted ? "none" : "2px solid #16a34a",
                  borderRadius: "12px",
                  padding: "16px 24px",
                  fontSize: "1.05rem",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                  cursor: "pointer",
                }}
              >
                {tier.cta.label}
              </a>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "0.9rem",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  padding: "16px 0",
                }}
              >
                Included with every listing
              </div>
            )}
          </div>
        ))}
      </section>

      {/* FAQ / Trust section */}
      <section
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: "0 24px 80px",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "24px",
          }}
        >
          Frequently Asked Questions
        </h3>
        <div
          style={{
            textAlign: "left",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "0.95rem",
            lineHeight: 1.8,
            color: "#cbd5e1",
          }}
        >
          <p style={{ marginBottom: "20px" }}>
            <strong style={{ color: "#fff" }}>Is there a contract?</strong>
            <br />
            No. Month-to-month, cancel anytime. No setup fees, no hidden costs.
          </p>
          <p style={{ marginBottom: "20px" }}>
            <strong style={{ color: "#fff" }}>
              How many featured spots per city?
            </strong>
            <br />
            One. The Featured placement is exclusive — only one dispensary per
            city gets the top spot. First come, first served.
          </p>
          <p style={{ marginBottom: "20px" }}>
            <strong style={{ color: "#fff" }}>How does this compare to Leafly or Weedmaps?</strong>
            <br />
            Leafly starts around $600/month. Weedmaps starts around $495/month.
            Our Boost plan is $49/month with one-per-city exclusivity they
            don&apos;t offer.
          </p>
          <p>
            <strong style={{ color: "#fff" }}>Can I claim my free listing first?</strong>
            <br />
            Absolutely. Every dispensary in Illinois already has a free listing.
            Visit your listing page and click &quot;Claim Your Listing&quot; — no payment
            needed.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "48px 24px 80px",
          borderTop: "1px solid #1e3a5f",
        }}
      >
        <p
          style={{
            fontSize: "1.15rem",
            color: "#94a3b8",
            marginBottom: "24px",
          }}
        >
          Questions? Email{" "}
          <a
            href="mailto:matthew@jacarandapeoria.com"
            style={{ color: "#16a34a", textDecoration: "underline" }}
          >
            matthew@jacarandapeoria.com
          </a>
        </p>
      </section>
    </main>
  );
}
