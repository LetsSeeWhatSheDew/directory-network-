// components/CitySeoSection.tsx
// Renders the long-form SEO content for a city below the deals grid.
// Pulls from lib/cityContent.ts.

import type { CityContent } from "@/lib/cityContent";

export function CitySeoSection({ content }: { content: CityContent }) {
  return (
    <section style={{
      background: "#fff",
      borderTop: "1px solid #e8e4da",
      padding: "52px 28px",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <p style={{
          fontSize: ".7rem",
          fontWeight: 700,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "#16a34a",
          fontFamily: "system-ui, sans-serif",
          marginBottom: 6,
        }}>
          About {content.cityName}, IL
        </p>
        <h2 style={{
          fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
          fontWeight: 700,
          color: "#0f1f3d",
          letterSpacing: "-.03em",
          marginBottom: 18,
        }}>
          The {content.cityName} dispensary scene
        </h2>

        <p style={{
          fontFamily: "Georgia, serif",
          fontSize: "1.02rem",
          lineHeight: 1.7,
          color: "#374151",
          marginBottom: 32,
        }}>
          {content.intro}
        </p>

        <div style={{
          background: "#f5f4f0",
          borderLeft: "3px solid #16a34a",
          padding: "20px 24px",
          borderRadius: "0 8px 8px 0",
          marginBottom: 32,
        }}>
          <h3 style={{
            fontSize: ".85rem",
            fontWeight: 700,
            color: "#0f1f3d",
            fontFamily: "system-ui, sans-serif",
            marginBottom: 12,
            letterSpacing: ".02em",
          }}>
            Local tips for {content.cityName}
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {content.tips.map((tip, i) => (
              <li key={i} style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: ".92rem",
                color: "#374151",
                lineHeight: 1.6,
                paddingLeft: 22,
                position: "relative",
              }}>
                <span style={{
                  position: "absolute",
                  left: 0,
                  top: 2,
                  color: "#16a34a",
                  fontWeight: 700,
                }}>
                  {i + 1}.
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#0f1f3d",
            marginBottom: 8,
          }}>
            {content.faq.q}
          </h3>
          <p style={{
            fontFamily: "Georgia, serif",
            fontSize: "1rem",
            lineHeight: 1.7,
            color: "#374151",
          }}>
            {content.faq.a}
          </p>
        </div>
      </div>
    </section>
  );
}
