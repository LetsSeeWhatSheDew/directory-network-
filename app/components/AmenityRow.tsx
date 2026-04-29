// app/components/AmenityRow.tsx
// Spec 2.5: every amenity emoji becomes a lucide-react SVG icon at
// 16-20px, gray-700 default, navy on hover, 1.75 stroke. The mapping
// is the literal table from docs/brand/2026-04-28-identity-package.md.
//
// Usage:
//   <AmenityRow listing={listing} />
//
// The component owns the boolean → icon+label translation so the page
// doesn't need to know which icon goes with which boolean — each page
// just passes in its listing row.
//
// One emoji exception (per spec 2.5): the 🌿 footer signature is NOT
// an amenity icon; it lives in the footer literal copy and stays.

import {
  Truck,
  ShoppingBag,
  Car,
  Banknote,
  Accessibility,
  ParkingSquare,
  Award,
  CreditCard,
  Wallet,
} from "lucide-react";

type ListingFlags = {
  delivery?: boolean | null;
  online_ordering?: boolean | null;
  drive_thru?: boolean | null;
  atm_onsite?: boolean | null;
  wheelchair_accessible?: boolean | null;
  parking?: boolean | null;
  loyalty_program?: boolean | null;
  accepts_credit?: boolean | null;
  cash_only?: boolean | null;
};

type Variant = "pill" | "row";

const ICON_SIZE_PILL = 14;
const ICON_SIZE_ROW = 18;

export function AmenityRow({
  listing,
  variant = "pill",
}: {
  listing: ListingFlags;
  variant?: Variant;
}) {
  // Build the [icon, label] entries in the same order the legacy
  // emoji-string array used, so visual output stays consistent for
  // dispensaries whose amenities profile users have already seen.
  const items: Array<[React.ReactNode, string]> = [];
  const iconSize = variant === "pill" ? ICON_SIZE_PILL : ICON_SIZE_ROW;
  const iconProps = {
    size: iconSize,
    strokeWidth: 1.75,
    "aria-hidden": true,
  } as const;

  if (listing.delivery === true) items.push([<Truck key="d" {...iconProps} />, "Delivery"]);
  if (listing.online_ordering === true) items.push([<ShoppingBag key="o" {...iconProps} />, "Online ordering"]);
  if (listing.drive_thru === true) items.push([<Car key="dt" {...iconProps} />, "Drive-thru"]);
  if (listing.atm_onsite === true) items.push([<Banknote key="atm" {...iconProps} />, "ATM on-site"]);
  if (listing.wheelchair_accessible === true) items.push([<Accessibility key="a" {...iconProps} />, "Accessible"]);
  if (listing.parking === true) items.push([<ParkingSquare key="p" {...iconProps} />, "Parking"]);
  if (listing.loyalty_program === true) items.push([<Award key="l" {...iconProps} />, "Loyalty"]);
  if (listing.accepts_credit === true) items.push([<CreditCard key="c" {...iconProps} />, "Credit cards"]);
  if (listing.cash_only === true) items.push([<Wallet key="cs" {...iconProps} />, "Cash only"]);

  if (items.length === 0) return null;

  if (variant === "row") {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          fontFamily: "var(--font-ui, system-ui, sans-serif)",
          fontSize: "0.875rem",
          color: "var(--color-gray-700, #374151)",
        }}
      >
        {items.map(([icon, label]) => (
          <span
            key={label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 24,
            }}
          >
            <span style={{ display: "inline-flex", color: "var(--color-gray-500, #6B7280)" }}>{icon}</span>
            <span>{label}</span>
          </span>
        ))}
      </div>
    );
  }

  // Default: rounded pill cluster.
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map(([icon, label]) => (
        <span
          key={label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-ui, system-ui, sans-serif)",
            fontSize: "0.78rem",
            fontWeight: 500,
            color: "var(--color-gray-700, #374151)",
            background: "var(--color-white, #FFFFFF)",
            border: "1px solid var(--color-gray-200, #E8E4DA)",
            padding: "4px 10px",
            borderRadius: 100,
            transition: "border-color 150ms ease, color 150ms ease",
          }}
        >
          <span style={{ display: "inline-flex", color: "var(--color-gray-500, #6B7280)" }}>{icon}</span>
          {label}
        </span>
      ))}
    </div>
  );
}

export default AmenityRow;
