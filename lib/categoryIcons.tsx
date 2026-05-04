// lib/categoryIcons.tsx
// Single source of truth for category iconography. Per docs/brand-system.md,
// every category icon is a Lucide line-art glyph at stroke-width 1.5 — never
// emoji, clip-art, cartoon SVGs, or branded category illustrations.
//
// Use:
//   <CategoryIcon slug="flower" size={28} />
//   <CategoryIcon slug="edibles" size={20} tone="dark" />
//
// The `tone` prop selects between two render contexts:
//   - "light"  → on cream / white surfaces (the default; sage stroke)
//   - "dark"   → on deep brand surfaces (sand stroke for contrast)

import {
  Flower2,
  Cookie,
  Wind,
  Droplets,
  Sparkles,
  Package,
  Heart,
  Smile,
  Truck,
  ShoppingBag,
  Tag,
  type LucideIcon,
} from "lucide-react";

export type CategorySlug =
  | "flower"
  | "edibles"
  | "vapes"
  | "concentrate"
  | "concentrates"
  | "topicals"
  | "accessories"
  | "cbd"
  | "recreational"
  | "delivery"
  | "pickup"
  | "deals"
  | "all";

const ICON_MAP: Record<CategorySlug, LucideIcon> = {
  flower: Flower2,
  edibles: Cookie,
  vapes: Wind,
  concentrate: Droplets,
  concentrates: Droplets,
  topicals: Sparkles,
  accessories: Package,
  cbd: Heart,
  recreational: Smile,
  delivery: Truck,
  pickup: ShoppingBag,
  deals: Tag,
  all: Tag,
};

export const CATEGORY_LABEL: Record<CategorySlug, string> = {
  flower: "Flower",
  edibles: "Edibles",
  vapes: "Vapes",
  concentrate: "Concentrates",
  concentrates: "Concentrates",
  topicals: "Topicals",
  accessories: "Accessories",
  cbd: "CBD",
  recreational: "Recreational",
  delivery: "Delivery",
  pickup: "Pickup",
  deals: "Deals",
  all: "All deals",
};

/** Top 6 categories surfaced on the homepage hero per the cleanup spec. */
export const HOME_HERO_CATEGORIES: { slug: CategorySlug; label: string }[] = [
  { slug: "flower", label: "Flower" },
  { slug: "edibles", label: "Edibles" },
  { slug: "vapes", label: "Vapes" },
  { slug: "concentrate", label: "Concentrates" },
  { slug: "topicals", label: "Topicals" },
  { slug: "accessories", label: "Accessories" },
];

type Props = {
  slug: CategorySlug | string;
  size?: number;
  /** "light" — sage on cream/white. "dark" — sand on deep green. */
  tone?: "light" | "dark";
  className?: string;
};

export function CategoryIcon({ slug, size = 28, tone = "light", className }: Props) {
  const key = (slug || "all").toLowerCase() as CategorySlug;
  const Icon = ICON_MAP[key] || ICON_MAP.all;
  const color =
    tone === "dark"
      ? "var(--color-sand, #C9A876)"
      : "var(--color-sage, #7DBA47)";
  return (
    <Icon
      size={size}
      strokeWidth={1.5}
      color={color}
      className={className}
      aria-hidden="true"
    />
  );
}

export default CategoryIcon;
