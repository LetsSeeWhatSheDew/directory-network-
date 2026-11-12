import localFont from "next/font/local";

// Gold Leaf display face: Fraunces (SIL Open Font License 1.1) pinned to the
// one cut this design uses — soft (SOFT 100), display optical size (opsz 144)
// — and subset to Latin. Cut from the Google Fonts variable file with
// fontTools; see app/components/gold/fonts/README.md. The upright bold carries
// the headlines and the savings figure (~12 KB instead of ~120 KB for the
// variable file, which kept the home page's largest paint over budget).
export const fraunces = localFont({
  src: "./fonts/Fraunces-SoftDisplay-Bold.woff2",
  variable: "--font-gold-display",
  weight: "700",
  style: "normal",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

// Italic is only the second half of a headline: loaded after first paint.
export const frauncesItalic = localFont({
  src: "./fonts/Fraunces-SoftDisplay-MediumItalic.woff2",
  variable: "--font-gold-italic",
  weight: "500",
  style: "italic",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});
