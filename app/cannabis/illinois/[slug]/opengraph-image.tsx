import { ImageResponse } from "next/og";
import { ALL_ILLINOIS_CITIES } from "@/config/cities/illinois/shared";

export const runtime = "edge";
export const alt = "Cannabis Dispensary Guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Find the city name from the slug
  const city = ALL_ILLINOIS_CITIES.find((c) => c.slug === slug);
  const cityName = city?.name || "Illinois";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#030712",
          padding: "40px",
        }}
      >
        {/* Main heading - city name */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "white",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          {cityName}
        </div>

        {/* Subheading */}
        <div
          style={{
            fontSize: "36px",
            color: "#7FE3C7",
            marginBottom: "40px",
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          Cannabis Dispensary Guide
        </div>

        {/* Branding */}
        <div
          style={{
            fontSize: "24px",
            color: "#7FE3C7",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "auto",
          }}
        >
          <span style={{ color: "white" }}>Project Green</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
