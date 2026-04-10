// components/FeaturedDispensary.tsx
// Shows a "Featured" dispensary slot on city pages
// Business owners pay $49/mo to be featured in their city

import Link from "next/link";

type FeaturedListing = {
  id: string;
  name: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  address1: string | null;
  phone: string | null;
  website: string | null;
  short_description: string | null;
  logo_url: string | null;
  delivery: boolean | null;
  online_ordering: boolean | null;
  atm_onsite: boolean | null;
  wheelchair_accessible: boolean | null;
};

interface FeaturedDispensaryProps {
  listing: FeaturedListing | null;
  city: string;
}

export default function FeaturedDispensary({ listing, city }: FeaturedDispensaryProps) {
  if (!listing) {
    // No featured listing yet — show a "claim this spot" CTA
    return (
      <div style={{
        background: "linear-gradient(135deg, #0f1f3d 0%, #1e3a5f 100%)",
        borderRadius: "16px",
        padding: "28px",
        marginBottom: "24px",
        border: "1px solid #1e3a5f",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "#fef9c3",
          color: "#854d0e",
          fontSize: "0.65rem",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "3px 10px",
          borderRadius: "100px",
        }}>
          ★ Featured Spot Available
        </div>
        <p style={{
          fontSize: "0.7rem",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#a3e635",
          marginBottom: "8px",
        }}>
          Featured Dispensary · {city}
        </p>
        <h3 style={{
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#fff",
          marginBottom: "8px",
          letterSpacing: "-0.02em",
          fontFamily: "Georgia, serif",
        }}>
          Your dispensary could be here
        </h3>
        <p style={{
          fontSize: "0.875rem",
          color: "#94a3b8",
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.6,
          marginBottom: "20px",
          maxWidth: "480px",
        }}>
          Be the first dispensary customers see when they search for cannabis in {city}.
          Featured listings get priority placement, logo display, and direct contact links.
        </p>
        <Link
          href="/get-listed"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#16a34a",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            textDecoration: "none",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "0.875rem",
          }}
        >
          Get featured — $49/mo →
        </Link>
        <p style={{
          fontSize: "0.72rem",
          color: "#475569",
          fontFamily: "system-ui, sans-serif",
          marginTop: "12px",
        }}>
          Cancel anytime · No contract · Live within 48 hours
        </p>
      </div>
    );
  }

  // Featured listing exists — show it prominently
  const initial = (listing.name ?? "?").charAt(0).toUpperCase();

  return (
    <div style={{
      background: "#fff",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "24px",
      border: "2px solid #16a34a",
      position: "relative",
    }}>
      <div style={{
        position: "absolute",
        top: "-12px",
        left: "20px",
        background: "#16a34a",
        color: "#fff",
        fontSize: "0.65rem",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "3px 12px",
        borderRadius: "100px",
      }}>
        ★ Featured Dispensary
      </div>

      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #e8e5de",
          background: "#f7f6f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {listing.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={listing.logo_url}
              alt={listing.name + " logo"}
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: "6px" }}
            />
          ) : (
            <span style={{ fontSize: "1.6rem", fontWeight: 700, color: "#16a34a", fontFamily: "Georgia, serif" }}>
              {initial}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: "180px" }}>
          <Link
            href={`/l/${listing.slug}`}
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#0f1f3d",
              textDecoration: "none",
              letterSpacing: "-0.02em",
              fontFamily: "Georgia, serif",
              display: "block",
              marginBottom: "4px",
            }}
          >
            {listing.name}
          </Link>
          {listing.address1 && (
            <p style={{ fontSize: "0.8rem", color: "#6b7280", fontFamily: "system-ui, sans-serif", marginBottom: "6px" }}>
              {listing.address1}, {listing.city}, {listing.state}
            </p>
          )}
          {listing.short_description && (
            <p style={{ fontSize: "0.875rem", color: "#374151", fontFamily: "system-ui, sans-serif", lineHeight: 1.5, marginBottom: "12px" }}>
              {listing.short_description}
            </p>
          )}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {listing.delivery === true && (
              <span style={{ fontSize: "0.72rem", fontFamily: "system-ui, sans-serif", color: "#374151", background: "#f7f6f2", border: "1px solid #e8e5de", padding: "3px 10px", borderRadius: "100px" }}>
                🚗 Delivery
              </span>
            )}
            {listing.online_ordering === true && (
              <span style={{ fontSize: "0.72rem", fontFamily: "system-ui, sans-serif", color: "#374151", background: "#f7f6f2", border: "1px solid #e8e5de", padding: "3px 10px", borderRadius: "100px" }}>
                📱 Online ordering
              </span>
            )}
            {listing.atm_onsite === true && (
              <span style={{ fontSize: "0.72rem", fontFamily: "system-ui, sans-serif", color: "#374151", background: "#f7f6f2", border: "1px solid #e8e5de", padding: "3px 10px", borderRadius: "100px" }}>
                💵 ATM
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
          <Link
            href={`/l/${listing.slug}`}
            style={{
              background: "#16a34a",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "8px",
              textDecoration: "none",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
            }}
          >
            View listing →
          </Link>
          {listing.phone && (
            <a
              href={`tel:${listing.phone}`}
              style={{
                fontSize: "0.8rem",
                color: "#0f1f3d",
                textDecoration: "none",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
              }}
            >
              {listing.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
