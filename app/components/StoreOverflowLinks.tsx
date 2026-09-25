// "See all N deals at {store} →" — shown under a list that capped how many
// deals one store could take (lib/storeCap.ts). The store page has them all.
import Link from "next/link";
import type { StoreOverflow } from "../../lib/storeCap";

function tidy(name: string) {
  return name.replace(/\s*\(.*?\)\s*$/, "").replace(/^nuera\b/i, "nuEra");
}

export default function StoreOverflowLinks({
  stores,
  city,
  note = true,
}: {
  stores: StoreOverflow[];
  /** Carries ?city= onto the store link, matching the list's own links. */
  city?: string | null;
  note?: boolean;
}) {
  if (!stores.length) return null;
  return (
    <div style={{ margin: "10px 0 18px", display: "flex", flexDirection: "column", gap: 6 }}>
      {note && (
        <p style={{ fontSize: ".8rem", color: "var(--pp-muted)", margin: 0 }}>
          We show a few deals per store here so every store gets seen.
        </p>
      )}
      {stores.map((s) => (
        <Link
          key={s.key}
          href={`/dispensary/${s.slug}${city ? `?city=${encodeURIComponent(city)}` : ""}`}
          style={{ fontSize: ".9rem", fontWeight: 600, color: "var(--pp-signal-ink)", textDecoration: "none" }}
        >
          See all {s.total} deals at {tidy(s.name)} →
        </Link>
      ))}
    </div>
  );
}
